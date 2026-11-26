const express = require('express');
const {
  registerGuardianController,
  loginGuardianController,
  logoutGuardianController
} = require('./auth.controller');

const router = express.Router();

router.post('/register', registerGuardianController);
router.post('/login', loginGuardianController);
router.post('/logout', logoutGuardianController);

module.exports = router;