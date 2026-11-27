const request = require('supertest');
const app = require('../src/app');

describe('GET /api/guardian/family', () => {
  test('rechaza la consulta si no hay sesión de Guardián', async () => {
    const response = await request(app).get('/api/guardian/family');

    expect(response.status).toBe(401);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toEqual({
      error: 'AUTHENTICATION_REQUIRED'
    });
  });

  test('no permite cachear errores del parser de autenticación', async () => {
    const response = await request(app).post('/api/auth/login')
      .set('Content-Type', 'application/json').send('{');
    expect(response.status).toBe(400);
    expect(response.headers['cache-control']).toBe('no-store');
  });
});
