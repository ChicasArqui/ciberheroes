require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
  } catch (error) {
    console.error('MongoDB no disponible:', error.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CiberHeroes API en puerto ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
