const request = require('supertest');
const app = require('../src/app');

describe('GET /api/guardian/family', () => {
  test('rechaza la consulta si no hay sesión de Guardián', async () => {
    const response = await request(app).get('/api/guardian/family');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'AUTHENTICATION_REQUIRED'
    });
  });
});