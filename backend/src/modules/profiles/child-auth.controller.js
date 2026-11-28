const {
  authenticateChild,
  changeChildPin
} = require('./child-auth.service');

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function regenerateChildSession(req, profile) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);

      req.session.childProfileId = String(profile.profileId);
      req.session.mustChangePin = profile.mustChangePin;

      saveSession(req).then(resolve).catch(reject);
    });
  });
}

function clearChildSession(req, res) {
  return new Promise((resolve) => {
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    };

    res.clearCookie('ciberheroes.sid', cookieOptions);

    if (!req.session) {
      return resolve();
    }

    req.session.destroy(() => resolve());
  });
}

async function loginChildController(req, res) {
  try {
    const { profileId, pin } = req.body || {};

    const profile = await authenticateChild(
      profileId,
      pin,
      res.locals.childPinRateLimiter,
      req.ip
    );

    await regenerateChildSession(req, profile);

    return res.status(200).json({
      profile: {
        id: String(profile.profileId),
        nickname: profile.nickname,
        avatarId: profile.avatarId,
        mustChangePin: profile.mustChangePin
      }
    });
  } catch (error) {
    if (error.code === 'TOO_MANY_REQUESTS') {
      res.set('Retry-After', String(error.retryAfter));
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS'
      });
    }

    if (error.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS'
      });
    }

    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}

async function changeChildPinController(req, res) {
  let pinWasChanged = false;

  try {
    const profile = await changeChildPin(
      req.session.childProfileId,
      req.body?.newPin,
      req.body?.confirmationPin
    );

    pinWasChanged = true;
    req.session.mustChangePin = false;

    await saveSession(req);

    return res.status(200).json({ profile });
  } catch (error) {
    if (pinWasChanged) {
      // El PIN definitivo ya está guardado en MongoDB.
      // Se invalida la sesión para permitir un nuevo inicio
      // de sesión con el PIN definitivo si falla su persistencia.
      await clearChildSession(req, res);

      return res.status(503).json({
        error: 'SESSION_UPDATE_FAILED',
        message: 'Inicia sesión nuevamente con tu nuevo PIN.'
      });
    }

    const statusByCode = {
      INVALID_PIN: 400,
      PIN_MISMATCH: 400,
      PIN_CHANGE_NOT_ALLOWED: 403
    };

    return res.status(statusByCode[error.code] || 500).json({
      error: statusByCode[error.code]
        ? error.code
        : 'INTERNAL_SERVER_ERROR'
    });
  }
}

module.exports = {
  loginChildController,
  changeChildPinController
};
