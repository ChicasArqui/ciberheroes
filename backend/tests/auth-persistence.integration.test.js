const os = require('node:os');
const mongoose = require('mongoose');
const { MongoStore } = require('connect-mongo');
const request = require('supertest');
const baseApp = require('../src/app');
const { createSessionMiddleware } = require('../src/config/session');
const Guardian = require('../src/modules/auth/guardian.model');
const Family = require('../src/modules/profiles/family.model');

// Activación explícita: una URI de desarrollo existente no debe activar limpieza.
const describeWithMongo = process.env.RUN_MONGO_INTEGRATION === '1'
  ? describe
  : describe.skip;

describeWithMongo('integración real: registro, MongoDB y sesión', () => {
  let app;
  let agent;
  let sessionStore;

  beforeAll(async () => {
    const mongoUri = new URL(process.env.MONGODB_URI);
    const databaseName = mongoUri.pathname.slice(1);
    const isLocalMongo = ['127.0.0.1', 'localhost'].includes(
      mongoUri.hostname
    );

    if (databaseName !== 'ciberheroes_ci' || !isLocalMongo) {
      throw new Error(
        'La prueba solo puede borrar ciberheroes_ci en MongoDB local.'
      );
    }

    if (!process.env.SESSION_SECRET) {
      throw new Error('SESSION_SECRET debe configurarse para esta prueba.');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      runtimeAdapters: { os }
    });
    await mongoose.connection.dropDatabase();
    await Promise.all([Guardian.init(), Family.init()]);

    sessionStore = MongoStore.create({
      clientPromise: Promise.resolve(mongoose.connection.getClient()),
      collectionName: 'sessions',
      ttl: 60 * 60
    });
    const sessionMiddleware = createSessionMiddleware({ store: sessionStore });
    app = baseApp.createApp({ sessionMiddleware });
    agent = request.agent(app);
  }, 30000);

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }

    if (sessionStore) {
      await sessionStore.close();
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }, 30000);

  test('persiste Guardián y familia, mantiene la sesión y la invalida al salir', async () => {
    const password = 'ClaveSegura123!abc';
    const registration = await agent
      .post('/api/auth/register')
      .send({ email: 'integracion@example.com', password });

    expect(registration.status).toBe(201);
    expect(registration.body).toEqual({
      guardian: {
        id: expect.any(String),
        email: 'integracion@example.com'
      }
    });

    const cookie = registration.headers['set-cookie']?.join(';') || '';
    expect(cookie).toContain('ciberheroes.sid=');
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const guardian = await Guardian.findOne({
      email: 'integracion@example.com'
    }).select('+passwordHash');
    expect(guardian).not.toBeNull();
    expect(guardian.passwordHash).not.toBe(password);
    expect(guardian.passwordHash).toMatch(/^scrypt\$1\$/);

    const family = await Family.findById(guardian.familyId);
    expect(family.familyCode).toMatch(/^[A-Z0-9]{8}$/);

    const storedSessions = mongoose.connection.db.collection('sessions');
    expect(await storedSessions.countDocuments()).toBe(1);

    const familyResponse = await agent.get('/api/guardian/family');
    expect(familyResponse.status).toBe(200);
    expect(familyResponse.body).toEqual({ familyCode: family.familyCode });

    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(200);
    expect(await storedSessions.countDocuments()).toBe(0);

    const afterLogout = await agent.get('/api/guardian/family');
    expect(afterLogout.status).toBe(401);
    expect(afterLogout.body).toEqual({ error: 'AUTHENTICATION_REQUIRED' });

    const wrongLogin = await agent.post('/api/auth/login').send({
      email: 'integracion@example.com',
      password: 'ContraseñaIncorrecta!123'
    });
    expect(wrongLogin.status).toBe(401);
    expect(wrongLogin.body).toEqual({ error: 'INVALID_CREDENTIALS' });
    expect((await agent.get('/api/guardian/family')).status).toBe(401);

    const login = await agent.post('/api/auth/login').send({
      email: 'integracion@example.com',
      password
    });
    expect(login.status).toBe(200);
    expect(login.body).toEqual(registration.body);
    expect((await agent.get('/api/guardian/family')).body)
      .toEqual({ familyCode: family.familyCode });

    const duplicate = await agent.post('/api/auth/register').send({
      email: 'integracion@example.com',
      password
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toEqual({ error: 'EMAIL_ALREADY_EXISTS' });
    expect(await Guardian.countDocuments()).toBe(1);
    expect(await Family.countDocuments()).toBe(1);
  });
});
