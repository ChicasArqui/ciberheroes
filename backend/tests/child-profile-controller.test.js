jest.mock('../src/modules/profiles/child-profile.service', () => ({
  listChildProfiles: jest.fn(),
  createChildProfile: jest.fn(),
  updateChildProfile: jest.fn()
}));

const {
  listChildProfiles,
  createChildProfile,
  updateChildProfile
} = require('../src/modules/profiles/child-profile.service');

const {
  listChildProfilesController,
  createChildProfileController,
  updateChildProfileController
} = require('../src/modules/profiles/child-profile.controller');

describe('controlador de perfiles infantiles', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      session: { guardianId: 'guardian-1' },
      body: {},
      params: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('listChildProfilesController', () => {
    test('devuelve los perfiles con estado 200', async () => {
      const profiles = [
        { id: 'profile-1', nickname: 'Pipo', avatarId: 'pipo' }
      ];

      listChildProfiles.mockResolvedValue(profiles);

      await listChildProfilesController(req, res);

      expect(listChildProfiles).toHaveBeenCalledWith('guardian-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ profiles });
    });

    test('devuelve 500 si ocurre un error inesperado', async () => {
      listChildProfiles.mockRejectedValue(new Error('Database error'));

      await listChildProfilesController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'INTERNAL_SERVER_ERROR'
      });
    });
  });

  describe('createChildProfileController', () => {
    test('crea un perfil y devuelve estado 201', async () => {
      const profile = {
        id: 'profile-1',
        nickname: 'Pipo',
        avatarId: 'pipo',
        mustChangePin: true
      };

      req.body = {
        nickname: 'Pipo',
        avatarId: 'pipo',
        temporaryPin: '123456'
      };

      createChildProfile.mockResolvedValue(profile);

      await createChildProfileController(req, res);

      expect(createChildProfile).toHaveBeenCalledWith(
        'guardian-1',
        req.body
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ profile });
    });

    test('devuelve 400 si el PIN temporal es inválido', async () => {
      req.body = {
        nickname: 'Pipo',
        avatarId: 'pipo',
        temporaryPin: '12345'
      };

      createChildProfile.mockRejectedValue(
        Object.assign(new Error('INVALID_TEMPORARY_PIN'), {
          code: 'INVALID_TEMPORARY_PIN'
        })
      );

      await createChildProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'INVALID_TEMPORARY_PIN'
      });
    });
  });

  describe('updateChildProfileController', () => {
    test('actualiza un perfil y devuelve estado 200', async () => {
      const profile = {
        id: '507f1f77bcf86cd799439011',
        nickname: 'Pipo nuevo',
        avatarId: 'guardian',
        mustChangePin: true
      };

      req.params.profileId = '507f1f77bcf86cd799439011';
      req.body = {
        nickname: 'Pipo nuevo',
        avatarId: 'guardian'
      };

      updateChildProfile.mockResolvedValue(profile);

      await updateChildProfileController(req, res);

      expect(updateChildProfile).toHaveBeenCalledWith(
        'guardian-1',
        '507f1f77bcf86cd799439011',
        req.body
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ profile });
    });

    test('devuelve 400 si el ID del perfil es inválido', async () => {
      req.params.profileId = 'id-invalido';

      updateChildProfile.mockRejectedValue(
        Object.assign(new Error('INVALID_PROFILE_ID'), {
          code: 'INVALID_PROFILE_ID'
        })
      );

      await updateChildProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'INVALID_PROFILE_ID'
      });
    });

    test('devuelve 404 si el perfil no pertenece a la familia', async () => {
      req.params.profileId = '507f1f77bcf86cd799439012';

      updateChildProfile.mockRejectedValue(
        Object.assign(new Error('PROFILE_NOT_FOUND'), {
          code: 'PROFILE_NOT_FOUND'
        })
      );

      await updateChildProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'PROFILE_NOT_FOUND'
      });
    });

    test('devuelve 500 si ocurre un error inesperado', async () => {
      req.params.profileId = '507f1f77bcf86cd799439011';

      updateChildProfile.mockRejectedValue(
        new Error('Database error')
      );

      await updateChildProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'INTERNAL_SERVER_ERROR'
      });
    });
  });
});
