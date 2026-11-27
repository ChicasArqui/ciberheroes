jest.mock('../src/modules/profiles/family.service', () => ({
  getGuardianFamilyCode: jest.fn()
}));

const {
  getGuardianFamilyCode
} = require('../src/modules/profiles/family.service');
const request = require('supertest');
const baseApp = require('../src/app');

function fakeGuardianSession(req, res, next) {
  req.session = { guardianId: 'guardian-test-1' };
  next();
}

const app = baseApp.createApp({
  sessionMiddleware: fakeGuardianSession
});

describe('GET /api/guardian/family con sesión', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('devuelve el código de la familia del Guardián autenticado', async () => {
    getGuardianFamilyCode.mockResolvedValue('K8M4Q2AB');

    const response = await request(app).get('/api/guardian/family');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      familyCode: 'K8M4Q2AB'
    });
    expect(getGuardianFamilyCode).toHaveBeenCalledWith('guardian-test-1');
  });
});