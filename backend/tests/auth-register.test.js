jest.mock('../src/modules/auth/auth.service', () => ({
  registerGuardian: jest.fn()
}));

const {
  registerGuardian
} = require('../src/modules/auth/auth.service');
const request = require('supertest');
const baseApp = require('../src/app');

let savedGuardianId;

function fakeSessionMiddleware(req, res, next) {
  req.session = {
    regenerate(callback) {
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

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    savedGuardianId = undefined;
  });

  test('crea la sesión y devuelve 201 al registrarse correctamente', async () => {
    const input = {
      email: 'guardian@example.com',
      password: 'SecurePass!12345'
    };

    registerGuardian.mockResolvedValue({
      guardian: {
        id: 'guardian-test-1',
        email: input.email
      }
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(input);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      guardian: {
        id: 'guardian-test-1',
        email: input.email
      }
    });
    expect(registerGuardian).toHaveBeenCalledWith(input);
    expect(savedGuardianId).toBe('guardian-test-1');
  });
});