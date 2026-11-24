const ipaddr = require('ipaddr.js');

function createMemoryFamilyLookupStore(now = Date.now) {
  const counters = new Map();
  let windowEndsAt;

  return {
    increment(key, windowMs) {
      const resetAt = (Math.floor(now() / windowMs) + 1) * windowMs;
      if (windowEndsAt !== resetAt) {
        counters.clear();
        windowEndsAt = resetAt;
      }

      const count = (counters.get(key) ?? 0) + 1;
      counters.set(key, count);
      return { count, resetAt };
    }
  };
}

function sourceKey(remoteAddress) {
  // process() also turns IPv4-mapped IPv6 addresses into plain IPv4 addresses.
  const address = ipaddr.process(remoteAddress);
  const source = address.kind() === 'ipv6'
    ? address.parts.slice(0, 4).map(part => part.toString(16)).join(':') + '/64'
    : address.toString();
  return 'family-lookup:' + source;
}

function createFamilyLookupRateLimit({
  now = Date.now,
  store = process.env.NODE_ENV === 'production' ? undefined : createMemoryFamilyLookupStore(now),
  limit = 10,
  windowMs = 60_000
} = {}) {
  return async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!store) {
      return res.status(503).json({ code: 'FAMILY_LOOKUP_UNAVAILABLE' });
    }

    let count;
    let resetAt;
    try {
      // Use the socket peer. Forwarded headers require a separately verified proxy policy.
      ({ count, resetAt } = await store.increment(sourceKey(req.socket.remoteAddress), windowMs));
      if (!Number.isSafeInteger(count) || count < 1 || !Number.isFinite(resetAt)) {
        throw new Error('Invalid family lookup rate limit counter');
      }
    } catch {
      return res.status(503).json({ code: 'FAMILY_LOOKUP_UNAVAILABLE' });
    }

    if (count > limit) {
      const retryAfter = Math.max(1, Math.ceil((resetAt - now()) / 1000));
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ code: 'FAMILY_LOOKUP_RATE_LIMITED' });
    }

    return next();
  };
}

module.exports = { createFamilyLookupRateLimit };
