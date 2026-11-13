'use strict';

const rules = require('./rules');
const { RESPONSES, CRITICAL_SUFFIX } = require('./responses');
const { EngineError, enforceSecurityReview } = require('../../contracts/responseContract');

async function analyze(message) {
  if (typeof message !== 'string') {
    throw new EngineError('El mensaje debe ser una cadena de texto.', 400, 'INVALID_MESSAGE');
  }

  const text = rules.normalize(message);
  const scores = rules.scoreCategories(text);
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const category = totalScore === 0 ? 'BUG' : rules.pickCategory(scores);
  const priority = totalScore === 0 ? 'LOW' : rules.computePriority(category, text);
  const ambiguous = totalScore === 0 || (category === 'BUG' && rules.isVagueReport(text));

  const result = {
    category,
    priority,
    response: RESPONSES[category] + (priority === 'CRITICAL' ? CRITICAL_SUFFIX : ''),
    requiresHumanReview: category === 'SECURITY' || ambiguous || rules.detectInjection(text),
    mode: 'traditional'
  };

  return enforceSecurityReview(result);
}

module.exports = { analyze };
