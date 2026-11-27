const Guardian = require('../auth/guardian.model');

async function getGuardianFamilyCode(guardianId) {
  const guardian = await Guardian.findById(guardianId)
    .select('familyId')
    .populate('familyId', 'familyCode');

  if (!guardian?.familyId) {
    return null;
  }

  return guardian.familyId.familyCode;
}

module.exports = { getGuardianFamilyCode };