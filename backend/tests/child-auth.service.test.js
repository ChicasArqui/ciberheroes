jest.mock('../src/modules/profiles/child-profile.model', () => ({
  findById: jest.fn(),
  findOneAndUpdate: jest.fn()
}));

jest.mock('../src/modules/auth/password.service', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn()
}));

const mongoose = require('mongoose');
const ChildProfile = require('../src/modules/profiles/child-profile.model');
const {
  hashPassword,
  verifyPassword
} = require('../src/modules/auth/password.service');

const {
  authenticateChild,
  changeChildPin
} = require('../src/modules/profiles/child-auth.service');

const PROFILE_ID = '507f1f77bcf86cd799439011';
const IP = '127.0.0.1';

function createRateLimiter(overrides = {}) {
  return {
    consume: jest.fn().mockResolvedValue({ allowed: true }),
    reward: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

function createProfile(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(PROFILE_ID),
    nickname: 'Pipo',
    avatarId: 'pipo',
    pinHash: 'hashed-temporary-pin',
    mustChangePin: true,
    ...overrides
  };
}

describe('Child authentication service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateChild', () => {
    test('rechaza un ID de perfil inválido antes de consultar el limitador', async () => {
      const limiter = createRateLimiter();

      await expect(
        authenticateChild('invalid-id', '123456', limiter, IP)
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS'
      });

      expect(limiter.consume).not.toHaveBeenCalled();
      expect(ChildProfile.findById).not.toHaveBeenCalled();
    });

    test('rechaza un ID vacío antes de consultar el limitador', async () => {
      const limiter = createRateLimiter();

      await expect(
        authenticateChild('', '123456', limiter, IP)
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS'
      });

      expect(limiter.consume).not.toHaveBeenCalled();
      expect(ChildProfile.findById).not.toHaveBeenCalled();
    });

    test('rechaza una IP vacía antes de consultar el limitador', async () => {
      const limiter = createRateLimiter();

      await expect(
        authenticateChild(PROFILE_ID, '123456', limiter, '')
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS'
      });

      expect(limiter.consume).not.toHaveBeenCalled();
      expect(ChildProfile.findById).not.toHaveBeenCalled();
    });

    test('rechaza un PIN con formato inválido', async () => {
      const limiter = createRateLimiter();

      await expect(
        authenticateChild(PROFILE_ID, '12345', limiter, IP)
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS'
      });

      expect(ChildProfile.findById).not.toHaveBeenCalled();
    });

    test('rechaza cuando el perfil no existe', async () => {
      const limiter = createRateLimiter();

      ChildProfile.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await expect(
        authenticateChild(PROFILE_ID, '123456', limiter, IP)
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS'
      });

      expect(ChildProfile.findById).toHaveBeenCalledWith(PROFILE_ID);
    });

    test('rechaza un PIN incorrecto', async () => {
      const limiter = createRateLimiter();

      ChildProfile.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(createProfile())
      });

      verifyPassword.mockResolvedValue(false);

      await expect(
        authenticateChild(PROFILE_ID, '123456', limiter, IP)
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS'
      });

      expect(verifyPassword).toHaveBeenCalledWith(
        '123456',
        'hashed-temporary-pin'
      );
      expect(limiter.reward).not.toHaveBeenCalled();
    });

    test('bloquea cuando se supera el límite de intentos', async () => {
      const limiter = createRateLimiter({
        consume: jest.fn().mockResolvedValue({
          allowed: false,
          retryAfter: 900
        })
      });

      await expect(
        authenticateChild(PROFILE_ID, '123456', limiter, IP)
      ).rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
        retryAfter: 900
      });

      expect(ChildProfile.findById).not.toHaveBeenCalled();
    });

    test('autentica correctamente y devuelve datos seguros', async () => {
      const limiter = createRateLimiter();

      ChildProfile.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(createProfile())
      });

      verifyPassword.mockResolvedValue(true);

      const result = await authenticateChild(
        PROFILE_ID,
        '123456',
        limiter,
        IP
      );

      expect(result).toMatchObject({
        nickname: 'Pipo',
        avatarId: 'pipo',
        mustChangePin: true
      });

      expect(result.pinHash).toBeUndefined();
      expect(limiter.reward).toHaveBeenCalledWith(PROFILE_ID);
    });

    test('propaga errores inesperados del limitador', async () => {
      const limiter = createRateLimiter({
        consume: jest.fn().mockRejectedValue(new Error('MongoDB unavailable'))
      });

      await expect(
        authenticateChild(PROFILE_ID, '123456', limiter, IP)
      ).rejects.toThrow('MongoDB unavailable');
    });
  });

  describe('changeChildPin', () => {
    test('rechaza un ID inválido', async () => {
      await expect(
        changeChildPin('invalid-id', '654321', '654321')
      ).rejects.toMatchObject({
        code: 'INVALID_PROFILE'
      });

      expect(hashPassword).not.toHaveBeenCalled();
    });

    test('rechaza un PIN con formato inválido', async () => {
      await expect(
        changeChildPin(PROFILE_ID, '12345', '12345')
      ).rejects.toMatchObject({
        code: 'INVALID_PIN'
      });

      expect(hashPassword).not.toHaveBeenCalled();
    });

    test('rechaza cuando los PIN no coinciden', async () => {
      await expect(
        changeChildPin(PROFILE_ID, '654321', '123456')
      ).rejects.toMatchObject({
        code: 'PIN_MISMATCH'
      });

      expect(hashPassword).not.toHaveBeenCalled();
    });

    test('guarda el hash y marca el PIN como definitivo', async () => {
      hashPassword.mockResolvedValue('hashed-new-pin');

      const updatedProfile = {
        _id: PROFILE_ID,
        nickname: 'Pipo',
        avatarId: 'pipo',
        mustChangePin: false
      };

      const lean = jest.fn().mockResolvedValue(updatedProfile);
      const select = jest.fn().mockReturnValue({ lean });

      ChildProfile.findOneAndUpdate.mockReturnValue({ select });

      const result = await changeChildPin(
        PROFILE_ID,
        '654321',
        '654321'
      );

      expect(hashPassword).toHaveBeenCalledWith('654321');

      expect(ChildProfile.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: PROFILE_ID,
          mustChangePin: true
        },
        {
          $set: {
            pinHash: 'hashed-new-pin',
            mustChangePin: false
          }
        },
        {
          new: true,
          runValidators: true
        }
      );

      expect(result.mustChangePin).toBe(false);
      expect(result.pinHash).toBeUndefined();
    });

    test('impide cambiar nuevamente un PIN definitivo', async () => {
      hashPassword.mockResolvedValue('hashed-new-pin');

      const lean = jest.fn().mockResolvedValue(null);
      const select = jest.fn().mockReturnValue({ lean });

      ChildProfile.findOneAndUpdate.mockReturnValue({ select });

      await expect(
        changeChildPin(PROFILE_ID, '654321', '654321')
      ).rejects.toMatchObject({
        code: 'PIN_CHANGE_NOT_ALLOWED'
      });
    });
  });
});
