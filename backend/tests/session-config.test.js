const express = require('express');
const session = require('express-session');
const request = require('supertest');
const { MongoStore } = require('connect-mongo');
const { createSessionMiddleware } = require('../src/config/session');

describe('configuración de sesión', () => {
  const previousSecret = process.env.SESSION_SECRET;
  const previousNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.SESSION_SECRET = 'secreto-ficticio-solo-para-pruebas-de-sesion';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (previousSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previousSecret;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  });

  test('impide iniciar la sesión sin secreto', () => {
    delete process.env.SESSION_SECRET;
    expect(() => createSessionMiddleware()).toThrow('SESSION_SECRET');
  });

  test('crea el almacén Mongo por defecto', () => {
    const createStore = jest.spyOn(MongoStore, 'create')
      .mockReturnValue(new session.MemoryStore());

    expect(typeof createSessionMiddleware()).toBe('function');
    expect(createStore).toHaveBeenCalledWith({
      clientPromise: expect.any(Promise),
      collectionName: 'sessions',
      ttl: 3600
    });
  });

  test.each([
    ['test', false],
    ['production', true]
  ])('protege la cookie en entorno %s', async (environment, secure) => {
    process.env.NODE_ENV = environment;
    const app = express();
    app.set('trust proxy', 1);
    app.use(createSessionMiddleware({ store: new session.MemoryStore() }));
    app.get('/session-test', (req, res) => {
      req.session.guardianId = 'guardian-ficticio';
      res.json({ ok: true });
    });

    const response = await request(app).get('/session-test')
      .set('X-Forwarded-Proto', secure ? 'https' : 'http');
    const cookie = response.headers['set-cookie'].join(';');
    expect(cookie).toContain('ciberheroes.sid=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie.includes('; Secure')).toBe(secure);
  });
});
