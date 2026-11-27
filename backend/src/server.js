const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { connectDB } = require('./config/database');
const { createSessionMiddleware } = require('./config/session');
const mongoose = require('mongoose');
const { createAuthRateLimiters } = require('./modules/auth/auth-rate-limit');

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectDB();

  const sessionMiddleware = createSessionMiddleware();
  const authRateLimiters = createAuthRateLimiters({
    storeClient: mongoose.connection.getClient(),
    dbName: mongoose.connection.name,
    secret: process.env.SESSION_SECRET
  });
  await authRateLimiters.ready;

  const serverApp = app.createApp({
    sessionMiddleware, authRateLimiters
  });

  serverApp.listen(PORT, '0.0.0.0', () => {
    console.log(`CiberHeroes API en puerto ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch(() => {
    console.error('No se pudo iniciar: revisa la configuración de MongoDB y la sesión.');
    process.exitCode = 1;
  });
}

module.exports = { startServer };
