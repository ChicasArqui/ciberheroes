const express = require('express');
const { createFamilyLookupRateLimit } = require('./family-rate-limit');

const familyCodePattern = /^[A-Za-z0-9_-]{1,64}$/;
const parseJson = express.json({ limit: '1kb' });

function publicProfiles(profiles) {
  const seenIds = new Set();
  return profiles.map(({ id, nickname, avatar }) => {
    const publicId = typeof id === 'string' ? id.trim() : id;
    const publicNickname = typeof nickname === 'string' ? nickname.trim() : '';
    if (!((typeof publicId === 'string' && publicId) || Number.isSafeInteger(publicId))
      || !publicNickname || seenIds.has(String(publicId))) {
      throw new Error('Invalid profile returned by the family repository');
    }

    seenIds.add(String(publicId));
    const profile = { id: publicId, nickname: publicNickname };
    if (typeof avatar === 'string' && avatar.trim()) {
      profile.avatar = avatar.trim();
    }
    return profile;
  });
}

function parseLookupBody(req, res, next) {
  parseJson(req, res, error => {
    if (!error) return next();

    const status = error.status === 413 ? 413 : 400;
    return res.status(status).json({ code: 'INVALID_FAMILY_CODE' });
  });
}

// The repository returns eligible profiles or null if the family is missing.
function createFamilyLookupRouter(repository, rateLimit) {
  const router = express.Router();

  router.post('/lookup', createFamilyLookupRateLimit(rateLimit), parseLookupBody, async (req, res) => {
    const input = req.body?.familyCode;
    const code = typeof input === 'string' ? input.trim() : '';
    if (!familyCodePattern.test(code)) {
      return res.status(400).json({ code: 'INVALID_FAMILY_CODE' });
    }
    if (!repository) {
      return res.status(503).json({ code: 'FAMILY_LOOKUP_UNAVAILABLE' });
    }

    try {
      const profiles = await repository.findProfilesByFamilyCode(code.toUpperCase());
      if (profiles === null) {
        return res.status(404).json({ code: 'FAMILY_NOT_FOUND' });
      }
      return res.json({ profiles: publicProfiles(profiles) });
    } catch {
      return res.status(500).json({ code: 'FAMILY_LOOKUP_FAILED' });
    }
  });

  return router;
}

module.exports = createFamilyLookupRouter;
