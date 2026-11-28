const express = require('express');

const {
  loginChildController,
  changeChildPinController
} = require('./child-auth.controller');

const {
  requireChildSession,
  requireChildPinChange
} = require('./child-auth.middleware');

function createChildAuthRoutes(childPinRateLimiter) {
  const router = express.Router();

  router.post('/login', (req, res, next) => {
    res.locals.childPinRateLimiter = childPinRateLimiter;
    next();
  }, loginChildController);

  router.post(
    '/change-pin',
    requireChildSession,
    requireChildPinChange,
    changeChildPinController
  );

  return router;
}

module.exports = createChildAuthRoutes;
