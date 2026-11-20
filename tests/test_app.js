const request = require('supertest');
const app = require('../app');

test('GET / returns complete expected response', async () => {
  const res = await request(app).get('/');

  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({
    status: 'ok',
    message: 'Pipeline CI/CD funcionando',
    env: 'dev'
  });
});

test('GET /health returns healthy', async () => {
  const res = await request(app).get('/health');

  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ status: 'healthy' });
});

test('GET /missing returns 404', async () => {
  const res = await request(app).get('/missing');
  expect(res.statusCode).toBe(404);
});

test('POST /health returns 404', async () => {
  const res = await request(app).post('/health');
  expect(res.statusCode).toBe(404);
});