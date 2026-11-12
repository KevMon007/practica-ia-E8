const CATEGORIES = ['ACCESS', 'BUG', 'FEATURE', 'SECURITY'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const MODES = ['traditional', 'generative'];

class EngineError extends Error {
  constructor(message, status = 500, code = 'ENGINE_ERROR') {
    super(message);
    this.name = 'EngineError';
    this.status = status;
    this.code = code;
  }
}

function validateResult(obj) {
  const errors = [];

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { valid: false, errors: ['El resultado no es un objeto'] };
  }

  if (!CATEGORIES.includes(obj.category)) errors.push('category inválida');
  if (!PRIORITIES.includes(obj.priority)) errors.push('priority inválida');
  if (typeof obj.response !== 'string' || obj.response.trim().length < 10) {
    errors.push('response inválida');
  }
  if (typeof obj.requiresHumanReview !== 'boolean') {
    errors.push('requiresHumanReview debe ser boolean');
  }
  if (!MODES.includes(obj.mode)) errors.push('mode inválido');

  return { valid: errors.length === 0, errors };
}

// Regla de seguridad global: SECURITY implica revisión humana y prioridad mínima HIGH.
function enforceSecurityReview(result) {
  if (result && result.category === 'SECURITY') {
    result.requiresHumanReview = true;
    if (PRIORITIES.indexOf(result.priority) < PRIORITIES.indexOf('HIGH')) {
      result.priority = 'HIGH';
    }
  }

  return result;
}

module.exports = {
  CATEGORIES,
  PRIORITIES,
  MODES,
  EngineError,
  validateResult,
  enforceSecurityReview,
};
