
jest.mock('../src/modules/profiles/child-auth.service', () => ({
  authenticateChild: jest.fn(),
  changeChildPin: jest.fn()
}));

const {
  authenticateChild,
  changeChildPin
} = require('../src/modules/profiles/child-auth.service');

const {
  loginChildController,
  changeChildPinController
} = require('../src/modules/profiles/child-auth.controller');

function createResponse() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    cookies: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    clearCookie(name, options) {
      this.cookies[name] = options;
      return this;
    }
  };
}

function createSession() {
  return {
    regenerate: jest.fn((callback) => callback(null)),
    save: jest.fn((callback) => callback(null)),
    destroy: jest.fn((callback) => callback(null))
  };
}

describe('Child authentication controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginChildController', () => {
    test('autentica y crea una sesión infantil', async () => {
      const profile = {
        profileId: 'profile-1',
        nickname: 'Pipo',
        avatarId: 'pipo',
        mustChangePin: true
      };

      authenticateChild.mockResolvedValue(profile);

      const req = {
        body: {
          profileId: 'profile-1',
          pin: '123456'
        },
        ip: '127.0.0.1',
        session: createSession()
      };

      const res = createResponse();
      res.locals = {
        childPinRateLimiter: { consume: jest.fn() }
      };

      await loginChildController(req, res);

      expect(authenticateChild).toHaveBeenCalledWith(
        'profile-1',
        '123456',
        res.locals.childPinRateLimiter,
        '127.0.0.1'
      );

      expect(req.session.regenerate).toHaveBeenCalled();
      expect(req.session.childProfileId).toBe('profile-1');
      expect(req.session.mustChangePin).toBe(true);
      expect(req.session.save).toHaveBeenCalled();

      expect(res.statusCode).toBe(200);
      expect(res.body.profile).toEqual({
        id: 'profile-1',
        nickname: 'Pipo',
        avatarId: 'pipo',
        mustChangePin: true
      });

      expect(JSON.stringify(res.body)).not.toContain('123456');
      expect(JSON.stringify(res.body)).not.toContain('pinHash');
    });

    test('devuelve 401 cuando las credenciales son inválidas', async () => {
      authenticateChild.mockRejectedValue({
        code: 'INVALID_CREDENTIALS'
      });

      const req = {
        body: {},
        ip: '127.0.0.1',
        session: createSession()
      };

      const res = createResponse();
      res.locals = { childPinRateLimiter: {} };

      await loginChildController(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
    });

    test('devuelve 401 cuando el ID del perfil está vacío', async () => {
      authenticateChild.mockRejectedValue({
        code: 'INVALID_CREDENTIALS'
      });

      const req = {
        body: {
          profileId: '',
          pin: '123456'
        },
        ip: '127.0.0.1',
        session: createSession()
      };

      const res = createResponse();
      res.locals = { childPinRateLimiter: {} };

      await loginChildController(req, res);

      expect(authenticateChild).toHaveBeenCalledWith(
        '',
        '123456',
        res.locals.childPinRateLimiter,
        '127.0.0.1'
      );

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
    });

    test('devuelve 429 cuando se supera el límite', async () => {
      authenticateChild.mockRejectedValue({
        code: 'TOO_MANY_REQUESTS',
        retryAfter: 900
      });

      const req = {
        body: {},
        ip: '127.0.0.1',
        session: createSession()
      };

      const res = createResponse();
      res.locals = { childPinRateLimiter: {} };

      await loginChildController(req, res);

      expect(res.statusCode).toBe(429);
      expect(res.headers['Retry-After']).toBe('900');
    });

    test('devuelve 500 ante errores inesperados', async () => {
      authenticateChild.mockRejectedValue(new Error('Database error'));

      const req = {
        body: {},
        ip: '127.0.0.1',
        session: createSession()
      };

      const res = createResponse();
      res.locals = { childPinRateLimiter: {} };

      await loginChildController(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('INTERNAL_SERVER_ERROR');
    });

    test('devuelve 500 si falla la regeneración de sesión al iniciar sesión', async () => {
      authenticateChild.mockResolvedValue({
        profileId: 'profile-1',
        nickname: 'Pipo',
        avatarId: 'pipo',
        mustChangePin: true
      });

      const session = createSession();
      session.regenerate.mockImplementation((callback) => {
        callback(new Error('Session regeneration failed'));
      });

      const req = {
        body: { profileId: 'profile-1', pin: '123456' },
        ip: '127.0.0.1',
        session
      };

      const res = createResponse();
      res.locals = { childPinRateLimiter: {} };

      await loginChildController(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('INTERNAL_SERVER_ERROR');
    });

    test('devuelve 500 si falla el guardado de sesión al iniciar sesión', async () => {
      authenticateChild.mockResolvedValue({
        profileId: 'profile-1',
        nickname: 'Pipo',
        avatarId: 'pipo',
        mustChangePin: true
      });

      const session = createSession();
      session.save.mockImplementation((callback) => {
        callback(new Error('Session save failed'));
      });

      const req = {
        body: { profileId: 'profile-1', pin: '123456' },
        ip: '127.0.0.1',
        session
      };

      const res = createResponse();
      res.locals = { childPinRateLimiter: {} };

      await loginChildController(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('INTERNAL_SERVER_ERROR');
    });

    test('devuelve 403 si el cambio de PIN no está permitido', async () => {
      changeChildPin.mockRejectedValue({
        code: 'PIN_CHANGE_NOT_ALLOWED'
      });

      const req = {
        body: { newPin: '654321', confirmationPin: '654321' },
        session: {
          childProfileId: 'profile-1',
          mustChangePin: true,
          ...createSession()
        }
      };

      const res = createResponse();

      await changeChildPinController(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('PIN_CHANGE_NOT_ALLOWED');
    });

    test('devuelve 500 ante un error inesperado al cambiar el PIN', async () => {
      changeChildPin.mockRejectedValue(new Error('Database error'));

      const req = {
        body: { newPin: '654321', confirmationPin: '654321' },
        session: {
          childProfileId: 'profile-1',
          mustChangePin: true,
          ...createSession()
        }
      };

      const res = createResponse();

      await changeChildPinController(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('changeChildPinController', () => {
    test('cambia el PIN y actualiza la sesión', async () => {
      const profile = {
        profileId: 'profile-1',
        nickname: 'Pipo',
        avatarId: 'pipo',
        mustChangePin: false
      };

      changeChildPin.mockResolvedValue(profile);

      const req = {
        body: {
          newPin: '654321',
          confirmationPin: '654321'
        },
        session: {
          childProfileId: 'profile-1',
          mustChangePin: true,
          ...createSession()
        }
      };

      const res = createResponse();

      await changeChildPinController(req, res);

      expect(changeChildPin).toHaveBeenCalledWith(
        'profile-1',
        '654321',
        '654321'
      );

      expect(req.session.mustChangePin).toBe(false);
      expect(req.session.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body.profile).toEqual(profile);
      expect(JSON.stringify(res.body)).not.toContain('654321');
    });

    test('devuelve 400 cuando los PIN no coinciden', async () => {
      changeChildPin.mockRejectedValue({
        code: 'PIN_MISMATCH'
      });

      const req = {
        body: {
          newPin: '654321',
          confirmationPin: '123456'
        },
        session: {
          childProfileId: 'profile-1',
          mustChangePin: true,
          ...createSession()
        }
      };

      const res = createResponse();

      await changeChildPinController(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('PIN_MISMATCH');
    });

    test('invalida la sesión si falla su guardado después del cambio', async () => {
      changeChildPin.mockResolvedValue({
        profileId: 'profile-1',
        mustChangePin: false
      });

      const session = createSession();
      session.save.mockImplementation((callback) => {
        callback(new Error('Session storage unavailable'));
      });

      const req = {
        body: {
          newPin: '654321',
          confirmationPin: '654321'
        },
        session: {
          childProfileId: 'profile-1',
          mustChangePin: true,
          ...session
        }
      };

      const res = createResponse();

      await changeChildPinController(req, res);

      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.statusCode).toBe(503);
      expect(res.body.error).toBe('SESSION_UPDATE_FAILED');
      expect(res.cookies['ciberheroes.sid']).toBeDefined();
    });

  });
});
