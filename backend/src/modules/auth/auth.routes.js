const express = require('express');
const {
  registerGuardianController,
  loginGuardianController,
  logoutGuardianController
} = require('./auth.controller');

function createAuthRoutes(rateLimiters) {
  const router = express.Router();
  router.post('/register', rateLimiters.register, registerGuardianController);
  router.post('/login', rateLimiters.login, loginGuardianController);
  router.post('/logout', logoutGuardianController);
  return router;
}

module.exports = createAuthRoutes;
