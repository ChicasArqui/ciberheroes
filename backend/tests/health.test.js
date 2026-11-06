/* global describe, test, expect */

const request = require('supertest');
const app = require('../src/app');

describe('API CiberHeroes', () => {
  test('GET /health responde 200', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'healthy' });
  });

  test('GET / responde correctamente', async () => {
    const response = await request(app).get('/');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      message: 'API CiberHeroes funcionando'
    });
  });

  test('GET /ruta-inexistente responde 404', async () => {
    const response = await request(app).get('/ruta-inexistente');

    expect(response.statusCode).toBe(404);
  });

  test('POST /health responde 404', async () => {
    const response = await request(app).post('/health');

    expect(response.statusCode).toBe(404);
  });
});