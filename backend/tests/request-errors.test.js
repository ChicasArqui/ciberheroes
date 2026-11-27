const request = require('supertest');
const baseApp = require('../src/app');

describe('errores HTTP sin filtrar credenciales', () => {
  let loggedError;
  let app;
  const originalEnvironment = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    app = baseApp.createApp();
    loggedError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnvironment;
  });

  test.each(['/api/auth/register', '/api/auth/login'])(
    '%s rechaza JSON mal formado sin imprimir el cuerpo', async (path) => {
      const response = await request(app).post(path)
        .set('Content-Type', 'application/json')
        .send('{"password": ClaveFicticia!}');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'INVALID_INPUT' });
      expect(response.text).not.toContain('ClaveFicticia');
      expect(response.text).not.toContain('SyntaxError');
      // El logger por defecto de Express se ejecuta de forma diferida.
      await new Promise((resolve) => setImmediate(resolve));
      expect(loggedError).not.toHaveBeenCalled();
    }
  );

  test('rechaza cuerpos demasiado grandes sin imprimirlos', async () => {
    const response = await request(app).post('/api/auth/login')
      .send({ password: 'Ficticio!'.repeat(20000) });
    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: 'PAYLOAD_TOO_LARGE' });
    expect(loggedError).not.toHaveBeenCalled();
  });

  test('oculta errores del almacén de sesión', async () => {
    const failingApp = baseApp.createApp({
      sessionMiddleware: (req, res, next) => next(new Error('cookie-secreta-ficticia'))
    });
    const response = await request(failingApp).get('/api/guardian/family');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'INTERNAL_SERVER_ERROR' });
    expect(loggedError).not.toHaveBeenCalled();
  });
});
