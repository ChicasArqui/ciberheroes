function requireGuardianSession(req, res, next) {
  if (!req.session?.guardianId) {
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED'
    });
  }

  return next();
}

module.exports = { requireGuardianSession };