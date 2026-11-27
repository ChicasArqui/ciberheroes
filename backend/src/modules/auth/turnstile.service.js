const ACTION = 'guardian-login';

function createTurnstileVerifier({
  siteKey = process.env.TURNSTILE_SITE_KEY,
  secretKey = process.env.TURNSTILE_SECRET_KEY,
  hostnames = process.env.TURNSTILE_HOSTNAMES || '',
  fetchImpl = (...args) => fetch(...args)
} = {}) {
  const allowedHosts = new Set(hostnames.split(',').map(host => host.trim()).filter(Boolean));

  function publicConfig(cData) {
    if (!siteKey || !secretKey || allowedHosts.size === 0) {
      throw new Error('Comprobación de seguridad no configurada');
    }
    return { siteKey, action: ACTION, cData };
  }

  async function verify({ token, ip, cData }) {
    publicConfig(cData);
    if (typeof token !== 'string' || !token || token.length > 2048) return false;

    const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: secretKey, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('Proveedor de seguridad no disponible');
    const result = await response.json();
    if (result['error-codes']?.some(code => ['missing-input-secret', 'invalid-input-secret'].includes(code))) {
      throw new Error('Configuración del proveedor inválida');
    }
    return result.success === true && allowedHosts.has(result.hostname) &&
      result.action === ACTION && result.cdata === cData;
  }

  return { publicConfig, verify };
}

module.exports = { createTurnstileVerifier };
