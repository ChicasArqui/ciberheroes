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
  CHILD_PIN_POLICY
} = require('../src/modules/profiles/child-auth-rate-limit');

describe('limitador de intentos del PIN infantil', () => {
  let limiterMock;

  beforeEach(() => {
    jest.clearAllMocks();

    limiterMock = {
      consume: jest.fn(),
      delete: jest.fn(),
      createIndexes: jest.fn().mockResolvedValue(undefined)
    };

    RateLimiterMongo.mockImplementation(() => limiterMock);
  });

  test('configura cinco intentos en quince minutos', () => {
    expect(CHILD_PIN_POLICY).toEqual({
      points: 5,
      duration: 900,
      blockDuration: 900
    });
  });

  test('crea el limitador usando MongoDB', () => {
    createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes'
    });

    expect(RateLimiterMongo).toHaveBeenCalledWith(
      expect.objectContaining({
        points: 5,
        duration: 900,
        blockDuration: 900,
        keyPrefix: 'child_pin_login',
        dbName: 'ciberheroes',
        disableIndexesCreation: true
      })
    );
  });

  test('prepara los índices del limitador', async () => {
    const rateLimiter = createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes'
    });

    await expect(rateLimiter.ready).resolves.toBeUndefined();
    expect(limiterMock.createIndexes).toHaveBeenCalledTimes(1);
  });

  test('permite un intento cuando no se supera el límite', async () => {
    limiterMock.consume.mockResolvedValue(undefined);

    const rateLimiter = createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes'
    });

    await expect(rateLimiter.consume('profile-1')).resolves.toEqual({
      allowed: true
    });

    expect(limiterMock.consume).toHaveBeenCalledWith('profile-1');
  });

  test('rechaza cuando se supera el límite y devuelve el tiempo de espera', async () => {
    limiterMock.consume.mockRejectedValue(new RateLimiterRes(120000));

    const rateLimiter = createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes'
    });

    await expect(rateLimiter.consume('profile-1')).resolves.toEqual({
      allowed: false,
      retryAfter: 120
    });
  });

  test('propaga los errores de MongoDB sin confundirlos con bloqueos', async () => {
    limiterMock.consume.mockRejectedValue(new Error('MongoDB unavailable'));

    const rateLimiter = createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes'
    });

    await expect(
      rateLimiter.consume('profile-1')
    ).rejects.toThrow('MongoDB unavailable');
  });

  test('elimina el contador después de una autenticación correcta', async () => {
    const rateLimiter = createChildPinRateLimiter({
      storeClient: {},
      dbName: 'ciberheroes'
    });

    await rateLimiter.reward('profile-1');

    expect(limiterMock.delete).toHaveBeenCalledWith('profile-1');
  });

  test('no permite utilizar el limitador sin MongoDB configurado', async () => {
    const rateLimiter = createChildPinRateLimiter();

    await expect(
      rateLimiter.consume('profile-1')
    ).rejects.toThrow('CHILD_PIN_LIMITER_NOT_CONFIGURED');
  });
});
