const { MODES } = require('../contracts/responseContract');

function validationError(res, message) {
  return res.status(400).json({
    error: { code: 'VALIDATION_ERROR', message },
  });
}

module.exports = function validateRequest(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return validationError(res, 'El cuerpo debe ser un objeto JSON con "message" y "mode"');
  }

  const { message, mode } = body;

  if (typeof message !== 'string') {
    return validationError(res, '"message" es obligatorio y debe ser texto');
  }

  if (message.trim().length === 0) {
    return validationError(res, '"message" no puede estar vacío');
  }

  if (!MODES.includes(mode)) {
    return validationError(res, `"mode" debe ser uno de: ${MODES.join(', ')}`);
  }

  next();
};
