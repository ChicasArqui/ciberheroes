const { RateLimiterMongo, RateLimiterRes } = require('rate-limiter-flexible');

const CHILD_PIN_POLICY = {
  points: 5,
  duration: 15 * 60,
  blockDuration: 15 * 60
};

function createChildPinRateLimiter({ storeClient, dbName } = {}) {
  const options = {
    ...CHILD_PIN_POLICY,
    keyPrefix: 'child_pin_login'
  };

  const limiter = storeClient
    ? new RateLimiterMongo({
        ...options,
        storeClient,
        dbName,
        disableIndexesCreation: true
      })
    : null;

  async function consume(profileId) {
    if (!limiter) {
      throw new Error('CHILD_PIN_LIMITER_NOT_CONFIGURED');
    }

    try {
      await limiter.consume(String(profileId));
      return { allowed: true };
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        return {
          allowed: false,
          retryAfter: Math.max(1, Math.ceil(error.msBeforeNext / 1000))
        };
      }

      throw error;
    }
  }

  async function reward(profileId) {
    if (!limiter) {
      throw new Error('CHILD_PIN_LIMITER_NOT_CONFIGURED');
    }

    await limiter.delete(String(profileId));
  }

  return {
    ready: limiter ? limiter.createIndexes() : Promise.resolve(),
    consume,
    reward
  };
}

module.exports = {
  createChildPinRateLimiter,
  CHILD_PIN_POLICY
};
