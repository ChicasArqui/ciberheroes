const {
  isValidGuardianEmail,
  isValidGuardianPassword
} = require('../src/modules/auth/auth.validation');

describe('isValidGuardianEmail', () => {
  test('acepta un correo válido aunque tenga espacios alrededor', () => {
    expect(isValidGuardianEmail(' guardian@example.com ')).toBe(true);
  });

  test('rechaza un correo con formato inválido', () => {
    expect(isValidGuardianEmail('esto-no-es-un-correo')).toBe(false);
  });

  test('rechaza valores que no sean texto', () => {
    expect(isValidGuardianEmail(123)).toBe(false);
  });
});

describe('isValidGuardianPassword', () => {
  test('acepta una contraseña que cumple las reglas', () => {
    expect(isValidGuardianPassword('ClaveSegura123!abc')).toBe(true);
  });

  test('acepta una contraseña de exactamente 15 caracteres', () => {
    expect(isValidGuardianPassword('ClaveSegura123!')).toBe(true);
  });

  test('rechaza valores que no sean texto', () => {
    expect(isValidGuardianPassword(null)).toBe(false);
  });

  test('rechaza contraseñas de menos de 15 caracteres', () => {
    expect(isValidGuardianPassword('Abc!123')).toBe(false);
  });

  test('rechaza una contraseña de exactamente 14 caracteres', () => {
    expect(isValidGuardianPassword('ClaveSegura12!')).toBe(false);
  });

  test('rechaza una contraseña sin mayúscula', () => {
    expect(isValidGuardianPassword('clavesegura123!abc')).toBe(false);
  });

  test('rechaza una contraseña sin minúscula', () => {
    expect(isValidGuardianPassword('CLAVESEGURA123!ABC')).toBe(false);
  });

  test('rechaza una contraseña sin símbolo', () => {
    expect(isValidGuardianPassword('ClaveSegura123abcXYZ')).toBe(false);
  });
});
