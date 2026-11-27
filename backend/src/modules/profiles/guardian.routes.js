const express = require('express');
const {
  requireGuardianSession
} = require('../auth/guardian-auth.middleware');
const {
  getGuardianFamilyController
} = require('./family.controller');

const router = express.Router();

router.get(
  '/family',
  requireGuardianSession,
  getGuardianFamilyController
);

module.exports = router;