const { createTurnstileVerifier } = require('../src/modules/auth/turnstile.service');

const configuration = {
  siteKey: 'publica-ficticia', secretKey: 'secreta-ficticia', hostnames: 'dev.example.com, localhost'
};
const input = { token: 'token-ficticio', ip: '192.0.2.1', cData: 'contexto-ficticio' };
const success = {
  success: true, hostname: 'dev.example.com', action: 'guardian-login', cdata: input.cData
};
const makeVerifier = result => {
  const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => result });
  return { verifier: createTurnstileVerifier({ ...configuration, fetchImpl }), fetchImpl };
};

test('valida en el proveedor y solo publica la clave pública y el contexto', async () => {
  const { verifier, fetchImpl } = makeVerifier(success);
  expect(verifier.publicConfig(input.cData)).toEqual({
    siteKey: configuration.siteKey, action: 'guardian-login', cData: input.cData
  });
  await expect(verifier.verify(input)).resolves.toBe(true);
  expect(fetchImpl).toHaveBeenCalledWith(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    expect.objectContaining({ method: 'POST', signal: expect.any(AbortSignal) })
  );
  expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({
    secret: configuration.secretKey, response: input.token, remoteip: input.ip
  });
});

test.each([
  { success: false }, { hostname: 'ajeno.example.com' },
  { action: 'otra-operacion' }, { cdata: 'otra-cuenta-o-ip' }
])('rechaza tokens fallidos o con contexto incorrecto: %j', async override => {
  const { verifier } = makeVerifier({ ...success, ...override });
  await expect(verifier.verify(input)).resolves.toBe(false);
});

test.each([undefined, '', {}, 'x'.repeat(2049)])('rechaza tokens inválidos sin llamar al proveedor', async token => {
  const { verifier, fetchImpl } = makeVerifier(success);
  await expect(verifier.verify({ ...input, token })).resolves.toBe(false);
  expect(fetchImpl).not.toHaveBeenCalled();
});

test.each(['missing-input-secret', 'invalid-input-secret'])('detecta configuración inválida: %s', async code => {
  const { verifier } = makeVerifier({ success: false, 'error-codes': [code] });
  await expect(verifier.verify(input)).rejects.toThrow('Configuración');
});

test('rechaza tokens vencidos o duplicados', async () => {
  const { verifier } = makeVerifier({ success: false, 'error-codes': ['timeout-or-duplicate'] });
  await expect(verifier.verify(input)).resolves.toBe(false);
});

test.each(['siteKey', 'secretKey', 'hostnames'])('detecta la falta de %s', field => {
  const values = { ...configuration, [field]: '' };
  expect(() => createTurnstileVerifier(values).publicConfig(input.cData)).toThrow('no configurada');
});

test('no permite acceso cuando falla la conexión con el proveedor', async () => {
  const fetchImpl = jest.fn().mockRejectedValue(new Error('timeout'));
  const verifier = createTurnstileVerifier({ ...configuration, fetchImpl });
  await expect(verifier.verify(input)).rejects.toThrow('timeout');
});

test('rechaza respuestas HTTP fallidas y JSON inválido', async () => {
  const fetchImpl = jest.fn().mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true, json: async () => { throw new Error('JSON inválido'); } });
  const verifier = createTurnstileVerifier({ ...configuration, fetchImpl });
  await expect(verifier.verify(input)).rejects.toThrow('no disponible');
  await expect(verifier.verify(input)).rejects.toThrow('JSON inválido');
});

test('el cliente por defecto utiliza fetch sin exponer la clave al frontend', async () => {
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => success });
  try {
    const verifier = createTurnstileVerifier(configuration);
    await expect(verifier.verify(input)).resolves.toBe(true);
    expect(JSON.stringify(verifier.publicConfig(input.cData))).not.toContain(configuration.secretKey);
  } finally {
    fetchMock.mockRestore();
  }
});
