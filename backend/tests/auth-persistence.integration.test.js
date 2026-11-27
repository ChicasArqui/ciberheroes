const os = require('node:os');
const mongoose = require('mongoose');
const { MongoStore } = require('connect-mongo');
const request = require('supertest');
const baseApp = require('../src/app');
const { createSessionMiddleware } = require('../src/config/session');
const Guardian = require('../src/modules/auth/guardian.model');
const Family = require('../src/modules/profiles/family.model');
const { createAuthRateLimiters } = require('../src/modules/auth/auth-rate-limit');

// Activación explícita: una URI de desarrollo existente no debe activar limpieza.
const describeWithMongo = process.env.RUN_MONGO_INTEGRATION === '1'
  ? describe
  : describe.skip;

describeWithMongo('integración real: registro, MongoDB y sesión', () => {
  let app;
  let agent;
  let sessionStore;
  let sessionMiddleware;
  function mongoRateLimiters(challengeVerifier) {
    return createAuthRateLimiters({
      storeClient: mongoose.connection.getClient(),
      dbName: mongoose.connection.name,
      secret: process.env.SESSION_SECRET,
      challengeVerifier
    });
  }

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
    sessionMiddleware = createSessionMiddleware({ store: sessionStore });
    const authRateLimiters = mongoRateLimiters();
    await authRateLimiters.ready;
    app = baseApp.createApp({ sessionMiddleware, authRateLimiters });
    agent = request.agent(app);
  }, 30000);

  beforeEach(async () => {
    for (const name of ['auth_login_ip', 'auth_login_identity', 'auth_login_account',
      'auth_challenge_tokens', 'auth_register_ip', 'auth_register_email']) {
      await mongoose.connection.db.collection(name).deleteMany({});
    }
  });

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
  test('dos cuentas tienen familias distintas y no pueden consultar la familia ajena', async () => {
    const first = request.agent(app);
    const second = request.agent(app);
    const password = 'ClaveFicticiaParaPruebas!123';
    const firstRegistration = await first.post('/api/auth/register')
      .send({ email: 'familia-a@example.com', password });
    const secondRegistration = await second.post('/api/auth/register')
      .send({ email: 'familia-b@example.com', password });
    expect(firstRegistration.status).toBe(201);
    expect(secondRegistration.status).toBe(201);

    const firstGuardian = await Guardian.findById(firstRegistration.body.guardian.id);
    const secondGuardian = await Guardian.findById(secondRegistration.body.guardian.id);
    expect(firstGuardian.familyId.toString()).not.toBe(secondGuardian.familyId.toString());

    const firstFamily = await first.get('/api/guardian/family');
    const secondFamily = await second.get('/api/guardian/family');
    expect(firstFamily.status).toBe(200);
    expect(secondFamily.status).toBe(200);
    expect(firstFamily.body.familyCode).not.toBe(secondFamily.body.familyCode);

    const spoofed = await first.get('/api/guardian/family').query({
      guardianId: secondGuardian.id,
      familyId: secondGuardian.familyId.toString()
    });
    expect(spoofed.body).toEqual(firstFamily.body);
    expect((await first.get(`/api/guardian/family/${secondGuardian.familyId}`)).status)
      .toBe(404);
    expect((await request(app).get('/api/guardian/family')).status).toBe(401);

    // Una nueva instancia del cliente representa una recarga con la misma cookie.
    const cookie = firstRegistration.headers['set-cookie'][0].split(';')[0];
    const restored = await request(app).get('/api/guardian/family').set('Cookie', cookie);
    expect(restored.body).toEqual(firstFamily.body);
    await first.post('/api/auth/logout').expect(200);
    await request(app).get('/api/guardian/family').set('Cookie', cookie).expect(401);
    expect((await second.get('/api/guardian/family')).body).toEqual(secondFamily.body);
  });

  test('un fallo al persistir el Guardián revierte también la familia', async () => {
    const guardianCount = await Guardian.countDocuments();
    const familyCount = await Family.countDocuments();
    const failingWrite = jest.spyOn(Guardian, 'create')
      .mockRejectedValueOnce(new Error('fallo ficticio de escritura MongoDB'));
    try {
      const response = await request(app).post('/api/auth/register').send({
        email: 'rollback@example.com', password: 'ClaveFicticiaParaPruebas!123'
      });
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'INTERNAL_SERVER_ERROR' });
      expect(await Guardian.countDocuments()).toBe(guardianCount);
      expect(await Family.countDocuments()).toBe(familyCount);
    } finally {
      failingWrite.mockRestore();
    }
  });

  test('el límite persiste entre instancias y expira sin guardar correo ni contraseña', async () => {
    const input = { email: 'limite@example.com', password: 'ClaveFicticia!12345' };
    // Se lanzan juntas para comprobar también el límite con concurrencia real.
    const responses = await Promise.all(Array.from({ length: 6 }, () =>
      request(app).post('/api/auth/login').send(input)));
    expect(responses.filter(response => response.status === 401)).toHaveLength(5);
    expect(responses.filter(response => response.status === 429)).toHaveLength(1);

    const authRateLimiters = mongoRateLimiters();
    await authRateLimiters.ready;
    const restarted = baseApp.createApp({ sessionMiddleware, authRateLimiters });
    await request(restarted).post('/api/auth/login').send(input).expect(429);

    const counters = mongoose.connection.db.collection('auth_login_identity');
    const documents = await counters.find().toArray();
    expect(documents).toHaveLength(1);
    expect(JSON.stringify(documents)).not.toContain(input.email);
    expect(JSON.stringify(documents)).not.toContain(input.password);
    expect(await counters.indexes()).toEqual(expect.arrayContaining([
      expect.objectContaining({ expireAfterSeconds: 0 }),
      expect.objectContaining({ unique: true })
    ]));
    await counters.updateMany({}, { $set: { expire: new Date(Date.now() - 1000) } });
    await request(restarted).post('/api/auth/login').send(input).expect(401);
  });

  test('Mongo conserva la comprobación por cuenta y el uso único del token entre instancias', async () => {
    const verify = jest.fn().mockResolvedValue(true);
    const verifier = { publicConfig: cData => ({ siteKey: 'publica-ficticia', cData }), verify };
    async function protectedApp() {
      const authRateLimiters = mongoRateLimiters(verifier);
      await authRateLimiters.ready;
      const result = baseApp.createApp({ sessionMiddleware, authRateLimiters });
      result.set('trust proxy', 1);
      return result;
    }
    const first = await protectedApp();
    const input = { email: 'distribuido@example.com', password: 'ClaveFicticia!12345' };
    for (let i = 0; i < 10; i++) {
      await request(first).post('/api/auth/login').set('X-Forwarded-For', `192.0.2.${i + 1}`)
        .send(input).expect(401);
    }
    const second = await protectedApp();
    await request(second).post('/api/auth/login').set('X-Forwarded-For', '192.0.2.100')
      .send(input).expect(403);
    const responses = await Promise.all([first, second].map(server =>
      request(server).post('/api/auth/login').set('X-Forwarded-For', '192.0.2.100')
        .send({ ...input, challengeToken: 'token-concurrente-ficticio' })));
    expect(responses.map(response => response.status).sort()).toEqual([401, 403]);
    expect(verify).toHaveBeenCalledTimes(1);
    const tokens = await mongoose.connection.db.collection('auth_challenge_tokens').find().toArray();
    expect(tokens).toHaveLength(1);
    expect(JSON.stringify(tokens)).not.toContain('token-concurrente-ficticio');
  });
});
