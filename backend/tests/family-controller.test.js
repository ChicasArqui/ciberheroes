jest.mock('../src/modules/profiles/family.service', () => ({
  getGuardianFamilyCode: jest.fn()
}));

const {
  getGuardianFamilyCode
} = require('../src/modules/profiles/family.service');
const {
  getGuardianFamilyController
} = require('../src/modules/profiles/family.controller');

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

describe('getGuardianFamilyController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('responde 404 si el Guardián no tiene familia', async () => {
    getGuardianFamilyCode.mockResolvedValue(null);
    const req = { session: { guardianId: 'guardian-1' } };
    const res = createResponse();

    await getGuardianFamilyController(req, res);

    expect(getGuardianFamilyCode).toHaveBeenCalledWith('guardian-1');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'FAMILY_NOT_FOUND' });
  });

  test('responde 500 si falla la consulta del código familiar', async () => {
    getGuardianFamilyCode.mockRejectedValue(new Error('fallo de prueba'));
    const req = { session: { guardianId: 'guardian-1' } };
    const res = createResponse();

    await getGuardianFamilyController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'INTERNAL_SERVER_ERROR'
    });
  });
});