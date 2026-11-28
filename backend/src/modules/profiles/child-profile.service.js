const ChildProfile = require('./child-profile.model');
const Guardian = require('../auth/guardian.model');
const { hashPassword } = require('../auth/password.service');

const PIN_PATTERN = /^\d{6}$/;

function createServiceError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

async function getGuardianFamilyId(guardianId) {
  const guardian = await Guardian.findById(guardianId).select('familyId');

  return guardian?.familyId || null;
}

async function listChildProfiles(guardianId) {
  const familyId = await getGuardianFamilyId(guardianId);

  if (!familyId) return [];

  return ChildProfile.find({ familyId })
    .select('_id nickname avatarId mustChangePin createdAt updatedAt')
    .sort({ createdAt: 1 })
    .lean();
}

async function createChildProfile(
  guardianId,
  { nickname, avatarId, temporaryPin } = {}
) {
  const familyId = await getGuardianFamilyId(guardianId);

  if (!familyId) {
    throw createServiceError('FAMILY_NOT_FOUND');
  }

  if (
    typeof nickname !== 'string' ||
    nickname.trim().length < 2 ||
    nickname.trim().length > 20
  ) {
    throw createServiceError('INVALID_NICKNAME');
  }

  if (typeof avatarId !== 'string' || !avatarId.trim()) {
    throw createServiceError('INVALID_AVATAR');
  }

  if (typeof temporaryPin !== 'string' || !PIN_PATTERN.test(temporaryPin)) {
    throw createServiceError('INVALID_TEMPORARY_PIN');
  }

  const pinHash = await hashPassword(temporaryPin);

  const profile = await ChildProfile.create({
    familyId,
    nickname: nickname.trim(),
    avatarId: avatarId.trim(),
    pinHash,
    mustChangePin: true
  });

  return {
    id: profile._id,
    nickname: profile.nickname,
    avatarId: profile.avatarId,
    mustChangePin: profile.mustChangePin
  };
}

async function updateChildProfile(
  guardianId,
  profileId,
  { nickname, avatarId } = {}
) {
  const familyId = await getGuardianFamilyId(guardianId);

  if (!familyId) {
    throw createServiceError('FAMILY_NOT_FOUND');
  }

  const updates = {};

  if (nickname !== undefined) {
    if (
      typeof nickname !== 'string' ||
      nickname.trim().length < 2 ||
      nickname.trim().length > 20
    ) {
      throw createServiceError('INVALID_NICKNAME');
    }

    updates.nickname = nickname.trim();
  }

  if (avatarId !== undefined) {
    if (typeof avatarId !== 'string' || !avatarId.trim()) {
      throw createServiceError('INVALID_AVATAR');
    }

    updates.avatarId = avatarId.trim();
  }

  if (Object.keys(updates).length === 0) {
    throw createServiceError('NO_PROFILE_CHANGES');
  }

  const profile = await ChildProfile.findOneAndUpdate(
    { _id: profileId, familyId },
    { $set: updates },
    { new: true, runValidators: true }
  )
    .select('_id nickname avatarId mustChangePin createdAt updatedAt')
    .lean();

  if (!profile) {
    throw createServiceError('PROFILE_NOT_FOUND');
  }

  return {
    id: profile._id,
    nickname: profile.nickname,
    avatarId: profile.avatarId,
    mustChangePin: profile.mustChangePin
  };
}

module.exports = {
  listChildProfiles,
  createChildProfile,
  updateChildProfile
};
