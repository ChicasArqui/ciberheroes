const {
  requireChildSession,
  requireChildPinChange,
  requireCompletedChildSetup
} = require('../src/modules/profiles/child-auth.middleware');

function createResponse() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };

  return res;
}

describe('Child authentication middleware', () => {
  describe('requireChildSession', () => {
    test('rechaza cuando no existe sesión infantil', () => {
      const req = { session: {} };
      const res = createResponse();
      const next = jest.fn();

      requireChildSession(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('CHILD_AUTHENTICATION_REQUIRED');
      expect(next).not.toHaveBeenCalled();
    });

    test('permite una sesión infantil válida', () => {
      const req = {
        session: { childProfileId: 'child-123' }
      };
      const res = createResponse();
      const next = jest.fn();

      requireChildSession(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBeNull();
    });
  });

  describe('requireChildPinChange', () => {
    test('rechaza cuando no existe sesión infantil', () => {
      const req = { session: {} };
      const res = createResponse();
      const next = jest.fn();

      requireChildPinChange(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('rechaza si el cambio de PIN no está pendiente', () => {
      const req = {
        session: {
          childProfileId: 'child-123',
          mustChangePin: false
        }
      };
      const res = createResponse();
      const next = jest.fn();

      requireChildPinChange(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('PIN_CHANGE_NOT_REQUIRED');
      expect(next).not.toHaveBeenCalled();
    });

    test('permite cambiar el PIN cuando está pendiente', () => {
      const req = {
        session: {
          childProfileId: 'child-123',
          mustChangePin: true
        }
      };
      const res = createResponse();
      const next = jest.fn();

      requireChildPinChange(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('requireCompletedChildSetup', () => {
    test('rechaza cuando no existe sesión infantil', () => {
      const req = { session: {} };
      const res = createResponse();
      const next = jest.fn();

      requireCompletedChildSetup(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('rechaza cuando el PIN temporal sigue pendiente', () => {
      const req = {
        session: {
          childProfileId: 'child-123',
          mustChangePin: true
        }
      };
      const res = createResponse();
      const next = jest.fn();

      requireCompletedChildSetup(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('PIN_CHANGE_REQUIRED');
      expect(next).not.toHaveBeenCalled();
    });

    test('rechaza cuando mustChangePin no está definido', () => {
      const req = {
        session: { childProfileId: 'child-123' }
      };
      const res = createResponse();
      const next = jest.fn();

      requireCompletedChildSetup(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('PIN_CHANGE_REQUIRED');
      expect(next).not.toHaveBeenCalled();
    });

    test('permite el acceso cuando el PIN ya fue cambiado', () => {
      const req = {
        session: {
          childProfileId: 'child-123',
          mustChangePin: false
        }
      };
      const res = createResponse();
      const next = jest.fn();

      requireCompletedChildSetup(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBeNull();
    });
  });
});
