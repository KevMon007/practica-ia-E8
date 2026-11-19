const test = require('node:test');
const assert = require('node:assert/strict');
const { chatCompletion } = require('../src/engines/generative/provider');

function mockProvider(t, fetchImpl, timeout = '100') {
  const oldKey = process.env.NVIDIA_API_KEY;
  const oldUrl = process.env.NVIDIA_BASE_URL;
  const oldTimeout = process.env.LLM_TIMEOUT_MS;
  const oldFetch = global.fetch;

  process.env.NVIDIA_API_KEY = 'test-key';
  process.env.NVIDIA_BASE_URL = 'https://example.test/v1';
  process.env.LLM_TIMEOUT_MS = timeout;
  global.fetch = fetchImpl;

  t.after(() => {
    if (oldKey === undefined) delete process.env.NVIDIA_API_KEY;
    else process.env.NVIDIA_API_KEY = oldKey;

    if (oldUrl === undefined) delete process.env.NVIDIA_BASE_URL;
    else process.env.NVIDIA_BASE_URL = oldUrl;

    if (oldTimeout === undefined) delete process.env.LLM_TIMEOUT_MS;
    else process.env.LLM_TIMEOUT_MS = oldTimeout;

    global.fetch = oldFetch;
  });
}

function response(status, content = 'Respuesta de prueba') {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({
      choices: [{ message: { content } }]
    })
  };
}

test('rechaza proveedor sin API key', async (t) => {
  const oldKey = process.env.NVIDIA_API_KEY;
  delete process.env.NVIDIA_API_KEY;

  t.after(() => {
    if (oldKey === undefined) delete process.env.NVIDIA_API_KEY;
    else process.env.NVIDIA_API_KEY = oldKey;
  });

  await assert.rejects(chatCompletion([]), {
    code: 'LLM_NOT_CONFIGURED',
    status: 503
  });
});

test('convierte HTTP 401 en error de autenticacion', async (t) => {
  mockProvider(t, async () => response(401));

  await assert.rejects(chatCompletion([]), {
    code: 'LLM_AUTH_ERROR',
    status: 502
  });
});

test('convierte HTTP 403 en error de autenticacion', async (t) => {
  mockProvider(t, async () => response(403));

  await assert.rejects(chatCompletion([]), {
    code: 'LLM_AUTH_ERROR',
    status: 502
  });
});

test('convierte HTTP 429 en error de limite', async (t) => {
  mockProvider(t, async () => response(429));

  await assert.rejects(chatCompletion([]), {
    code: 'LLM_RATE_LIMIT',
    status: 502
  });
});

test('convierte otros errores HTTP en error del proveedor', async (t) => {
  mockProvider(t, async () => response(500));

  await assert.rejects(chatCompletion([]), {
    code: 'LLM_PROVIDER_ERROR',
    status: 502
  });
});

test('rechaza contenido vacio del proveedor', async (t) => {
  mockProvider(t, async () => response(200, '   '));

  await assert.rejects(chatCompletion([]), {
    code: 'LLM_EMPTY_RESPONSE',
    status: 502
  });
});

test('convierte errores de red en error controlado', async (t) => {
  mockProvider(t, async () => {
    throw new TypeError('Network error simulado');
  });

  await assert.rejects(chatCompletion([]), {
    code: 'LLM_NETWORK_ERROR',
    status: 502
  });
});

test('convierte timeout en error 504', async (t) => {
  mockProvider(t, async (_url, options) => {
    return new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });
  }, '10');

  await assert.rejects(chatCompletion([]), {
    code: 'LLM_TIMEOUT',
    status: 504
  });
});

test('devuelve el contenido cuando el proveedor responde correctamente', async (t) => {
  let request;
  mockProvider(t, async (_url, options) => {
    request = options;
    return response(200, 'Contenido correcto');
  });

  const result = await chatCompletion([]);

  assert.equal(result, 'Contenido correcto');
  assert.equal(request.method, 'POST');
  assert.equal(request.headers['Content-Type'], 'application/json');
  assert.match(request.headers.Authorization, /^Bearer /);

  const body = JSON.parse(request.body);
  assert.ok(body.temperature >= 0 && body.temperature <= 0.5);
});

test('reintenta una respuesta vacía y conserva la respuesta real del segundo intento', async (t) => {
  let calls = 0;
  mockProvider(t, async () => response(200, ++calls === 1 ? '' : 'Respuesta del segundo intento'));
  assert.equal(await chatCompletion([]), 'Respuesta del segundo intento');
  assert.equal(calls, 2);
});

test('dos respuestas vacías detienen los reintentos y conservan el error controlado', async (t) => {
  let calls = 0;
  mockProvider(t, async () => { calls++; return response(200, ''); });
  await assert.rejects(chatCompletion([]), { code: 'LLM_EMPTY_RESPONSE', status: 502 });
  assert.equal(calls, 2);
});
