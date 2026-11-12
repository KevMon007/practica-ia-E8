module.exports = function errorHandler(err, req, res, next) {
  if (err.name === 'EngineError') {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }

  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Error interno' },
  });
};
