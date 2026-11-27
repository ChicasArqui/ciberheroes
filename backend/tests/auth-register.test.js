jest.mock('../src/modules/auth/auth.service', () => ({
  registerGuardian: jest.fn()
}));

const {
  registerGuardian
} = require('../src/modules/auth/auth.service');
const request = require('supertest');
const baseApp = require('../src/app');

let savedGuardianId;
let regenerateError;
let saveError;

function fakeSessionMiddleware(req, res, next) {
  req.session = {
    regenerate(callback) {
      callback(regenerateError);
    },
    save(callback) {
      savedGuardianId = this.guardianId;
      callback(saveError);
    }
  };

  next();
}

let app;

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    app = baseApp.createApp({ sessionMiddleware: fakeSessionMiddleware });
    jest.clearAllMocks();
    savedGuardianId = undefined;
    regenerateError = null;
    saveError = null;
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

  test('responde 409 si el correo ya está registrado', async () => {
    registerGuardian.mockRejectedValue(
      Object.assign(new Error('EMAIL_ALREADY_EXISTS'), {
        code: 'EMAIL_ALREADY_EXISTS'
      })
    );

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'guardian@example.com',
        password: 'ClaveSegura123!abc'
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: 'EMAIL_ALREADY_EXISTS'
    });
    expect(savedGuardianId).toBeUndefined();
  });

  test('responde 400 si los datos del registro son inválidos', async () => {
    registerGuardian.mockRejectedValue(
      Object.assign(new Error('INVALID_INPUT'), {
        code: 'INVALID_INPUT'
      })
    );

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'correo-inválido',
        password: 'x'
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'INVALID_INPUT'
    });
    expect(savedGuardianId).toBeUndefined();
  });

  test('responde 500 si falla la creación de la sesión', async () => {
    regenerateError = new Error('fallo de prueba');
    registerGuardian.mockResolvedValue({
      guardian: {
        id: 'guardian-test-1',
        email: 'guardian@example.com'
      }
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'guardian@example.com',
        password: 'ClaveSegura123!abc'
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'INTERNAL_SERVER_ERROR'
    });
    expect(savedGuardianId).toBeUndefined();
  });

  test('responde 500 si falla el guardado de la sesión', async () => {
    saveError = new Error('fallo de prueba');
    registerGuardian.mockResolvedValue({
      guardian: {
        id: 'guardian-test-1',
        email: 'guardian@example.com'
      }
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'guardian@example.com',
        password: 'ClaveSegura123!abc'
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'INTERNAL_SERVER_ERROR'
    });
    expect(savedGuardianId).toBe('guardian-test-1');
  });

  test('responde 500 si ocurre un error inesperado al registrar', async () => {
    registerGuardian.mockRejectedValue(new Error('fallo interno de prueba'));

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'guardian@example.com',
        password: 'ClaveSegura123!abc'
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'INTERNAL_SERVER_ERROR'
    });
    expect(response.body.error).not.toContain('fallo interno de prueba');
    expect(savedGuardianId).toBeUndefined();
  });
});
