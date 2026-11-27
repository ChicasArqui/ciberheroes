jest.mock('../src/modules/auth/auth.service', () => ({
  registerGuardian: jest.fn(), loginGuardian: jest.fn()
}));

const request = require('supertest');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const baseApp = require('../src/app');
const { loginGuardian, registerGuardian } = require('../src/modules/auth/auth.service');
const { createAuthRateLimiters } = require('../src/modules/auth/auth-rate-limit');

const input = { email: 'guardian@example.com', password: 'ClaveFicticia!12345' };
const invalid = code => Object.assign(new Error(code), { code });
let app;

beforeEach(() => {
  jest.restoreAllMocks();
  jest.resetAllMocks();
  app = baseApp.createApp({ sessionMiddleware(req, res, next) {
    req.session = { regenerate: done => done(), save: done => done() };
    next();
  } });
  loginGuardian.mockRejectedValue(invalid('INVALID_CREDENTIALS'));
  registerGuardian.mockRejectedValue(invalid('EMAIL_ALREADY_EXISTS'));
});
afterEach(() => jest.restoreAllMocks());

const post = (route, body = input) => request(app).post(`/api/auth/${route}`).send(body);

test('en Render cuenta la IP del visitante aunque cambien los proxies y X-Forwarded-For', async () => {
  app = baseApp.createApp({ authRateLimiters: createAuthRateLimiters({ renderIngress: true }) });
  app.set('trust proxy', 1);
  for (let i = 0; i < 6; i++) {
    await post('login').set('CF-Connecting-IP', '203.0.113.10')
      .set('X-Forwarded-For', `192.0.2.${i + 1}, 198.51.100.${i + 1}`)
      .expect(i < 5 ? 401 : 429);
  }
  await post('login').set('CF-Connecting-IP', '203.0.113.11')
    .set('X-Forwarded-For', '192.0.2.1, 198.51.100.1').expect(401);
});

test('fuera de Render no permite evadir el límite falsificando CF-Connecting-IP', async () => {
  for (let i = 0; i < 6; i++) {
    await post('login').set('CF-Connecting-IP', `203.0.113.${i + 1}`)
      .expect(i < 5 ? 401 : 429);
  }
});

test.each([undefined, 'no-es-ip', '203.0.113.1, 203.0.113.2'])('en Render rechaza una IP ausente o inválida: %s', async ip => {
  app = baseApp.createApp({ authRateLimiters: createAuthRateLimiters({ renderIngress: true }) });
  for (const route of ['login', 'register']) {
    const req = post(route);
    if (ip) req.set('CF-Connecting-IP', ip);
    const response = await req.expect(503);
    expect(response.body).toEqual({ error: 'AUTH_SERVICE_UNAVAILABLE' });
  }
  expect(loginGuardian).not.toHaveBeenCalled();
  expect(registerGuardian).not.toHaveBeenCalled();
});

test('en Render los registros comparten la cuota del visitante entre proxies', async () => {
  app = baseApp.createApp({ authRateLimiters: createAuthRateLimiters({ renderIngress: true }) });
  app.set('trust proxy', 1);
  for (let i = 0; i < 21; i++) {
    await post('register', { ...input, email: `registro${i}@example.com` })
      .set('CF-Connecting-IP', '2001:db8::1')
      .set('X-Forwarded-For', `198.51.100.${i + 1}`).expect(i < 20 ? 409 : 429);
  }
});

test('Turnstile recibe la IP del visitante y un contexto estable entre proxies', async () => {
  const verify = jest.fn().mockResolvedValue(true);
  const configurations = [];
  const authRateLimiters = createAuthRateLimiters({
    renderIngress: true,
    challengeVerifier: {
      publicConfig(cData) { configurations.push(cData); return { siteKey: 'publica', cData }; },
      verify
    }
  });
  app = baseApp.createApp({ authRateLimiters });
  app.set('trust proxy', 1);
  for (let i = 0; i < 10; i++) {
    await post('login').set('CF-Connecting-IP', `203.0.113.${i + 1}`)
      .set('X-Forwarded-For', '198.51.100.1').expect(401);
  }
  await post('login').set('CF-Connecting-IP', '203.0.113.100')
    .set('X-Forwarded-For', '198.51.100.2').expect(403);
  await post('login', { ...input, challengeToken: 'token-ficticio' })
    .set('CF-Connecting-IP', '203.0.113.100')
    .set('X-Forwarded-For', '198.51.100.3').expect(401);
  expect(configurations[0]).toBe(configurations[1]);
  expect(verify).toHaveBeenCalledWith(expect.objectContaining({ ip: '203.0.113.100', cData: configurations[0] }));
});

