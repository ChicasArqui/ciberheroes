const express = require('express');
const { getDatabaseStatus } = require('./config/database');

const app = express();

app.use(express.json());

const learningRoutes = require('./modules/learning/learning.routes');

app.use('/api/lecciones', learningRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API CiberHeroes funcionando'
  });
});


app.get('/health', (req, res) => {
  const database = getDatabaseStatus();

  res.status(200).json({
    status: 'healthy',
    server: 'running',
    database
  });
});


module.exports = app;