const { spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const path = require('node:path');

// Base exclusiva para pruebas. La configuración del backend y Atlas no se usan.
const result = spawnSync(process.execPath, [
  require.resolve('jest/bin/jest'),
  '--coverage', '--ci', '--runInBand'
], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'test',
    RUN_MONGO_INTEGRATION: '1',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/ciberheroes_ci?replicaSet=rs0&directConnection=true',
    SESSION_SECRET: randomBytes(32).toString('hex')
  }
});

if (result.error) {
  console.error('No se pudo iniciar Jest:', result.error.message);
}
process.exitCode = result.status ?? 1;
