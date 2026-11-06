const express = require('express');

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
  res.status(200).json({ status: 'healthy' });
});

module.exports = app;