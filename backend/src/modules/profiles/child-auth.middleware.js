function requireChildSession(req, res, next) {
  if (!req.session?.childProfileId) {
    return res.status(401).json({
      error: 'CHILD_AUTHENTICATION_REQUIRED'
    });
  }

  return next();
}

function requireChildPinChange(req, res, next) {
  if (!req.session?.childProfileId) {
    return res.status(401).json({
      error: 'CHILD_AUTHENTICATION_REQUIRED'
    });
  }

  if (req.session.mustChangePin !== true) {
    return res.status(403).json({
      error: 'PIN_CHANGE_NOT_REQUIRED'
    });
  }

  return next();
}

function requireCompletedChildSetup(req, res, next) {
  if (!req.session?.childProfileId) {
    return res.status(401).json({
      error: 'CHILD_AUTHENTICATION_REQUIRED'
    });
  }

  if (req.session.mustChangePin !== false) {
    return res.status(403).json({
      error: 'PIN_CHANGE_REQUIRED'
    });
  }

  return next();
}

module.exports = {
  requireChildSession,
  requireChildPinChange,
  requireCompletedChildSetup
};
