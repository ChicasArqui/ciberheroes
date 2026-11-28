jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');

  return {
    ...actualMongoose,
    startSession: jest.fn()
  };
});

jest.mock('../src/modules/auth/guardian.model', () => ({
  exists: jest.fn(),
  create: jest.fn(),
  createIndexes: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../src/modules/profiles/family.model', () => ({
  create: jest.fn(),
  createIndexes: jest.fn()
}));

jest.mock('../src/modules/profiles/child-profile.model', () => ({
  createIndexes: jest.fn()
}));

jest.mock('../src/modules/auth/password.service', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn()
}));

jest.mock('../src/modules/profiles/family-code.service', () => ({
  generateFamilyCode: jest.fn()
}));

const mongoose = require('mongoose');
const Guardian = require('../src/modules/auth/guardian.model');
const Family = require('../src/modules/profiles/family.model');
const ChildProfile = require('../src/modules/profiles/child-profile.model');
const { generateFamilyCode } = require('../src/modules/profiles/family-code.service');
const { hashPassword, verifyPassword } = require('../src/modules/auth/password.service');
const { registerGuardian, loginGuardian } = require('../src/modules/auth/auth.service');
const { ensureAuthIndexes } = require('../src/modules/auth/auth-indexes');

describe('registerGuardian', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rechaza un correo inválido antes de consultar la base de datos', async () => {
    await expect(
      registerGuardian({
        email: 'esto-no-es-un-correo',
        password: 'ClaveSegura123!abc'
      })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    expect(Guardian.exists).not.toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
    expect(mongoose.startSession).not.toHaveBeenCalled();
  });

  test('rechaza una contraseña que no cumple la política', async () => {
    await expect(
      registerGuardian({
        email: 'guardian@example.com',
        password: 'corta'
      })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    expect(Guardian.exists).not.toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
    expect(mongoose.startSession).not.toHaveBeenCalled();
  });

  test('rechaza un correo que ya está registrado', async () => {
    Guardian.exists.mockResolvedValue(true);

    await expect(
      registerGuardian({
        email: 'Guardian@example.com',
        password: 'ClaveSegura123!abc'
      })
    ).rejects.toMatchObject({ code: 'EMAIL_ALREADY_EXISTS' });

    expect(Guardian.exists).toHaveBeenCalledWith({
      email: 'guardian@example.com'
    });
    expect(hashPassword).not.toHaveBeenCalled();
    expect(mongoose.startSession).not.toHaveBeenCalled();
  });

  test('crea una familia y un Guardián, y devuelve sus datos básicos', async () => {
    const session = {
      withTransaction: jest.fn(async (callback) => callback()),
      endSession: jest.fn().mockResolvedValue(undefined)
    };

    mongoose.startSession.mockResolvedValue(session);
    Guardian.exists.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hash-de-prueba');
    generateFamilyCode.mockReturnValue('AB12CD34');
    Family.create.mockResolvedValue([{ _id: 'family-1' }]);
    Guardian.create.mockResolvedValue([{
      _id: { toString: () => 'guardian-1' },
      email: 'guardian@example.com'
    }]);

    const result = await registerGuardian({
      email: 'Guardian@Example.com',
      password: 'ClaveSegura123!abc'
    });

    expect(result).toEqual({
      guardian: {
        id: 'guardian-1',
        email: 'guardian@example.com'
      }
    });
    expect(Family.create).toHaveBeenCalledWith(
      [{ familyCode: 'AB12CD34' }],
      { session }
    );
    expect(Guardian.create).toHaveBeenCalledWith(
      [{
        email: 'guardian@example.com',
        passwordHash: 'hash-de-prueba',
        familyId: 'family-1'
      }],
      { session }
    );
    expect(session.endSession).toHaveBeenCalled();
  });

  test('rechaza un correo duplicado detectado al guardar la cuenta', async () => {
    const session = {
      withTransaction: jest.fn(async (callback) => callback()),
      endSession: jest.fn().mockResolvedValue(undefined)
    };

    mongoose.startSession.mockResolvedValue(session);
    Guardian.exists.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hash-de-prueba');
    generateFamilyCode.mockReturnValue('AB12CD34');
    Family.create.mockResolvedValue([{ _id: 'family-1' }]);
    Guardian.create.mockRejectedValue(
      Object.assign(new Error('correo duplicado'), {
        code: 11000,
        keyPattern: { email: 1 }
      })
    );

    await expect(
      registerGuardian({
        email: 'guardian@example.com',
        password: 'ClaveSegura123!abc'
      })
    ).rejects.toMatchObject({ code: 'EMAIL_ALREADY_EXISTS' });

    expect(session.endSession).toHaveBeenCalled();
  });

  test('genera otro código familiar si el primero ya existe', async () => {
    const session = {
      withTransaction: jest.fn(async (callback) => callback()),
      endSession: jest.fn().mockResolvedValue(undefined)
    };

    mongoose.startSession.mockResolvedValue(session);
    Guardian.exists.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hash-de-prueba');
    generateFamilyCode
      .mockReturnValueOnce('AB12CD34')
      .mockReturnValueOnce('EF56GH78');

    Family.create
      .mockRejectedValueOnce(
        Object.assign(new Error('código familiar duplicado'), {
          code: 11000,
          keyPattern: { familyCode: 1 }
        })
      )
      .mockResolvedValueOnce([{ _id: 'family-2' }]);

    Guardian.create.mockResolvedValue([{
      _id: { toString: () => 'guardian-2' },
      email: 'guardian@example.com'
    }]);

    const result = await registerGuardian({
      email: 'guardian@example.com',
      password: 'ClaveSegura123!abc'
    });

    expect(result.guardian.id).toBe('guardian-2');
    expect(mongoose.startSession).toHaveBeenCalledTimes(2);
    expect(generateFamilyCode).toHaveBeenCalledTimes(2);
    expect(session.endSession).toHaveBeenCalledTimes(2);
  });

  test('falla después de cinco códigos familiares duplicados', async () => {
    const session = {
      withTransaction: jest.fn(async (callback) => callback()),
      endSession: jest.fn().mockResolvedValue(undefined)
    };
    const duplicateFamilyCode = Object.assign(
      new Error('código familiar duplicado'),
      {
        code: 11000,
        keyPattern: { familyCode: 1 }
      }
    );

    mongoose.startSession.mockResolvedValue(session);
    Guardian.exists.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hash-de-prueba');
    generateFamilyCode.mockReturnValue('AB12CD34');
    Family.create.mockRejectedValue(duplicateFamilyCode);

    await expect(
      registerGuardian({
        email: 'guardian@example.com',
        password: 'ClaveSegura123!abc'
      })
    ).rejects.toMatchObject({ code: 'FAMILY_CODE_GENERATION_FAILED' });

    expect(mongoose.startSession).toHaveBeenCalledTimes(5);
    expect(generateFamilyCode).toHaveBeenCalledTimes(5);
    expect(session.endSession).toHaveBeenCalledTimes(5);
    expect(Guardian.create).not.toHaveBeenCalled();
  });
});

