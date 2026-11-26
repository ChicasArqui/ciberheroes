const {
  randomBytes,
  scrypt,
  timingSafeEqual
} = require('node:crypto');
const { promisify } = require('node:util');

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

const SCRYPT_OPTIONS = {
  N: 2 ** 14,
  r: 8,
  p: 5,
  maxmem: 64 * 1024 * 1024
};

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(
    password,
    salt,
    KEY_LENGTH,
    SCRYPT_OPTIONS
  );

  return `scrypt$1$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string') return false;

  const [algorithm, version, saltText, keyText] = storedHash.split('$');

  if (algorithm !== 'scrypt' || version !== '1' || !saltText || !keyText) {
    return false;
  }

  const salt = Buffer.from(saltText, 'base64url');
  const expectedKey = Buffer.from(keyText, 'base64url');

  if (salt.length !== 16 || expectedKey.length !== KEY_LENGTH) {
    return false;
  }

  const actualKey = await scryptAsync(
    password,
    salt,
    KEY_LENGTH,
    SCRYPT_OPTIONS
  );

  return timingSafeEqual(expectedKey, actualKey);
}

module.exports = {
  hashPassword,
  verifyPassword
};