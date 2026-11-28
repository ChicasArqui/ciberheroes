const { createHmac } = require('node:crypto');
const { RateLimiterMongo, RateLimiterRes } = require('rate-limiter-flexible');

const CHILD_PIN_POLICY = {
  points: 5,
  duration: 15 * 60,
  blockDuration: 15 * 60
};

const CHILD_PIN_IP_POLICY = {
  points: 30,
  duration: 15 * 60,
  blockDuration: 15 * 60
};

function createChildPinRateLimiter({
  storeClient,
  dbName,
  secret
} = {}) {
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('CHILD_PIN_LIMITER_SECRET_NOT_CONFIGURED');
  }

  const indexes = [];

  function createLimiter(name, policy) {
    const options = {
      ...policy,
      keyPrefix: `child_pin_${name}`
    };

    if (!storeClient) {
      return null;
    }

    const limiter = new RateLimiterMongo({
      ...options,
      storeClient,
      dbName,
      disableIndexesCreation: true
    });

    indexes.push(limiter.createIndexes());

    return limiter;
  }

  const profileLimiter = createLimiter(
    'profile',
    CHILD_PIN_POLICY
  );

  const ipLimiter = createLimiter(
    'ip',
    CHILD_PIN_IP_POLICY
  );

  function hashKey(type, value) {
    return createHmac('sha256', secret)
      .update(JSON.stringify([type, String(value)]))
      .digest('hex');
  }

  async function consume(profileId, ip) {
    if (!profileLimiter || !ipLimiter) {
      throw new Error('CHILD_PIN_LIMITER_NOT_CONFIGURED');
    }

    if (!profileId || !ip) {
      throw new Error('CHILD_PIN_LIMITER_INVALID_KEY');
    }

    try {
      await ipLimiter.consume(hashKey('ip', ip));
      await profileLimiter.consume(hashKey('profile', profileId));

      return { allowed: true };
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        return {
          allowed: false,
          retryAfter: Math.max(
            1,
            Math.ceil(error.msBeforeNext / 1000)
          )
        };
      }

      throw error;
    }
  }

  async function reward(profileId) {
    if (!profileLimiter) {
      throw new Error('CHILD_PIN_LIMITER_NOT_CONFIGURED');
    }

    if (!profileId) {
      throw new Error('CHILD_PIN_LIMITER_INVALID_PROFILE');
    }

    // El éxito reinicia el contador del perfil,
    // pero no elimina el historial de la dirección IP.
    await profileLimiter.delete(hashKey('profile', profileId));
  }

  return {
    ready: Promise.all(indexes),
    consume,
    reward
  };
}

module.exports = {
  createChildPinRateLimiter,
  CHILD_PIN_POLICY,
  CHILD_PIN_IP_POLICY
};