// Usar el almacén real permite verificar si consume() escribió antes de rechazar.
function observeCounters() {
  const counters = new Map();
  const consume = RateLimiterMemory.prototype.consume;
  jest.spyOn(RateLimiterMemory.prototype, 'consume').mockImplementation(function (id, ...args) {
    counters.set(this.keyPrefix, { limiter: this, id });
    return consume.call(this, id, ...args);
  });
  return async name => {
    const { limiter, id } = counters.get(name);
    return (await limiter.get(id)).consumedPoints;
  };
}

test('reintentos bloqueados no devuelven oportunidades ni reducen los cinco fallos previos', async () => {
  const count = observeCounters();
  for (let i = 0; i < 5; i++) await post('login').expect(401);
  for (let i = 0; i < 5; i++) {
    await post('login').expect(429);
    expect(await count('auth_login_identity')).toBe(5);
    expect(await count('auth_login_account')).toBe(5);
  }
  expect(loginGuardian).toHaveBeenCalledTimes(5);
});

test('si el segundo almacén falla antes de escribir, solo devuelve el primer consumo', async () => {
  const reward = jest.spyOn(RateLimiterMemory.prototype, 'reward');
  const consume = RateLimiterMemory.prototype.consume;
  let identity;
  jest.spyOn(RateLimiterMemory.prototype, 'consume').mockImplementation(function (id, ...args) {
    if (this.keyPrefix === 'auth_login_identity') identity = { limiter: this, id };
    if (this.keyPrefix === 'auth_login_account') return Promise.reject(new Error('fallo antes de escribir'));
    return consume.call(this, id, ...args);
  });
  await post('login').expect(503);
  expect(reward).toHaveBeenCalledTimes(1);
  expect(reward.mock.contexts[0].keyPrefix).toBe('auth_login_identity');
  expect((await identity.limiter.get(identity.id)).consumedPoints).toBe(0);
  expect(loginGuardian).not.toHaveBeenCalled();
});

test('un rechazo por exceso sí incrementa el almacén real y se puede revertir exactamente ese punto', async () => {
  const limiter = new RateLimiterMemory({ points: 5, duration: 900 });
  for (let i = 0; i < 5; i++) await limiter.consume('ficticio');
  await expect(limiter.consume('ficticio')).rejects.toMatchObject({ consumedPoints: 6 });
  expect((await limiter.get('ficticio')).consumedPoints).toBe(6);
  await limiter.reward('ficticio');
  expect((await limiter.get('ficticio')).consumedPoints).toBe(5);
});

test('permite cinco fallos y rechaza el sexto antes de comprobar credenciales', async () => {
  for (let i = 0; i < 5; i++) await post('login').expect(401);
  const blocked = await post('login').expect(429);
  expect(blocked.body.error).toBe('TOO_MANY_REQUESTS');
  expect(blocked.body.retryAfter).toBeGreaterThan(0);
  expect(blocked.headers['retry-after']).toBe(String(blocked.body.retryAfter));
  expect(loginGuardian).toHaveBeenCalledTimes(5);
});

test('normaliza el correo y no bloquea otro correo de la misma red', async () => {
  for (let i = 0; i < 5; i++) await post('login').expect(401);
  await post('login', { ...input, email: ' GUARDIAN@EXAMPLE.COM ' }).expect(429);
  await post('login', { ...input, email: 'otro@example.com' }).expect(401);
});

