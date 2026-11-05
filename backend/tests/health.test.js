const request = require('supertest');
const app = require('../src/app');

describe('API CiberHeroes', () => {
  test('GET /health responde 200', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      status: 'healthy'
    });
  });
});