
const express = require('express');
const {
  requireGuardianSession
} = require('../auth/guardian-auth.middleware');

const {
  getGuardianFamilyController
} = require('./family.controller');

const {
  listChildProfilesController,
  createChildProfileController,
  updateChildProfileController
} = require('./child-profile.controller');

const router = express.Router();

router.get(
  '/family',
  requireGuardianSession,
  getGuardianFamilyController
);

router.get(
  '/profiles',
  requireGuardianSession,
  listChildProfilesController
);

router.post(
  '/profiles',
  requireGuardianSession,
  createChildProfileController
);

router.patch(
  '/profiles/:profileId',
  requireGuardianSession,
  updateChildProfileController
);

module.exports = router;
