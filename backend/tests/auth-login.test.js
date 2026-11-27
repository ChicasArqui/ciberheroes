jest.mock('../src/modules/auth/auth.service', () => ({
  loginGuardian: jest.fn()
}));

const {
  loginGuardian
} = require('../src/modules/auth/auth.service');
const request = require('supertest');
const baseApp = require('../src/app');

let savedGuardianId;
let regenerateCalls;

function fakeSessionMiddleware(req, res, next) {
  req.session = {
    regenerate(callback) {
      regenerateCalls += 1;
      callback(null);
    },
    save(callback) {
      savedGuardianId = this.guardianId;
      callback(null);
    }
  };

  next();
}

const app = baseApp.createApp({
  sessionMiddleware: fakeSessionMiddleware
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    savedGuardianId = undefined;
    regenerateCalls = 0;
  });

  test('inicia sesión con credenciales válidas', async () => {
    const input = {
      email: 'guardian@example.com',
      password: 'SecurePass!12345'
    };

    loginGuardian.mockResolvedValue({
      guardian: {
        id: 'guardian-test-1',
        email: input.email
      }
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send(input);

    expect(response.status).toBe(200);
    expect(response.body.guardian.id).toBe('guardian-test-1');
    expect(loginGuardian).toHaveBeenCalledWith(input);
    expect(savedGuardianId).toBe('guardian-test-1');
    expect(regenerateCalls).toBe(1);
  });

  test('rechaza credenciales incorrectas sin crear sesión', async () => {
    loginGuardian.mockRejectedValue(
      Object.assign(new Error('INVALID_CREDENTIALS'), {
        code: 'INVALID_CREDENTIALS'
      })
    );

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'guardian@example.com',
        password: 'incorrecta'
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'INVALID_CREDENTIALS'
    });
    expect(regenerateCalls).toBe(0);
  });

  test('rechaza datos inválidos sin crear sesión', async () => {
    loginGuardian.mockRejectedValue(
      Object.assign(new Error('INVALID_INPUT'), {
        code: 'INVALID_INPUT'
      })
    );

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'correo-inválido',
        password: 'x'
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'INVALID_INPUT'
    });
    expect(regenerateCalls).toBe(0);
  });
});
