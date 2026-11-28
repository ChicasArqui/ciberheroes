
const {
  listChildProfiles,
  createChildProfile,
  updateChildProfile,
  deleteChildProfile
} = require('./child-profile.service');

async function listChildProfilesController(req, res) {
  try {
    const profiles = await listChildProfiles(req.session.guardianId);

    return res.status(200).json({ profiles });
  } catch {
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}

async function createChildProfileController(req, res) {
  try {
    const profile = await createChildProfile(
      req.session.guardianId,
      req.body
    );

    return res.status(201).json({ profile });
  } catch (error) {
    const statusByCode = {
      FAMILY_NOT_FOUND: 404,
      INVALID_NICKNAME: 400,
      INVALID_AVATAR: 400,
      INVALID_TEMPORARY_PIN: 400
    };

    return res.status(statusByCode[error.code] || 500).json({
      error: statusByCode[error.code]
        ? error.code
        : 'INTERNAL_SERVER_ERROR'
    });
  }
}

async function updateChildProfileController(req, res) {
  try {
    const profile = await updateChildProfile(
      req.session.guardianId,
      req.params.profileId,
      req.body
    );

    return res.status(200).json({ profile });
  } catch (error) {
    const statusByCode = {
      FAMILY_NOT_FOUND: 404,
      PROFILE_NOT_FOUND: 404,
      INVALID_PROFILE_ID: 400,
      INVALID_NICKNAME: 400,
      INVALID_AVATAR: 400,
      NO_PROFILE_CHANGES: 400
    };

    return res.status(statusByCode[error.code] || 500).json({
      error: statusByCode[error.code]
        ? error.code
        : 'INTERNAL_SERVER_ERROR'
    });
  }
}

async function deleteChildProfileController(req, res) {
  try {
    await deleteChildProfile(req.session.guardianId, req.params.profileId);
    return res.status(200).json({ message: 'PROFILE_DELETED' });
  } catch (error) {
    const statusByCode = { FAMILY_NOT_FOUND: 404, PROFILE_NOT_FOUND: 404, INVALID_PROFILE_ID: 400 };
    return res.status(statusByCode[error.code] || 500).json({
      error: statusByCode[error.code] ? error.code : 'INTERNAL_SERVER_ERROR'
    });
  }
}

module.exports = {
  listChildProfilesController,
  createChildProfileController,
  updateChildProfileController,
  deleteChildProfileController
};
