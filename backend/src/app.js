const express = require('express');
const path = require('node:path');
const { getDatabaseStatus } = require('./config/database');
const learningRoutes = require('./modules/learning/learning.routes');
const authRoutes = require('./modules/auth/auth.routes');
const { createAuthRateLimiters } = require('./modules/auth/auth-rate-limit');
const guardianRoutes = require('./modules/profiles/guardian.routes');

const frontendDist = path.resolve(__dirname, '../../frontend/dist');

function createApp({ sessionMiddleware, authRateLimiters = createAuthRateLimiters() } = {}) {
  const app = express();

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(express.json());

  if (sessionMiddleware) {
    app.use(sessionMiddleware);
  }

  app.use('/api/lecciones', learningRoutes);
  app.use('/api/auth', authRoutes(authRateLimiters));
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

  // Los errores del parser pueden incluir fragmentos de credenciales.
  // Responder aquí evita que Express los imprima en sus logs por defecto.
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'INVALID_INPUT' });
    }

    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'PAYLOAD_TOO_LARGE' });
    }

    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  });

  return app;
}

const app = createApp();
app.createApp = createApp;

module.exports = app;
