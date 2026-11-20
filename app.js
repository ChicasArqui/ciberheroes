module.exports = require('./backend/src/app');

if (require.main === module) {
  require('./backend/src/server').startServer();
}
