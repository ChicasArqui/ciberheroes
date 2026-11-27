const { deployProduction } = require('../scripts/deploy-production.cjs');

const approved = 'a'.repeat(40);
const previous = 'b'.repeat(40);

function simulate({ hookStatus = 200, commits = [approved], hookError, database = 'connected' } = {}) {
  const health = jest.fn();
  const checks = [];
  const hook = jest.fn(async () => {
    if (hookError) {
      throw hookError;
    }
    return new Response(null, { status: hookStatus });
  });
  const request = async (url, options) => {
    if (options.method === 'POST') {
      return hook(url, options);
    }
    checks.push(url.pathname);
    options.signal.throwIfAborted();
    switch (url.pathname) {
      case '/':
        return new Response('<div id="root"></div><script src="/assets/app.js"></script><link href="/assets/app.css">', {
          headers: { 'content-type': 'text/html' }
        });
      case '/assets/app.js':
        return new Response('', { headers: { 'content-type': 'text/javascript' } });
      case '/assets/app.css':
        return new Response('', { headers: { 'content-type': 'text/css' } });
      case '/health': {
        health();
        const commit = commits[Math.min(health.mock.calls.length - 1, commits.length - 1)];
        return Response.json({ status: 'healthy', server: 'running', commit, database });
      }
      case '/api/lecciones':
        return Response.json([{ id: 1 }]);
      default:
        throw new Error('Unexpected verification path');
    }
  };

  return {
    hook, health, checks,
    config: {
      sha: approved,
      hookUrl: 'https://api.render.test/deploy?key=fake-secret&ref=old&ref=older&keep=1',
      productionUrl: 'https://app.example.test',
      readMain: async () => approved,
      request,
      retryMs: 1,
      verificationMs: 20
    }
  };
}

test('pins exactly one ref and waits for the approved SHA and the complete read-only smoke test', async () => {
  const { hook, health, checks, config } = simulate({ commits: [previous, approved] });
  await deployProduction({ ...config, verificationMs: 1000 });

  expect(hook).toHaveBeenCalledTimes(1);
  const [[url, options]] = hook.mock.calls;
  expect(url.searchParams.getAll('ref')).toEqual([approved]);
  expect(url.searchParams.get('key')).toBe('fake-secret');
  expect(url.searchParams.get('keep')).toBe('1');
  expect(options).toMatchObject({ method: 'POST', redirect: 'error' });
  expect(health).toHaveBeenCalledTimes(2);
  expect(checks).toEqual([
    '/', '/assets/app.js', '/assets/app.css', '/health',
    '/', '/assets/app.js', '/assets/app.css', '/health', '/api/lecciones'
  ]);
});

test.each([
  ['a different SHA', async () => previous],
  ['an unavailable remote', async () => { throw new Error('Remote unavailable'); }]
])('does not request a deployment with %s', async (_, readMain) => {
  const { hook, config } = simulate();
  await expect(deployProduction({ ...config, readMain })).rejects.toThrow('Deployment was not requested');
  expect(hook).not.toHaveBeenCalled();
});

test.each([
  [202, 'queued'],
  [403, 'HTTP 403'],
  [503, 'HTTP 503']
])('fails closed when the hook returns %i', async (hookStatus, message) => {
  const { hook, health, config } = simulate({ hookStatus });
  await expect(deployProduction(config)).rejects.toThrow(message);
  expect(hook).toHaveBeenCalledTimes(1);
  expect(health).not.toHaveBeenCalled();
});

test('a hook timeout is reported without leaking the URL or retrying the POST', async () => {
  const hookError = new DOMException('Timed out with fake-secret', 'TimeoutError');
  const { hook, config } = simulate({ hookError });
  await expect(deployProduction(config)).rejects.toThrow(/^Render hook request failed or timed out\. Check Render before retrying\.$/);
  expect(hook).toHaveBeenCalledTimes(1);
});

test('times out if production continues to respond with another SHA', async () => {
  const { hook, health, config } = simulate({ commits: [previous] });
  await expect(deployProduction(config)).rejects.toThrow('Timed out verifying');
  expect(hook).toHaveBeenCalledTimes(1);
  expect(health).toHaveBeenCalled();
});

test('times out if production has the correct SHA but MongoDB stays disconnected', async () => {
  const { health, config } = simulate({ database: 'disconnected' });
  await expect(deployProduction(config)).rejects.toThrow('Timed out verifying');
  expect(health).toHaveBeenCalled();
});

test('times out if production does not respond', async () => {
  const { config } = simulate();
  const request = (url, options) => {
    if (options.method === 'POST') {
      return config.request(url, options);
    }
    return new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
    });
  };
  await expect(deployProduction({ ...config, request })).rejects.toThrow('Timed out verifying');
});
