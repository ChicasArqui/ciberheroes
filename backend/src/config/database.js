
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI no está configurada');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
  });

  console.log('MongoDB conectado correctamente');
}

function getDatabaseStatus() {
  return mongoose.connection.readyState === 1
    ? 'connected'
    : 'disconnected';
}

module.exports = {
  connectDB,
  getDatabaseStatus
};
