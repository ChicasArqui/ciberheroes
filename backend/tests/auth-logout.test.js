const request = require('supertest');
const baseApp = require('../src/app');

let destroyCalls;

function fakeSessionMiddleware(req, res, next) {
  req.session = {
    destroy(callback) {
      destroyCalls += 1;
      callback(null);
    }
  };

  next();
}

const app = baseApp.createApp({
  sessionMiddleware: fakeSessionMiddleware
});

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    destroyCalls = 0;
  });

  test('destruye la sesión y borra la cookie', async () => {
    const response = await request(app).post('/api/auth/logout');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Sesión cerrada'
    });
    expect(destroyCalls).toBe(1);
    expect(response.headers['set-cookie'][0]).toContain('ciberheroes.sid=');
  });
});