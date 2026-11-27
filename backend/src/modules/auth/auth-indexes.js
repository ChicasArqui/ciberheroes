const Guardian = require('./guardian.model');
const Family = require('../profiles/family.model');

async function ensureAuthIndexes() {
  // unique en el esquema declara el índice; esperar su creación lo hace efectivo
  // antes de aceptar registros, incluso si autoIndex está desactivado.
  await Promise.all([Guardian.createIndexes(), Family.createIndexes()]);
}

module.exports = { ensureAuthIndexes };
