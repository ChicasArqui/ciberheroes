const mongoose = require('mongoose');
const ChildProfile = require('../src/modules/profiles/child-profile.model');
const {
  CHILD_AVATAR_IDS
} = require('../src/modules/profiles/child-profile.constants');

describe('ChildProfile model - avatar validation', () => {
  const createProfile = (avatarId) => new ChildProfile({
    familyId: new mongoose.Types.ObjectId(),
    nickname: 'Pipo',
    avatarId,
    pinHash: 'test-hash'
  });

  test.each(CHILD_AVATAR_IDS)(
    'acepta el avatar oficial: %s',
    async (avatarId) => {
      const profile = createProfile(avatarId);

      await expect(profile.validate()).resolves.toBeUndefined();
    }
  );

  test.each(['dragon', 'pipo', 'avatar123'])(
    'rechaza un avatar no permitido: %s',
    async (avatarId) => {
      const profile = createProfile(avatarId);

      await expect(profile.validate()).rejects.toMatchObject({
        errors: {
          avatarId: expect.objectContaining({
            kind: 'enum'
          })
        }
      });
    }
  );
});
