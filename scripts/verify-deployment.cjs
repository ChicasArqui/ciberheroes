const assert = require('node:assert/strict');

async function get(baseUrl, path, contentType) {
  const response = await fetch(new URL(path, baseUrl), {
    signal: AbortSignal.timeout(10000)
  });
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get('content-type') || '', contentType, path);
  return response;
}

async function verify(baseUrl, { requireDatabase = false } = {}) {
  const home = await get(baseUrl, '/', /text\/html/);
  const html = await home.text();
  assert.match(html, /<div id="root"><\/div>/);
  const entryPoint = html.match(/src="(\/assets\/[^"]+\.js)"/);
  assert.ok(entryPoint, 'React JavaScript entry point is missing');
  await get(baseUrl, entryPoint[1], /javascript/);
  const stylesheet = html.match(/href="(\/assets\/[^"]+\.css)"/);
  assert.ok(stylesheet, 'React stylesheet is missing');
  await get(baseUrl, stylesheet[1], /text\/css/);

  const healthResponse = await get(baseUrl, '/health', /application\/json/);
  const health = await healthResponse.json();
  assert.equal(health.status, 'healthy');
  assert.equal(health.server, 'running');
  assert.match(health.database || '', /^(connected|disconnected)$/);
  if (requireDatabase) {
    assert.equal(health.database, 'connected', 'MongoDB must be connected in Dev');
  }

  const lessonsResponse = await get(baseUrl, '/api/lecciones', /application\/json/);
  const lessons = await lessonsResponse.json();
  assert.ok(Array.isArray(lessons) && lessons.length > 0, 'Expected a lesson list');

  console.log('React, /health and /api/lecciones responded successfully.');
}

verify(process.argv[2], {
  requireDatabase: process.argv.includes('--require-database')
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
