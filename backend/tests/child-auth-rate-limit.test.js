jest.mock('rate-limiter-flexible', () => ({
  RateLimiterMongo: jest.fn(),
  RateLimiterRes: class RateLimiterRes extends Error {
    constructor(msBeforeNext) {
      super('Rate limit exceeded');
      this.msBeforeNext = msBeforeNext;
    }
  }
}));

const {
  RateLimiterMongo,
  RateLimiterRes
} = require('rate-limiter-flexible');

const {
  createChildPinRateLimiter,
  CHILD_PIN_POLICY,
  CHILD_PIN_IP_POLICY
} = require('../src/modules/profiles/child-auth-rate-limit');

describe('limitador de intentos del PIN infantil', () => {
  let profileLimiterMock;
  let ipLimiterMock;

  beforeEach(() => {
    jest.clearAllMocks();

    profileLimiterMock = {
      consume: jest.fn(),
      delete: jest.fn(),
      createIndexes: jest.fn().mockResolvedValue(undefined)
    };

    ipLimiterMock = {
      consume: jest.fn(),
      delete: jest.fn(),
      createIndexes: jest.fn().mockResolvedValue(undefined)
    };

    RateLimiterMongo
      .mockImplementationOnce(() => profileLimiterMock)
      .mockImplementationOnce(() => ipLimiterMock);
  });

  test('configura cinco intentos por perfil en quince minutos', () => {
    expect(CHILD_PIN_POLICY).toEqual({
      points: 5,
      duration: 900,
      blockDuration: 900
    });
  });

  test('configura treinta intentos por IP en quince minutos', () => {
    expect(CHILD_PIN_IP_POLICY).toEqual({
      points: 30,
      duration: 900,
      blockDuration: 900
    });
  });

  test('crea dos limitadores usando MongoDB', () => {
    createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes',
      secret: 'test-secret-with-at-least-32-characters'
    });

    expect(RateLimiterMongo).toHaveBeenCalledTimes(2);

    expect(RateLimiterMongo).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        points: 5,
        duration: 900,
        blockDuration: 900,
        keyPrefix: 'child_pin_profile',
        dbName: 'ciberheroes',
        disableIndexesCreation: true
      })
    );

    expect(RateLimiterMongo).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        points: 30,
        duration: 900,
        blockDuration: 900,
        keyPrefix: 'child_pin_ip',
        dbName: 'ciberheroes',
        disableIndexesCreation: true
      })
    );
  });

  test('prepara los índices de ambos limitadores', async () => {
    const rateLimiter = createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes',
      secret: 'test-secret-with-at-least-32-characters'
    });

    await rateLimiter.ready;

    expect(profileLimiterMock.createIndexes).toHaveBeenCalledTimes(1);
    expect(ipLimiterMock.createIndexes).toHaveBeenCalledTimes(1);
  });

  test('permite un intento cuando no se supera ningún límite', async () => {
    ipLimiterMock.consume.mockResolvedValue(undefined);
    profileLimiterMock.consume.mockResolvedValue(undefined);

    const rateLimiter = createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes',
      secret: 'test-secret-with-at-least-32-characters'
    });

    await expect(
      rateLimiter.consume('profile-1', '192.0.2.1')
    ).resolves.toEqual({ allowed: true });

    expect(ipLimiterMock.consume).toHaveBeenCalledTimes(1);
    expect(profileLimiterMock.consume).toHaveBeenCalledTimes(1);

    expect(ipLimiterMock.consume.mock.calls[0][0]).not.toBe('192.0.2.1');
    expect(profileLimiterMock.consume.mock.calls[0][0]).not.toBe('profile-1');
  });

  test('rechaza cuando se supera el límite por IP', async () => {
    ipLimiterMock.consume.mockRejectedValue(new RateLimiterRes(120000));

    const rateLimiter = createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes',
      secret: 'test-secret-with-at-least-32-characters'
    });

    await expect(
      rateLimiter.consume('profile-1', '192.0.2.1')
    ).resolves.toEqual({
      allowed: false,
      retryAfter: 120
    });

    expect(profileLimiterMock.consume).not.toHaveBeenCalled();
  });

  test('rechaza cuando se supera el límite por perfil', async () => {
    ipLimiterMock.consume.mockResolvedValue(undefined);
    profileLimiterMock.consume.mockRejectedValue(
      new RateLimiterRes(90000)
    );

    const rateLimiter = createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes',
      secret: 'test-secret-with-at-least-32-characters'
    });

    await expect(
      rateLimiter.consume('profile-1', '192.0.2.1')
    ).resolves.toEqual({
      allowed: false,
      retryAfter: 90
    });
  });

  test('propaga errores de MongoDB sin confundirlos con bloqueos', async () => {
    ipLimiterMock.consume.mockRejectedValue(
      new Error('MongoDB unavailable')
    );

    const rateLimiter = createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes',
      secret: 'test-secret-with-at-least-32-characters'
    });

    await expect(
      rateLimiter.consume('profile-1', '192.0.2.1')
    ).rejects.toThrow('MongoDB unavailable');
  });

  test('reinicia el contador del perfil después de autenticarse', async () => {
    const rateLimiter = createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes',
      secret: 'test-secret-with-at-least-32-characters'
    });

    await rateLimiter.reward('profile-1');

    const deletedKey = profileLimiterMock.delete.mock.calls[0][0];

    expect(deletedKey).toMatch(/^[a-f0-9]{64}$/);
    expect(deletedKey).not.toBe('profile-1');
    expect(ipLimiterMock.delete).not.toHaveBeenCalled();
  });

  test.each([
    undefined,
    '',
    'short-secret'
  ])('rechaza un secreto ausente o demasiado corto: %s', (secret) => {
    expect(() => createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes',
      ...(secret === undefined ? {} : { secret })
    })).toThrow('CHILD_PIN_LIMITER_SECRET_NOT_CONFIGURED');
  });

  test('no permite utilizar el limitador sin MongoDB configurado', async () => {
    const rateLimiter = createChildPinRateLimiter({
      secret: 'test-secret-with-at-least-32-characters'
    });

    await expect(
      rateLimiter.consume('profile-1', '192.0.2.1')
    ).rejects.toThrow('CHILD_PIN_LIMITER_NOT_CONFIGURED');
  });

  test('rechaza claves incompletas', async () => {
    const rateLimiter = createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes',
      secret: 'test-secret-with-at-least-32-characters'
    });

    await expect(
      rateLimiter.consume('profile-1', '')
    ).rejects.toThrow('CHILD_PIN_LIMITER_INVALID_KEY');
  });
});
