const request = require('supertest');
const app = require('../app');

test('GET / serves the React build and its JavaScript entry point', async () => {
  const response = await request(app).get('/').expect(200).expect('Content-Type', /html/);
  expect(response.text).toContain('<div id="root"></div>');
  expect(response.text).toContain('CiberHéroes');

  const entryPoint = response.text.match(/src="(\/assets\/[^"]+\.js)"/);
  expect(entryPoint).not.toBeNull();
  await request(app).get(entryPoint[1]).expect(200).expect('Content-Type', /javascript/);
});

test('GET /api/missing returns a JSON 404', async () => {
  await request(app).get('/api/missing').expect(404).expect('Content-Type', /json/);
});

test('GET /assets/missing.js returns 404', async () => {
  await request(app).get('/assets/missing.js').expect(404);
});
