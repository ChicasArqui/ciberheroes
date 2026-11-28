const Guardian = require('./guardian.model');
const Family = require('../profiles/family.model');
const ChildProfile = require('../profiles/child-profile.model');

async function ensureAuthIndexes() {
  await Promise.all([
    Guardian.createIndexes(),
    Family.createIndexes(),
    ChildProfile.createIndexes()
  ]);
}

module.exports = { ensureAuthIndexes };
