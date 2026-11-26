const {
  getGuardianFamilyCode
} = require('./family.service');

async function getGuardianFamilyController(req, res) {
  try {
    const familyCode = await getGuardianFamilyCode(
      req.session.guardianId
    );

    if (!familyCode) {
      return res.status(404).json({
        error: 'FAMILY_NOT_FOUND'
      });
    }

    return res.status(200).json({ familyCode });
  } catch {
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}

module.exports = { getGuardianFamilyController };