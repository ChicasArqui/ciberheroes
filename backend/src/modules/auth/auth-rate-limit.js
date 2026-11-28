const { createHmac, randomBytes } = require('node:crypto');
const { isIP } = require('node:net');
const ipaddr = require('ipaddr.js');
const { RateLimiterMemory, RateLimiterMongo, RateLimiterRes } = require('rate-limiter-flexible');
const { createTurnstileVerifier } = require('./turnstile.service');
const { isValidGuardianEmail } = require('./auth.validation');

// Ventanas desde la primera solicitud. Un bloqueo no prolonga la ventana.
const AUTH_RATE_LIMITS = {
  loginIp: { points: 30, duration: 15 * 60 },
  loginIdentity: { points: 5, duration: 15 * 60 },
  loginAccount: { points: 10, duration: 15 * 60 },
  registerIp: { points: 20, duration: 60 * 60 },
  registerEmail: { points: 3, duration: 60 * 60 }
};

function createAuthRateLimiters({
  storeClient, dbName, secret = randomBytes(32), policies = AUTH_RATE_LIMITS,
  challengeVerifier = createTurnstileVerifier(),
  renderIngress = process.env.RENDER === 'true'
} = {}) {
  const indexes = [];
  function createLimiter(name, policy) {
    const options = { ...policy, keyPrefix: `auth_${name}` };
    if (!storeClient) return new RateLimiterMemory(options);

    const limiter = new RateLimiterMongo({
      ...options, storeClient, dbName, disableIndexesCreation: true
    });
    indexes.push(limiter.createIndexes());
    return limiter;
  }

  const loginIp = createLimiter('login_ip', policies.loginIp);
  const loginIdentity = createLimiter('login_identity', policies.loginIdentity);
  const loginAccount = createLimiter('login_account', policies.loginAccount);
  const challengeTokens = createLimiter('challenge_tokens', { points: 1, duration: 5 * 60 });
  const registerIp = createLimiter('register_ip', policies.registerIp);
  const registerEmail = createLimiter('register_email', policies.registerEmail);

  // No almacenar correos ni direcciones IP en claro en los contadores.
  const key = (...parts) => createHmac('sha256', secret)
    .update(JSON.stringify(parts)).digest('hex');

  function clientIp(req) {
    // Solo para el ingreso público de Render: Cloudflare establece el encabezado
    // y rechaza solicitudes públicas que intentan proporcionarlo por su cuenta.
    // Fuera de Render nunca se confía en un CF-Connecting-IP del cliente.
    const forwarded = renderIngress ? req.get('CF-Connecting-IP') : req.ip;
    if (typeof forwarded !== 'string' || !isIP(forwarded.trim())) {
      throw new Error('IP de ingreso de Render no disponible');
    }
    // Canonizar antes del HMAC: las formas equivalentes de IPv6 y las IPv4
    // mapeadas deben compartir contador y contexto de Turnstile.
    return ipaddr.process(forwarded.trim()).toString();
  }

  function reject(error, res) {
    if (error instanceof RateLimiterRes) {
      const retryAfter = Math.max(1, Math.ceil(error.msBeforeNext / 1000));
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'TOO_MANY_REQUESTS', retryAfter });
    }
    return res.status(503).json({ error: 'AUTH_SERVICE_UNAVAILABLE' });
  }

  async function register(req, res, next) {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    try {
      await registerIp.consume(key(clientIp(req)));
      await registerEmail.consume(key(email));
      return next();
    } catch (error) {
      return reject(error, res);
    }
  }

  async function login(req, res, next) {
    const reservations = [];
    async function reserve(limiter, id) {
      try {
        await limiter.consume(id);
        reservations.push([limiter, id]);
      } catch (error) {
        // En estos almacenes (sin bloqueo previo en memoria), consume incrementa
        // antes de rechazar por exceso. Registrar permite revertir solo ese punto;
        // un error del almacén no es una reserva confirmada.
        if (error instanceof RateLimiterRes) reservations.push([limiter, id]);
        throw error;
      }
    }
    async function refund() {
      await Promise.all(reservations.splice(0).map(([limiter, id]) => limiter.reward(id)));
    }
    try {
      const ip = clientIp(req);
      await loginIp.consume(key(ip));
      // Entradas inválidas gastan cuota de red, pero no oportunidades de contraseña.
      if (!isValidGuardianEmail(req.body?.email) ||
          typeof req.body?.password !== 'string' || !req.body.password) return next();
      const email = typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase() : '';
      const identityKey = key(ip, email);
      await reserve(loginIdentity, identityKey);
      let challengeRequired = false;
      try {
        await reserve(loginAccount, key(email));
      } catch (error) {
        if (!(error instanceof RateLimiterRes)) throw error;
        challengeRequired = true;
      }

      if (challengeRequired) {
        const cData = key('guardian-login', ip, email);
        const challenge = challengeVerifier.publicConfig(cData);
        const token = req.body.challengeToken;
        let verified = false;
        if (typeof token === 'string' && token.length > 0 && token.length <= 2048) {
          // Siteverify es eventualmente consistente: esta reserva impide reutilizar
          // el token incluso en solicitudes concurrentes o en distintas instancias.
          try {
            await challengeTokens.consume(key(token));
            verified = await challengeVerifier.verify({ token, ip, cData });
          } catch (error) {
            if (!(error instanceof RateLimiterRes)) throw error;
          }
        }
        if (!verified) {
          await refund();
          res.set('Cache-Control', 'no-store');
          return res.status(403).json({ error: 'CHALLENGE_REQUIRED', challenge });
        }
      }

      let settled = false;
      res.locals.settleLoginAttempt = async outcome => {
        if (settled) return;
        settled = true;
        if (outcome === 'failure') return; // Solo credenciales incorrectas.
        if (outcome === 'success') {
          // Un acierto no borra el historial de fallos desde otras direcciones.
          reservations.shift();
          await loginIdentity.delete(identityKey);
        }
        await refund();
      };
      return next();
    } catch (error) {
      try { await refund(); } catch { return reject(new Error('Almacén no disponible'), res); }
      return reject(error, res);
    }
  }

  return {
    ready: Promise.all(indexes),
    login,
    register
  };
}

module.exports = { createAuthRateLimiters, AUTH_RATE_LIMITS };
