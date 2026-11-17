module.exports = function errorHandler(err, req, res, next) {
  // Errores producidos por express.json() antes de llegar a la ruta.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'El cuerpo de la petición no es un JSON válido' },
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'El cuerpo de la petición excede el límite de 10kb' },
    });
  }

  if (err.name === 'EngineError') {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }

  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Error interno' },
  });
};
