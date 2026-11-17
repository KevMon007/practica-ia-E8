const { EngineError } = require('../../contracts/responseContract');

async function chatCompletion(messages) {
  const apiKey = process.env.NVIDIA_API_KEY;
  const baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const model = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';

  if (!apiKey) {
    throw new EngineError('Proveedor de IA no configurado', 503, 'LLM_NOT_CONFIGURED');
  }

  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      Number(process.env.LLM_TIMEOUT_MS) || 20000
    );

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

      if (attempt === maxAttempts) {
        throw new EngineError(
          'Respuesta vacía del proveedor de IA',
          502,
          'LLM_EMPTY_RESPONSE'
        );
      }

      console.warn('NVIDIA devolvió contenido vacío. Reintentando una vez...');
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
