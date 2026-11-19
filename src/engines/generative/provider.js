const { EngineError } = require('../../contracts/responseContract');

const DEFAULT_TIMEOUT_MS = 45000;
const MAX_ATTEMPTS = 2;

function timeoutMs() {
  const configured = Number(process.env.LLM_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
}

async function chatCompletion(messages) {
  const apiKey = process.env.NVIDIA_API_KEY;
  const baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const model = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';

  if (!apiKey) {
    throw new EngineError('Proveedor de IA no configurado', 503, 'LLM_NOT_CONFIGURED');
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs());

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          top_p: 0.7,
          max_tokens: 2048,
          stream: false
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const code = res.status === 401 || res.status === 403
          ? 'LLM_AUTH_ERROR'
          : res.status === 429
            ? 'LLM_RATE_LIMIT'
            : 'LLM_PROVIDER_ERROR';

        throw new EngineError(
          `El proveedor de IA respondió con estado ${res.status}`,
          502,
          code
        );
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;

      if (typeof content === 'string' && content.trim()) {
        return content;
      }

      if (attempt === MAX_ATTEMPTS) {
        throw new EngineError(
          'Respuesta vacía del proveedor de IA',
          502,
          'LLM_EMPTY_RESPONSE'
        );
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new EngineError(
          'Tiempo de espera agotado con el proveedor de IA',
          504,
          'LLM_TIMEOUT'
        );
      }

      if (err.name === 'EngineError') {
        throw err;
      }

      throw new EngineError(
        'No se pudo contactar al proveedor de IA',
        502,
        'LLM_NETWORK_ERROR'
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = { chatCompletion };
