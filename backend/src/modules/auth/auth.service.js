const mongoose = require('mongoose');
const Guardian = require('./guardian.model');
const Family = require('../profiles/family.model');
const {
  isValidGuardianEmail,
  isValidGuardianPassword
} = require('./auth.validation');
const {
  hashPassword,
  verifyPassword
} = require('./password.service');
const { generateFamilyCode } = require('../profiles/family-code.service');

function createRegistrationError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

async function registerGuardian({ email, password } = {}) {
  if (
    !isValidGuardianEmail(email) ||
    !isValidGuardianPassword(password)
  ) {
    throw createRegistrationError('INVALID_INPUT');
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (await Guardian.exists({ email: normalizedEmail })) {
    throw createRegistrationError('EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await hashPassword(password);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const session = await mongoose.startSession();

    try {
      let guardianData;

      await session.withTransaction(async () => {
        const [family] = await Family.create(
          [{ familyCode: generateFamilyCode() }],
          { session }
        );

        const [guardian] = await Guardian.create(
          [{
            email: normalizedEmail,
            passwordHash,
            familyId: family._id
          }],
          { session }
        );

        guardianData = {
          guardian: {
            id: guardian._id.toString(),
            email: guardian.email
          }
        };
      });

      return guardianData;
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.email) {
        throw createRegistrationError('EMAIL_ALREADY_EXISTS');
      }
      
      if (error.code === 11000 && error.keyPattern?.familyCode) {
        if (attempt < 4) continue;
        throw createRegistrationError('FAMILY_CODE_GENERATION_FAILED');
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }

  throw createRegistrationError('FAMILY_CODE_GENERATION_FAILED');
}

async function loginGuardian({ email, password } = {}) {
  if (
    !isValidGuardianEmail(email) ||
    typeof password !== 'string' ||
    password.length === 0
  ) {
    throw createRegistrationError('INVALID_INPUT');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const guardian = await Guardian.findOne({
    email: normalizedEmail
  }).select('+passwordHash');

  if (
    !guardian ||
    !(await verifyPassword(password, guardian.passwordHash))
  ) {
    throw createRegistrationError('INVALID_CREDENTIALS');
  }

  return {
    guardian: {
      id: guardian._id.toString(),
      email: guardian.email
    }
  };
}

module.exports = {
  registerGuardian,
  loginGuardian
};