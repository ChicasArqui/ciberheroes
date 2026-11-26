const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
  } catch {
    console.error('MongoDB no disponible; revisa la configuracion del entorno.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CiberHeroes API en puerto ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
