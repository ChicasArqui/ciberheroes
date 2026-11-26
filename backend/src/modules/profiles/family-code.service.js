const { randomInt } = require('node:crypto');

const FAMILY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FAMILY_CODE_LENGTH = 8;

function generateFamilyCode() {
  return Array.from(
    { length: FAMILY_CODE_LENGTH },
    () => FAMILY_CODE_ALPHABET[randomInt(FAMILY_CODE_ALPHABET.length)]
  ).join('');
}

module.exports = { generateFamilyCode };