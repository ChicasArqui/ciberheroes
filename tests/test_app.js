jest.mock('../backend/src/config/database', () => {
  const database = jest.requireActual('../backend/src/config/database');
  return { ...database, getDatabaseStatus: jest.fn(database.getDatabaseStatus) };
});

const request = require('supertest');
const app = require('../app');
const { getDatabaseStatus } = require('../backend/src/config/database');

function expectSecurityHeaders(response) {
  expect(response.headers['x-frame-options']).toBe('DENY');
  expect(response.headers['x-content-type-options']).toBe('nosniff');
  expect(response.headers['x-powered-by']).toBeUndefined();
  expect(response.headers['content-security-policy'].split('; ')).toEqual(
    expect.arrayContaining([
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ])
  );
  expect(response.headers['content-security-policy']).not.toMatch(/unsafe-inline|unsafe-eval/);
}

test('GET / serves the React build and its JavaScript entry point', async () => {
  const response = await request(app).get('/').expect(200).expect('Content-Type', /html/);
  expect(response.text).toContain('<div id="root"></div>');
  expect(response.text).toContain('CiberHéroes');

  const entryPoint = response.text.match(/src="(\/assets\/[^"]+\.js)"/);
  expect(entryPoint).not.toBeNull();
  expectSecurityHeaders(response);
  await request(app).get(entryPoint[1]).expect(200).expect('Content-Type', /javascript/);

  const stylesheet = response.text.match(/href="(\/assets\/[^"]+\.css)"/);
  expect(stylesheet).not.toBeNull();
  await request(app).get(stylesheet[1]).expect(200).expect('Content-Type', /text\/css/);
  await request(app).get('/assets/pipo-saludo.png').expect(200).expect('Content-Type', /image\/png/);
});

test.each(['/health', '/api/lecciones'])('GET %s returns secured JSON', async route => {
  const response = await request(app).get(route).expect(200).expect('Content-Type', /json/);
  expectSecurityHeaders(response);
});

test('GET /api/missing returns a secured JSON 404', async () => {
  const response = await request(app).get('/api/missing').expect(404).expect('Content-Type', /json/);
  expect(response.body).toEqual({ error: 'Ruta de API no encontrada' });
  expectSecurityHeaders(response);
});

test('GET /assets/missing.js returns a secured 404', async () => {
  const response = await request(app).get('/assets/missing.js').expect(404);
  expectSecurityHeaders(response);
});

test('Malformed API JSON returns a secured 400 without exposing the invalid body', async () => {
  const response = await request(app)
    .post('/api/lecciones/1/responder')
    .set('Content-Type', 'application/json')
    .send('{"example":"invalid-body"')
    .expect(400)
    .expect('Content-Type', /json/);

  expect(response.body).toEqual({ error: 'Solicitud no válida' });
  expectSecurityHeaders(response);
});

test('Malformed JSON outside the API returns a secured plain text 400', async () => {
  const response = await request(app)
    .post('/health')
    .set('Content-Type', 'application/json')
    .send('{')
    .expect(400)
    .expect('Content-Type', /text\/plain/);

  expect(response.text).toBe('Solicitud no válida');
  expectSecurityHeaders(response);
});

test('Unexpected errors return a secured 500 without exposing internal details', async () => {
  getDatabaseStatus.mockImplementationOnce(() => {
    throw new Error('Internal test detail');
  });

  const response = await request(app).get('/health').expect(500).expect('Content-Type', /text\/plain/);
  expect(response.text).toBe('Error interno del servidor');
  expectSecurityHeaders(response);
});
