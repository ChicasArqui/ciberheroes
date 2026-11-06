
/* global describe, test, expect */

const request = require('supertest');
const app = require('../src/app');

describe('API de lecciones CiberHeroes', () => {
  test('GET /api/lecciones devuelve las lecciones', async () => {
    const res = await request(app).get('/api/lecciones');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/lecciones/1 devuelve una leccion', async () => {
    const res = await request(app).get('/api/lecciones/1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.questions.length).toBeGreaterThan(0);
    expect(res.body.questions[0]).not.toHaveProperty('correctAnswer');
  });

  test('GET /api/lecciones/999 devuelve 404', async () => {
    const res = await request(app).get('/api/lecciones/999');

    expect(res.status).toBe(404);
  });

  test('POST respuesta correcta entrega 10 XP', async () => {
    const res = await request(app)
      .post('/api/lecciones/1/responder')
      .send({ questionId: 1, answer: 2 });

    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(true);
    expect(res.body.xpEarned).toBe(10);
  });

  test('POST respuesta incorrecta entrega 0 XP', async () => {
    const res = await request(app)
      .post('/api/lecciones/1/responder')
      .send({ questionId: 1, answer: 0 });

    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(false);
    expect(res.body.xpEarned).toBe(0);
  });

  test('POST respuesta fuera de rango devuelve 400', async () => {
    const res = await request(app)
      .post('/api/lecciones/1/responder')
      .send({ questionId: 1, answer: 99 });

    expect(res.status).toBe(400);
  });

  test('POST respuesta no entera devuelve 400', async () => {
    const res = await request(app)
      .post('/api/lecciones/1/responder')
      .send({ questionId: 1, answer: 1.5 });

    expect(res.status).toBe(400);
  });

  test('POST sin respuesta devuelve 400', async () => {
    const res = await request(app)
      .post('/api/lecciones/1/responder')
      .send({ questionId: 1 });

    expect(res.status).toBe(400);
  });

  test('POST leccion inexistente devuelve 404', async () => {
    const res = await request(app)
      .post('/api/lecciones/999/responder')
      .send({ questionId: 1, answer: 0 });

    expect(res.status).toBe(404);
  });

  test('POST pregunta inexistente devuelve 404', async () => {
    const res = await request(app)
      .post('/api/lecciones/1/responder')
      .send({ questionId: 999, answer: 0 });

    expect(res.status).toBe(404);
  });

  test('GET segunda leccion devuelve sus preguntas', async () => {
    const res = await request(app).get('/api/lecciones/2');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(2);
  });

  test('POST segunda leccion acepta respuesta correcta', async () => {
    const res = await request(app)
      .post('/api/lecciones/2/responder')
      .send({ questionId: 1, answer: 1 });

    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(true);
  });
});
