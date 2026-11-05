const request = require('supertest')
const app = require('../app')

test('GET / returns ok', async () => {
    const res = await request(app).get('/')
    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe('ok')
})

test('GET /health returns healthy', async () => {
    const res = await request(app).get('/health')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ status: 'healthy' })
})

test('GET /missing returns 404', async () => {
    const res = await request(app).get('/missing')
    expect(res.statusCode).toBe(404)
})
