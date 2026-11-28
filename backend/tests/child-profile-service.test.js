
jest.mock('../src/modules/profiles/child-profile.model', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn()
}));

jest.mock('../src/modules/auth/guardian.model', () => ({
  findById: jest.fn()
}));

jest.mock('../src/modules/auth/password.service', () => ({
  hashPassword: jest.fn()
}));

const ChildProfile = require('../src/modules/profiles/child-profile.model');
const Guardian = require('../src/modules/auth/guardian.model');
const { hashPassword } = require('../src/modules/auth/password.service');

const {
  listChildProfiles,
  createChildProfile,
  updateChildProfile
} = require('../src/modules/profiles/child-profile.service');

describe('servicio de perfiles infantiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockGuardian(familyId = 'family-1') {
    Guardian.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(
        familyId ? { familyId } : null
      )
    });
  }

  test('lista únicamente los perfiles de la familia del Guardián', async () => {
    mockGuardian();

    const profiles = [{ _id: 'profile-1', nickname: 'Pipo' }];
    const query = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(profiles)
    };

    ChildProfile.find.mockReturnValue(query);

    await expect(listChildProfiles('guardian-1')).resolves.toEqual(profiles);

    expect(ChildProfile.find).toHaveBeenCalledWith({
      familyId: 'family-1'
    });
    expect(query.select).toHaveBeenCalledWith(
      '_id nickname avatarId mustChangePin createdAt updatedAt'
    );
  });

  test('crea un perfil y almacena el hash del PIN temporal', async () => {
    mockGuardian();
    hashPassword.mockResolvedValue('scrypt$1$salt$hash');

    ChildProfile.create.mockResolvedValue({
      _id: 'profile-1',
      nickname: 'Pipo',
      avatarId: 'pipo',
      mustChangePin: true
    });

    const result = await createChildProfile('guardian-1', {
      nickname: ' Pipo ',
      avatarId: 'pipo',
      temporaryPin: '123456'
    });

    expect(hashPassword).toHaveBeenCalledWith('123456');
    expect(ChildProfile.create).toHaveBeenCalledWith({
      familyId: 'family-1',
      nickname: 'Pipo',
      avatarId: 'pipo',
      pinHash: 'scrypt$1$salt$hash',
      mustChangePin: true
    });
    expect(result).toEqual({
      id: 'profile-1',
      nickname: 'Pipo',
      avatarId: 'pipo',
      mustChangePin: true
    });
    expect(JSON.stringify(result)).not.toContain('123456');
    expect(JSON.stringify(result)).not.toContain('scrypt');
  });

  test.each(['12345', '1234567', '12ab56', '', 123456])(
    'rechaza un PIN temporal inválido: %p',
    async (temporaryPin) => {
      mockGuardian();

      await expect(createChildProfile('guardian-1', {
        nickname: 'Pipo',
        avatarId: 'pipo',
        temporaryPin
      })).rejects.toMatchObject({
        code: 'INVALID_TEMPORARY_PIN'
      });

      expect(hashPassword).not.toHaveBeenCalled();
      expect(ChildProfile.create).not.toHaveBeenCalled();
    }
  );

  test('rechaza la creación si el Guardián no tiene familia', async () => {
    mockGuardian(null);

    await expect(createChildProfile('guardian-1', {
      nickname: 'Pipo',
      avatarId: 'pipo',
      temporaryPin: '123456'
    })).rejects.toMatchObject({
      code: 'FAMILY_NOT_FOUND'
    });

    expect(ChildProfile.create).not.toHaveBeenCalled();
  });

  test('actualiza un perfil perteneciente a la familia del Guardián', async () => {
    mockGuardian();

    const updatedProfile = {
      _id: 'profile-1',
      nickname: 'Pipo nuevo',
      avatarId: 'guardian',
      mustChangePin: true
    };

    const query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(updatedProfile)
    };

    ChildProfile.findOneAndUpdate.mockReturnValue(query);

    await expect(updateChildProfile('guardian-1', 'profile-1', {
      nickname: 'Pipo nuevo',
      avatarId: 'guardian'
    })).resolves.toEqual({
      id: 'profile-1',
      nickname: 'Pipo nuevo',
      avatarId: 'guardian',
      mustChangePin: true
    });

    expect(ChildProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'profile-1', familyId: 'family-1' },
      { $set: { nickname: 'Pipo nuevo', avatarId: 'guardian' } },
      { new: true, runValidators: true }
    );
  });

  test('rechaza la edición de un perfil que no pertenece a la familia', async () => {
    mockGuardian();

    const query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null)
    };

    ChildProfile.findOneAndUpdate.mockReturnValue(query);

    await expect(updateChildProfile('guardian-1', 'profile-otro', {
      nickname: 'Intento de acceso'
    })).rejects.toMatchObject({
      code: 'PROFILE_NOT_FOUND'
    });

    expect(ChildProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'profile-otro', familyId: 'family-1' },
      { $set: { nickname: 'Intento de acceso' } },
      { new: true, runValidators: true }
    );
  });
});
