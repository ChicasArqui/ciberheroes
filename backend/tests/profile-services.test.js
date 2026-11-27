jest.mock('../src/modules/auth/guardian.model', () => ({
  findById: jest.fn()
}));

const Guardian = require('../src/modules/auth/guardian.model');
const { generateFamilyCode } = require('../src/modules/profiles/family-code.service');
const { getGuardianFamilyCode } = require('../src/modules/profiles/family.service');

describe('servicios de familia', () => {
  test('genera un código familiar de ocho caracteres permitidos', () => {
    const code = generateFamilyCode();

    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
  });

  test('devuelve el código familiar del Guardián', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue({
        familyId: { familyCode: 'AB12CD34' }
      })
    };
    Guardian.findById.mockReturnValue(query);

    await expect(getGuardianFamilyCode('guardian-1')).resolves.toBe('AB12CD34');

    expect(Guardian.findById).toHaveBeenCalledWith('guardian-1');
    expect(query.select).toHaveBeenCalledWith('familyId');
    expect(query.populate).toHaveBeenCalledWith('familyId', 'familyCode');
  });

  test('devuelve null si no encuentra al Guardián', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(null)
    };
    Guardian.findById.mockReturnValue(query);

    await expect(getGuardianFamilyCode('guardian-inexistente')).resolves.toBe(null);
  });

  test('devuelve null si el Guardián no tiene familia', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue({ familyId: null })
    };
    Guardian.findById.mockReturnValue(query);

    await expect(getGuardianFamilyCode('guardian-1')).resolves.toBe(null);
  });
});