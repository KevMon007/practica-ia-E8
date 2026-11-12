const express = require('express');
const analyzeRoutes = require('./routes/analyze.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', analyzeRoutes);
app.use((req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' },
  });
});
app.use(errorHandler);

module.exports = app;
