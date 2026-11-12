const { MODES } = require('../contracts/responseContract');

module.exports = function validateRequest(req, res, next) {
  const { message, mode } = req.body || {};

  if (typeof message !== 'string' || !MODES.includes(mode)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Se requieren "message" y un "mode" válido',
      },
    });
  }

  next();
};
