const express = require('express');
const path = require('node:path');
const { getDatabaseStatus } = require('./config/database');
const learningRoutes = require('./modules/learning/learning.routes');

const app = express();
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy': contentSecurityPolicy,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff'
  });
  next();
});

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

app.use((req, res) => {
  res.status(404).type('text/plain').send('Recurso no encontrado');
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const requestedStatus = err.status || err.statusCode;
  const status = Number.isInteger(requestedStatus) &&
    requestedStatus >= 400 && requestedStatus < 600 ? requestedStatus : 500;
  const message = status < 500 ? 'Solicitud no válida' : 'Error interno del servidor';

  if (/^\/api(?:\/|$)/i.test(req.path)) {
    return res.status(status).json({ error: message });
  }

  return res.status(status).type('text/plain').send(message);
});

module.exports = app;
