const express = require('express');
const path = require('node:path');
const { getDatabaseStatus } = require('./config/database');
const learningRoutes = require('./modules/learning/learning.routes');

const app = express();
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

app.use(express.json());
app.use('/api/lecciones', learningRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    server: 'running',
    commit: process.env.RENDER_GIT_COMMIT || 'local',
    database: getDatabaseStatus()
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta de API no encontrada' });
});

app.use(express.static(frontendDist));

module.exports = app;
