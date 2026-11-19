const { describe, test, expect } = require('@jest/globals')
const request = require('supertest')
const app = require('../app')

describe('CIB-23 - Pruebas basicas de seguridad', () => {
  test('Una ruta inexistente no debe revelar detalles internos', async () => {
    const response = await request(app).get('/ruta-inexistente')

    expect(response.statusCode).toBe(404)
    expect(response.text).not.toMatch(/Error:\s/)
    expect(response.text).not.toMatch(/at\s+\S+\s+\(/)
  })
})