test('no permite evadir el contador enviando X-Forwarded-For a un servidor local', async () => {
  for (let i = 0; i < 6; i++) {
    await post('login').set('X-Forwarded-For', `192.0.2.${i + 1}`)
      .expect(i < 5 ? 401 : 429);
  }
});

test('un login correcto reinicia los fallos de correo e IP', async () => {
  for (let i = 0; i < 4; i++) await post('login').expect(401);
  loginGuardian.mockResolvedValueOnce({ guardian: { id: 'ficticio' } });
  await post('login').expect(200);
  for (let i = 0; i < 5; i++) await post('login').expect(401);
  await post('login').expect(429);
});

test('recupera el acceso al vencer la ventana sin prolongarla por reintentar', async () => {
  const now = Date.now();
  const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
  for (let i = 0; i < 5; i++) await post('login').expect(401);
  clock.mockReturnValue(now + 10 * 60 * 1000);
  const blocked = await post('login').expect(429);
  expect(blocked.body.retryAfter).toBeLessThanOrEqual(300);
  clock.mockReturnValue(now + 16 * 60 * 1000);
  await post('login').expect(401);
});

test('limita a treinta solicitudes de login aunque cambien los correos', async () => {
  for (let i = 0; i < 31; i++) {
    await post('login', { ...input, email: `ficticio${i}@example.com` })
      .expect(i < 30 ? 401 : 429);
  }
  expect(loginGuardian).toHaveBeenCalledTimes(30);
});

test('limita a tres solicitudes de registro por correo normalizado', async () => {
  for (let i = 0; i < 3; i++) await post('register').expect(409);
  await post('register', { ...input, email: ' GUARDIAN@EXAMPLE.COM ' }).expect(429);
  expect(registerGuardian).toHaveBeenCalledTimes(3);
});

test('limita a veinte registros por IP aunque cambien los correos', async () => {
  for (let i = 0; i < 21; i++) {
    await post('register', { ...input, email: `ficticio${i}@example.com` })
      .expect(i < 20 ? 409 : 429);
  }
  expect(registerGuardian).toHaveBeenCalledTimes(20);
});

test('login y registro mantienen contadores independientes', async () => {
  for (let i = 0; i < 5; i++) await post('login').expect(401);
  await post('login').expect(429);
  await post('register').expect(409);
});

test('los datos inválidos gastan cuota de IP sin gastar oportunidades de contraseña', async () => {
  loginGuardian.mockRejectedValue(invalid('INVALID_INPUT'));
  for (let i = 0; i < 31; i++) {
    await post('login', {}).expect(i < 30 ? 400 : 429);
  }
});

test('los errores internos no consumen oportunidades de la cuenta', async () => {
  loginGuardian.mockRejectedValue(new Error('fallo interno'));
  for (let i = 0; i < 12; i++) await post('login').expect(500);
  loginGuardian.mockRejectedValue(invalid('INVALID_CREDENTIALS'));
  for (let i = 0; i < 5; i++) await post('login').expect(401);
  await post('login').expect(429);
});

function challengeApp(verifier) {
  app = baseApp.createApp({
    authRateLimiters: createAuthRateLimiters({ challengeVerifier: verifier }),
    sessionMiddleware(req, res, next) {
      req.session = { regenerate: done => done(), save: done => done() };
      next();
    }
  });
  app.set('trust proxy', 1);
}

async function failFromSeveralIps() {
  for (let i = 0; i < 10; i++) {
    await post('login').set('X-Forwarded-For', `192.0.2.${i + 1}`).expect(401);
  }
}

test('exige comprobación tras diez fallos desde distintas IP sin consultar más credenciales', async () => {
  const verify = jest.fn();
  challengeApp({ publicConfig: cData => ({ siteKey: 'publica-ficticia', cData }), verify });
  await failFromSeveralIps();
  const result = await post('login').set('X-Forwarded-For', '192.0.2.100').expect(403);
  expect(result.body.error).toBe('CHALLENGE_REQUIRED');
  expect(result.body.challenge.siteKey).toBe('publica-ficticia');
  expect(loginGuardian).toHaveBeenCalledTimes(10);
  expect(verify).not.toHaveBeenCalled();
  expect(result.headers['cache-control']).toBe('no-store');
});

