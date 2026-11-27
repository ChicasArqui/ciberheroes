const {
  hashPassword,
  verifyPassword
} = require('../src/modules/auth/password.service');

describe('servicio de contraseñas', () => {
  const password = 'ClaveSegura123!abc';
  let storedHash;

  beforeAll(async () => {
    storedHash = await hashPassword(password);
  });

  test('genera un hash y no guarda la contraseña en texto', () => {
    expect(storedHash).toMatch(/^scrypt\$1\$/);
    expect(storedHash).not.toContain(password);
  });

  test('genera una sal aleatoria distinta para la misma contraseña', async () => {
    const anotherHash = await hashPassword(password);

    expect(anotherHash).not.toBe(storedHash);
    await expect(verifyPassword(password, anotherHash)).resolves.toBe(true);
  });

  test('acepta la contraseña correcta', async () => {
    await expect(verifyPassword(password, storedHash)).resolves.toBe(true);
  });

  test('rechaza una contraseña incorrecta', async () => {
    await expect(verifyPassword('otra-contraseña', storedHash))
      .resolves.toBe(false);
  });

  test.each([
    ['un valor que no es texto', 123],
    ['un algoritmo desconocido', 'bcrypt$1$salt$key'],
    ['una versión desconocida', 'scrypt$2$salt$key'],
    ['un hash sin sal', 'scrypt$1$$key'],
    ['un hash sin clave', 'scrypt$1$c2FsdA$'],
    [
      'una sal con longitud incorrecta',
      `scrypt$1$${Buffer.from('corta').toString('base64url')}$${Buffer.alloc(64).toString('base64url')}`
    ],
    [
      'una clave con longitud incorrecta',
      `scrypt$1$${Buffer.alloc(16).toString('base64url')}$${Buffer.from('corta').toString('base64url')}`
    ]
  ])('rechaza %s', async (_description, invalidHash) => {
    await expect(verifyPassword(password, invalidHash)).resolves.toBe(false);
  });
});
