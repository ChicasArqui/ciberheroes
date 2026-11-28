
const os = require('node:os');
const mongoose = require('mongoose');
const { MongoStore } = require('connect-mongo');
const request = require('supertest');

const baseApp = require('../src/app');
const { createSessionMiddleware } = require('../src/config/session');

const Guardian = require('../src/modules/auth/guardian.model');
const Family = require('../src/modules/profiles/family.model');
const ChildProfile = require('../src/modules/profiles/child-profile.model');

const { createAuthRateLimiters } = require('../src/modules/auth/auth-rate-limit');
const { ensureAuthIndexes } = require('../src/modules/auth/auth-indexes');
const {
  createChildPinRateLimiter
} = require('../src/modules/profiles/child-auth-rate-limit');
const {
  verifyPassword
} = require('../src/modules/auth/password.service');

const describeWithMongo = process.env.RUN_MONGO_INTEGRATION === '1'
  ? describe
  : describe.skip;

const OWNED_COLLECTIONS = [
  'sessions',
  'auth_login_ip',
  'auth_login_identity',
  'auth_login_account',
  'auth_challenge_tokens',
  'auth_register_ip',
  'auth_register_email',
  'child_pin_profile',
  'child_pin_ip'
];

describeWithMongo('integración real: perfiles y autenticación infantil', () => {
  let app;
  let sessionStore;

  const previousAutoIndex = mongoose.get('autoIndex');

  beforeAll(async () => {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI debe configurarse para esta prueba.');
    }

    const mongoUri = new URL(process.env.MONGODB_URI);
    const databaseName = mongoUri.pathname.slice(1);
    const isLocalMongo = ['127.0.0.1', 'localhost'].includes(
      mongoUri.hostname
    );

    if (
      databaseName !== 'ciberheroes_cib20_ci' ||
      !isLocalMongo
    ) {
      throw new Error(
        'La integración infantil solo admite MongoDB local y la base ciberheroes_cib20_ci.'
      );
    }

    if (!process.env.SESSION_SECRET) {
      throw new Error('SESSION_SECRET debe configurarse para esta prueba.');
    }

    mongoose.set('autoIndex', false);

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      runtimeAdapters: { os }
    });

    await ensureAuthIndexes();
    await ChildProfile.createIndexes();

    sessionStore = MongoStore.create({
      clientPromise: Promise.resolve(mongoose.connection.getClient()),
      collectionName: 'sessions',
      ttl: 60 * 60
    });

    const sessionMiddleware = createSessionMiddleware({
      store: sessionStore
    });

    const storeClient = mongoose.connection.getClient();
    const dbName = mongoose.connection.name;
    const secret = process.env.SESSION_SECRET;

    const authRateLimiters = createAuthRateLimiters({
      storeClient,
      dbName,
      secret
    });

    const childPinRateLimiter = createChildPinRateLimiter({
      storeClient,
      dbName,
      secret
    });

    await Promise.all([
      authRateLimiters.ready,
      childPinRateLimiter.ready
    ]);

    app = baseApp.createApp({
      sessionMiddleware,
      authRateLimiters,
      childPinRateLimiter
    });
  }, 30000);

  beforeEach(async () => {
    await Promise.all([
      Guardian.deleteMany({}),
      Family.deleteMany({}),
      ChildProfile.deleteMany({})
    ]);

    for (const name of OWNED_COLLECTIONS) {
      await mongoose.connection.db.collection(name).deleteMany({});
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      for (const name of OWNED_COLLECTIONS) {
        await mongoose.connection.db.collection(name).deleteMany({});
      }

      await Promise.all([
        Guardian.deleteMany({}),
        Family.deleteMany({}),
        ChildProfile.deleteMany({})
      ]);
    }

    if (sessionStore) {
      await sessionStore.close();
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    mongoose.set('autoIndex', previousAutoIndex);
  }, 30000);

  async function registerGuardian(email) {
    const guardianAgent = request.agent(app);

    const response = await guardianAgent
      .post('/api/auth/register')
      .send({
        email,
        password: 'ClaveSegura123!abc'
      });

    expect(response.status).toBe(201);

    return guardianAgent;
  }

  async function createChildProfile(guardianAgent) {
    const response = await guardianAgent
      .post('/api/guardian/profiles')
      .send({
        nickname: 'Pipo',
        avatarId: 'zorro',
        temporaryPin: '123456'
      });

    expect(response.status).toBe(201);

    return response.body.profile;
  }

  test('crea el perfil, guarda el hash y exige cambiar el PIN temporal', async () => {
    const guardianAgent = await registerGuardian(
      'guardian-integration@example.com'
    );

    const createdProfile = await createChildProfile(guardianAgent);

    expect(createdProfile).toEqual({
      id: expect.any(String),
      nickname: 'Pipo',
      avatarId: 'zorro',
      mustChangePin: true
    });

    expect(createdProfile).not.toHaveProperty('pinHash');
    expect(createdProfile).not.toHaveProperty('temporaryPin');

    const storedProfile = await ChildProfile.findById(
      createdProfile.id
    ).select('+pinHash');

    expect(storedProfile).not.toBeNull();
    expect(storedProfile.pinHash).not.toBe('123456');
    expect(
      await verifyPassword('123456', storedProfile.pinHash)
    ).toBe(true);
    expect(storedProfile.mustChangePin).toBe(true);

    const childAgent = request.agent(app);

    const login = await childAgent
      .post('/api/child/login')
      .send({
        profileId: createdProfile.id,
        pin: '123456'
      });

    expect(login.status).toBe(200);
    expect(login.body.profile).toEqual({
      id: createdProfile.id,
      nickname: 'Pipo',
      avatarId: 'zorro',
      mustChangePin: true
    });

    expect(login.body.profile).not.toHaveProperty('pinHash');

    // La sesión infantil no hereda permisos del Guardián.
    await childAgent
      .get('/api/guardian/family')
      .expect(401);

    // La sesión original del Guardián sigue funcionando.
    await guardianAgent
      .get('/api/guardian/family')
      .expect(200);

    const changePin = await childAgent
      .post('/api/child/change-pin')
      .send({
        newPin: '654321',
        confirmationPin: '654321'
      });

    expect(changePin.status).toBe(200);
    expect(changePin.body.profile.mustChangePin).toBe(false);

    const updatedProfile = await ChildProfile.findById(
      createdProfile.id
    ).select('+pinHash');

    expect(updatedProfile.mustChangePin).toBe(false);

    expect(
      await verifyPassword('123456', updatedProfile.pinHash)
    ).toBe(false);

    expect(
      await verifyPassword('654321', updatedProfile.pinHash)
    ).toBe(true);

    // El PIN temporal ya no permite iniciar sesión.
    const oldPinAgent = request.agent(app);

    await oldPinAgent
      .post('/api/child/login')
      .send({
        profileId: createdProfile.id,
        pin: '123456'
      })
      .expect(401);

    // El PIN definitivo sí permite iniciar sesión.
    const newPinAgent = request.agent(app);

    const definitiveLogin = await newPinAgent
      .post('/api/child/login')
      .send({
        profileId: createdProfile.id,
        pin: '654321'
      });

    expect(definitiveLogin.status).toBe(200);
    expect(definitiveLogin.body.profile.mustChangePin).toBe(false);
  });

  test('impide que un Guardián consulte o modifique perfiles de otra familia', async () => {
    const firstGuardian = await registerGuardian(
      'guardian-one@example.com'
    );

    const secondGuardian = await registerGuardian(
      'guardian-two@example.com'
    );

    const firstProfile = await createChildProfile(firstGuardian);

    const secondFamilyProfiles = await secondGuardian
      .get('/api/guardian/profiles');

    expect(secondFamilyProfiles.status).toBe(200);
    expect(secondFamilyProfiles.body).toEqual({
      profiles: []
    });

    const unauthorizedUpdate = await secondGuardian
      .patch(`/api/guardian/profiles/${firstProfile.id}`)
      .send({
        nickname: 'Perfil ajeno'
      });

    expect(unauthorizedUpdate.status).toBe(404);
    expect(unauthorizedUpdate.body).toEqual({
      error: 'PROFILE_NOT_FOUND'
    });

    const originalProfile = await ChildProfile.findById(
      firstProfile.id
    );

    expect(originalProfile.nickname).toBe('Pipo');

    const firstFamilyProfiles = await firstGuardian
      .get('/api/guardian/profiles');

    expect(firstFamilyProfiles.status).toBe(200);
    expect(firstFamilyProfiles.body.profiles).toHaveLength(1);
    expect(firstFamilyProfiles.body.profiles[0].nickname).toBe('Pipo');
  });
});