test('un token válido deja entrar al dueño y no se puede reutilizar', async () => {
  const verify = jest.fn().mockResolvedValue(true);
  challengeApp({ publicConfig: cData => ({ siteKey: 'publica-ficticia', cData }), verify });
  await failFromSeveralIps();
  loginGuardian.mockResolvedValue({ guardian: { id: 'ficticio' } });
  const body = { ...input, challengeToken: 'token-ficticio' };
  await post('login', body).set('X-Forwarded-For', '192.0.2.100').expect(200);
  await post('login', body).set('X-Forwarded-For', '192.0.2.100').expect(403);
  expect(verify).toHaveBeenCalledTimes(1);
  await post('login', { ...body, challengeToken: 'otro-token' })
    .set('X-Forwarded-For', '192.0.2.100').expect(200);
});

test('un token inválido o demasiado largo no permite comprobar la contraseña', async () => {
  const verify = jest.fn().mockResolvedValue(false);
  challengeApp({ publicConfig: cData => ({ siteKey: 'publica-ficticia', cData }), verify });
  await failFromSeveralIps();
  for (const token of ['invalido', 'x'.repeat(2049)]) {
    await post('login', { ...input, challengeToken: token })
      .set('X-Forwarded-For', '192.0.2.100').expect(403);
  }
  expect(loginGuardian).toHaveBeenCalledTimes(10);
  expect(verify).toHaveBeenCalledTimes(1);
});

test('un fallo del proveedor rechaza el acceso y devuelve la reserva', async () => {
  const verify = jest.fn().mockRejectedValue(new Error('fallo proveedor secreto'));
  challengeApp({ publicConfig: () => ({ siteKey: 'publica-ficticia' }), verify });
  const count = observeCounters();
  await failFromSeveralIps();
  for (let i = 0; i < 6; i++) {
    const result = await post('login', { ...input, challengeToken: `token-${i}` })
      .set('X-Forwarded-For', '192.0.2.100').expect(503);
    expect(result.body).toEqual({ error: 'AUTH_SERVICE_UNAVAILABLE' });
    expect(await count('auth_login_identity')).toBe(0);
    expect(await count('auth_login_account')).toBe(10);
  }
  verify.mockResolvedValue(true);
  await post('login', { ...input, challengeToken: 'token-valido' })
    .set('X-Forwarded-For', '192.0.2.100').expect(401);
});

test('dos verificaciones concurrentes del mismo token solo consultan una vez al proveedor', async () => {
  const verify = jest.fn().mockResolvedValue(true);
  challengeApp({ publicConfig: () => ({ siteKey: 'publica-ficticia' }), verify });
  await failFromSeveralIps();
  const responses = await Promise.all(Array.from({ length: 2 }, () =>
    post('login', { ...input, challengeToken: 'token-compartido' })
      .set('X-Forwarded-For', '192.0.2.100')));
  expect(responses.map(response => response.status).sort()).toEqual([401, 403]);
  expect(verify).toHaveBeenCalledTimes(1);
});

test('un error del almacén rechaza la solicitud sin exponer detalles', async () => {
  jest.spyOn(RateLimiterMemory.prototype, 'consume')
    .mockRejectedValue(new Error('credenciales-privadas-ficticias'));
  const result = await post('login').expect(503);
  expect(result.body).toEqual({ error: 'AUTH_SERVICE_UNAVAILABLE' });
  expect(loginGuardian).not.toHaveBeenCalled();
});

test('permite el mismo correo desde otra IP detrás del proxy configurado', async () => {
  app.set('trust proxy', 1);
  for (let i = 0; i < 5; i++) {
    await post('login').set('X-Forwarded-For', '192.0.2.1').expect(401);
  }
  await post('login').set('X-Forwarded-For', '192.0.2.1').expect(429);
  await post('login').set('X-Forwarded-For', '192.0.2.2').expect(401);
});

