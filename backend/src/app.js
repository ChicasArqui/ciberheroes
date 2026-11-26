const express = require('express');
const path = require('node:path');
const { getDatabaseStatus } = require('./config/database');
const learningRoutes = require('./modules/learning/learning.routes');
const authRoutes = require('./modules/auth/auth.routes');
const guardianRoutes = require('./modules/profiles/guardian.routes');

const frontendDist = path.resolve(__dirname, '../../frontend/dist');

function createApp({ sessionMiddleware } = {}) {
  const app = express();

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(express.json());

  if (sessionMiddleware) {
    app.use(sessionMiddleware);
  }

  app.use('/api/lecciones', learningRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/guardian', guardianRoutes);

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

  return app;
}

const app = createApp();
app.createApp = createApp;

module.exports = app;
