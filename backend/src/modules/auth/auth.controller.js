const {
  registerGuardian,
  loginGuardian
} = require('./auth.service');

function registrationWithoutSession(req, res, result) {
  clearGuardianCookie(res);
  const complete = () => {
    // Evitar que express-session vuelva a guardar una sesión incompleta al responder.
    req.session = null;
    return res.status(201).json({ ...result, sessionCreated: false });
  };
  if (req.session?.destroy) return req.session.destroy(complete);
  return complete();
}

async function registerGuardianController(req, res) {
  try {
    const result = await registerGuardian(req.body);

    req.session.regenerate((sessionError) => {
      if (sessionError) {
        return registrationWithoutSession(req, res, result);
      }

      req.session.guardianId = result.guardian.id;

      req.session.save((saveError) => {
        if (saveError) {
          return registrationWithoutSession(req, res, result);
        }

        return res.status(201).json(result);
      });
    });
  } catch (error) {
    if (error.code === 'INVALID_INPUT') {
      return res.status(400).json({ error: 'INVALID_INPUT' });
    }

    if (error.code === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' });
    }

    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}

async function loginGuardianController(req, res) {
  try {
    const result = await loginGuardian(req.body);
    await res.locals.settleLoginAttempt?.('success');

    req.session.regenerate((sessionError) => {
      if (sessionError) {
        return res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR'
        });
      }

      req.session.guardianId = result.guardian.id;

      req.session.save((saveError) => {
        if (saveError) {
          return res.status(500).json({
            error: 'INTERNAL_SERVER_ERROR'
          });
        }

        return res.status(200).json(result);
      });
    });
  } catch (error) {
    try {
      await res.locals.settleLoginAttempt?.(
        error.code === 'INVALID_CREDENTIALS' ? 'failure' : 'error'
      );
    } catch {
      return res.status(503).json({ error: 'AUTH_SERVICE_UNAVAILABLE' });
    }
    if (error.code === 'INVALID_INPUT') {
      return res.status(400).json({ error: 'INVALID_INPUT' });
    }

    if (error.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}

function clearGuardianCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('ciberheroes.sid', {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax'
  });
}

function logoutGuardianController(req, res) {
  if (!req.session) {
    clearGuardianCookie(res);
    return res.status(200).json({
      message: 'Sesión cerrada'
    });
  }

  return req.session.destroy((error) => {
    clearGuardianCookie(res);

    if (error) {
      return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR'
      });
    }

    return res.status(200).json({
      message: 'Sesión cerrada'
    });
  });
}

module.exports = {
  registerGuardianController,
  loginGuardianController,
  logoutGuardianController
};
