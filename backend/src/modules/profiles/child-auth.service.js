const mongoose = require('mongoose');
const ChildProfile = require('./child-profile.model');
const {
  hashPassword,
  verifyPassword
} = require('../auth/password.service');

const PIN_PATTERN = /^\d{6}$/;

function createAuthError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

async function authenticateChild(profileId, temporaryPin, rateLimiter) {
  if (!mongoose.isValidObjectId(profileId) ||
      typeof temporaryPin !== 'string' ||
      !PIN_PATTERN.test(temporaryPin)) {
    throw createAuthError('INVALID_CREDENTIALS');
  }

  const profile = await ChildProfile.findById(profileId)
    .select('+pinHash');

  if (!profile) {
    throw createAuthError('INVALID_CREDENTIALS');
  }

  const limit = await rateLimiter.consume(profileId);

  if (!limit.allowed) {
    const error = createAuthError('TOO_MANY_REQUESTS');
    error.retryAfter = limit.retryAfter;
    throw error;
  }

  const validPin = await verifyPassword(temporaryPin, profile.pinHash);

  if (!validPin) {
    throw createAuthError('INVALID_CREDENTIALS');
  }

  await rateLimiter.reward(profileId);

  return {
    profileId: profile._id,
    nickname: profile.nickname,
    avatarId: profile.avatarId,
    mustChangePin: profile.mustChangePin
  };
}

async function changeChildPin(profileId, newPin, confirmationPin) {
  if (!mongoose.isValidObjectId(profileId)) {
    throw createAuthError('INVALID_PROFILE');
  }

  if (
    typeof newPin !== 'string' ||
    typeof confirmationPin !== 'string' ||
    !PIN_PATTERN.test(newPin) ||
    !PIN_PATTERN.test(confirmationPin)
  ) {
    throw createAuthError('INVALID_PIN');
  }

  if (newPin !== confirmationPin) {
    throw createAuthError('PIN_MISMATCH');
  }

  const pinHash = await hashPassword(newPin);

  const profile = await ChildProfile.findOneAndUpdate(
    { _id: profileId, mustChangePin: true },
    {
      $set: {
        pinHash,
        mustChangePin: false
      }
    },
    { new: true, runValidators: true }
  )
    .select('_id nickname avatarId mustChangePin')
    .lean();

  if (!profile) {
    throw createAuthError('PIN_CHANGE_NOT_ALLOWED');
  }

  return {
    profileId: profile._id,
    nickname: profile.nickname,
    avatarId: profile.avatarId,
    mustChangePin: profile.mustChangePin
  };
}

module.exports = {
  authenticateChild,
  changeChildPin
};