describe('loginGuardian', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('devuelve los datos básicos cuando las credenciales son válidas', async () => {
    const guardian = {
      _id: { toString: () => 'guardian-1' },
      email: 'guardian@example.com',
      passwordHash: 'hash-de-prueba'
    };

    const select = jest.fn().mockResolvedValue(guardian);
    Guardian.findOne.mockReturnValue({ select });
    verifyPassword.mockResolvedValue(true);

    const result = await loginGuardian({
      email: 'Guardian@Example.com',
      password: 'ClaveSegura123!abc'
    });

    expect(Guardian.findOne).toHaveBeenCalledWith({
      email: 'guardian@example.com'
    });
    expect(select).toHaveBeenCalledWith('+passwordHash');
    expect(verifyPassword).toHaveBeenCalledWith(
      'ClaveSegura123!abc',
      'hash-de-prueba'
    );
    expect(result).toEqual({
      guardian: {
        id: 'guardian-1',
        email: 'guardian@example.com'
      }
    });
  });

  test('rechaza el inicio de sesión cuando no encuentra la cuenta', async () => {
    const select = jest.fn().mockResolvedValue(null);
    Guardian.findOne.mockReturnValue({ select });

    await expect(
      loginGuardian({
        email: 'guardian@example.com',
        password: 'ClaveSegura123!abc'
      })
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });

    expect(verifyPassword).toHaveBeenCalledTimes(1);
    const dummyHash = verifyPassword.mock.calls[0][1];
    expect(dummyHash).toMatch(/^scrypt\$1\$/);
    const [, , salt, key] = dummyHash.split('$');
    expect(Buffer.from(salt, 'base64url')).toHaveLength(16);
    expect(Buffer.from(key, 'base64url')).toHaveLength(64);
    const realVerify = jest.requireActual('../src/modules/auth/password.service').verifyPassword;
    await expect(realVerify('ClaveSegura123!abc', dummyHash)).resolves.toBe(false);
  });

  test('rechaza una contraseña incorrecta', async () => {
    const guardian = {
      _id: { toString: () => 'guardian-1' },
      email: 'guardian@example.com',
      passwordHash: 'hash-de-prueba'
    };

    const select = jest.fn().mockResolvedValue(guardian);
    Guardian.findOne.mockReturnValue({ select });
    verifyPassword.mockResolvedValue(false);

    await expect(
      loginGuardian({
        email: 'guardian@example.com',
        password: 'ClaveSegura123!abc'
      })
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });

    expect(verifyPassword).toHaveBeenCalledWith(
      'ClaveSegura123!abc',
      'hash-de-prueba'
    );
  });

  test('rechaza datos de inicio de sesión inválidos antes de buscar la cuenta', async () => {
    await expect(
      loginGuardian({
        email: 'correo-inválido',
        password: 'algo'
      })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    expect(Guardian.findOne).not.toHaveBeenCalled();
  });

  test.each([
    ['falta', { email: 'guardian@example.com' }],
    ['no es texto', { email: 'guardian@example.com', password: 123 }]
  ])('rechaza la contraseña cuando %s', async (_caso, input) => {
    await expect(loginGuardian(input))
      .rejects.toMatchObject({ code: 'INVALID_INPUT' });

    expect(Guardian.findOne).not.toHaveBeenCalled();
  });
});

describe('índices previos al registro', () => {
  beforeEach(() => jest.resetAllMocks());

  test('espera ambos índices antes de completar la preparación', async () => {
    let finishGuardian;
    Guardian.createIndexes.mockImplementation(() => new Promise(resolve => { finishGuardian = resolve; }));
    Family.createIndexes.mockResolvedValue(undefined);
    ChildProfile.createIndexes.mockResolvedValue(undefined);
    const complete = jest.fn();
    const preparation = ensureAuthIndexes().then(complete);
    await Promise.resolve();
    expect(Family.createIndexes).toHaveBeenCalledTimes(1);
    expect(ChildProfile.createIndexes).toHaveBeenCalledTimes(1);
    expect(complete).not.toHaveBeenCalled();
    finishGuardian();
    await preparation;
    expect(complete).toHaveBeenCalledTimes(1);
  });

  test('un fallo de índice impide completar la preparación', async () => {
    Guardian.createIndexes.mockRejectedValue(new Error('índice duplicado ficticio'));
    Family.createIndexes.mockResolvedValue(undefined);
    ChildProfile.createIndexes.mockResolvedValue(undefined);
    await expect(ensureAuthIndexes()).rejects.toThrow('índice duplicado ficticio');
  });
});
