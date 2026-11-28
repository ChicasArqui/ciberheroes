
const ChildProfile = require('./child-profile.model');
const Guardian = require('../auth/guardian.model');
const { hashPassword } = require('../auth/password.service');

const PIN_PATTERN = /^\d{6}$/;

async function getGuardianFamilyId(guardianId) {
  const guardian = await Guardian.findById(guardianId).select('familyId');

  return guardian?.familyId || null;
}

async function listChildProfiles(guardianId) {
  const familyId = await getGuardianFamilyId(guardianId);

  if (!familyId) return [];

  return ChildProfile.find({ familyId })
    .select('_id nickname avatar mustChangePin createdAt updatedAt')
    .sort({ createdAt: 1 })
    .lean();
}

async function createChildProfile(guardianId, { nickname, avatar, temporaryPin }) {
  const familyId = await getGuardianFamilyId(guardianId);

  if (!familyId) {
    const error = new Error('FAMILY_NOT_FOUND');
    error.code = 'FAMILY_NOT_FOUND';
    throw error;
  }

  if (typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 20) {
    const error = new Error('INVALID_NICKNAME');
    error.code = 'INVALID_NICKNAME';
    throw error;
  }

  if (typeof avatar !== 'string' || !avatar.trim()) {
    const error = new Error('INVALID_AVATAR');
    error.code = 'INVALID_AVATAR';
    throw error;
  }

  if (typeof temporaryPin !== 'string' || !PIN_PATTERN.test(temporaryPin)) {
    const error = new Error('INVALID_TEMPORARY_PIN');
    error.code = 'INVALID_TEMPORARY_PIN';
    throw error;
  }

  const pinHash = await hashPassword(temporaryPin);

  const profile = await ChildProfile.create({
    familyId,
    nickname: nickname.trim(),
    avatar: avatar.trim(),
    pinHash,
    mustChangePin: true
  });

  return {
    id: profile._id,
    nickname: profile.nickname,
    avatar: profile.avatar,
    mustChangePin: profile.mustChangePin
  };
}

async function updateChildProfile(guardianId, profileId, { nickname, avatar }) {
  const familyId = await getGuardianFamilyId(guardianId);

  if (!familyId) {
    const error = new Error('FAMILY_NOT_FOUND');
    error.code = 'FAMILY_NOT_FOUND';
    throw error;
  }

  const updates = {};

  if (nickname !== undefined) {
    if (typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 20) {
      const error = new Error('INVALID_NICKNAME');
      error.code = 'INVALID_NICKNAME';
      throw error;
    }

    updates.nickname = nickname.trim();
  }

  if (avatar !== undefined) {
    if (typeof avatar !== 'string' || !avatar.trim()) {
      const error = new Error('INVALID_AVATAR');
      error.code = 'INVALID_AVATAR';
      throw error;
    }

    updates.avatar = avatar.trim();
  }

  if (Object.keys(updates).length === 0) {
    const error = new Error('NO_PROFILE_CHANGES');
    error.code = 'NO_PROFILE_CHANGES';
    throw error;
  }

  const profile = await ChildProfile.findOneAndUpdate(
    { _id: profileId, familyId },
    { $set: updates },
    { new: true, runValidators: true }
  )
    .select('_id nickname avatar mustChangePin createdAt updatedAt')
    .lean();

  if (!profile) {
    const error = new Error('PROFILE_NOT_FOUND');
    error.code = 'PROFILE_NOT_FOUND';
    throw error;
  }

  return {
    id: profile._id,
    nickname: profile.nickname,
    avatar: profile.avatar,
    mustChangePin: profile.mustChangePin
  };
}

module.exports = {
  listChildProfiles,
  createChildProfile,
  updateChildProfile
};
