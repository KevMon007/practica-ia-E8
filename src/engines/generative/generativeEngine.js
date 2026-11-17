const { chatCompletion } = require('./provider');
const { buildMessages, parseModelOutput } = require('./prompt');
const { EngineError, enforceSecurityReview } = require('../../contracts/responseContract');

async function analyze(message) {
  const messages = buildMessages(message);
  let raw = await chatCompletion(messages);
  let parsed = parseModelOutput(raw);

  if (!parsed.ok) {
    messages.push({ role: 'assistant', content: raw });
    messages.push({ role: 'user', content: `Tu respuesta no cumplió el formato (${parsed.errors.join(', ')}). Responde SOLO con el objeto JSON válido indicado.` });
    raw = await chatCompletion(messages);
    parsed = parseModelOutput(raw);
  }
  if (!parsed.ok) {
    throw new EngineError('La IA generativa devolvió un formato inválido', 502, 'INVALID_LLM_FORMAT');
  }
  return enforceSecurityReview(parsed.result);
}

module.exports = { analyze };