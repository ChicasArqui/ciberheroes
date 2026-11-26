jest.mock('mongoose', () => ({ connection: { readyState: 0 } }));

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');

describe('API CiberHeroes', () => {
  test('GET /health responde 200', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      status: 'healthy',
      server: 'running',
      commit: process.env.RENDER_GIT_COMMIT || 'local',
      database: expect.stringMatching(/^(connected|disconnected)$/)
    });
  });

  test('GET /health informa una conexion activa a MongoDB', async () => {
    mongoose.connection.readyState = 1;
    try {
      const response = await request(app).get('/health').expect(200);
      expect(response.body.database).toBe('connected');
    } finally {
      mongoose.connection.readyState = 0;
    }
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
