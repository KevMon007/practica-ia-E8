'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { validateResult } = require('../src/contracts/responseContract');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise((resolve) => server.close(resolve)));

async function post(path, body, raw = false) {
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? body : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test('GET /health responde 200', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('JSON mal formado responde 400 INVALID_JSON', async () => {
  const { status, body } = await post('/api/analyze', '{"message": "hola", mode:', true);
  assert.equal(status, 400);
  assert.equal(body.error.code, 'INVALID_JSON');
});

test('cuerpo mayor a 10kb responde 413 PAYLOAD_TOO_LARGE', async () => {
  const { status, body } = await post('/api/analyze', { message: 'a'.repeat(11 * 1024), mode: 'traditional' });
  assert.equal(status, 413);
  assert.equal(body.error.code, 'PAYLOAD_TOO_LARGE');
});

for (const [label, payload] of [
  ['mensaje vacío', { message: '', mode: 'traditional' }],
  ['mensaje solo con espacios', { message: '   \n\t ', mode: 'traditional' }],
  ['mensaje ausente', { mode: 'traditional' }],
  ['mensaje numérico', { message: 123, mode: 'traditional' }],
  ['mensaje nulo', { message: null, mode: 'generative' }],
  ['mode inválido', { message: 'No puedo iniciar sesión', mode: 'magic' }],
  ['mode ausente', { message: 'No puedo iniciar sesión' }],
  ['cuerpo como arreglo', [{ message: 'hola', mode: 'traditional' }]],
]) {
  test(`${label} responde 400 VALIDATION_ERROR`, async () => {
    const { status, body } = await post('/api/analyze', payload);
    assert.equal(status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.equal(typeof body.error.message, 'string');
  });
}

test('petición válida en modo traditional responde 200 con contrato válido', async () => {
  const { status, body } = await post('/api/analyze', {
    message: 'No puedo iniciar sesión, me dice contraseña incorrecta',
    mode: 'traditional',
  });
  assert.equal(status, 200);
  assert.equal(validateResult(body).valid, true);
  assert.equal(body.mode, 'traditional');
  assert.equal(body.category, 'ACCESS');
});

test('ruta inexistente responde 404 NOT_FOUND', async () => {
  const { status, body } = await post('/api/nope', { message: 'x', mode: 'traditional' });
  assert.equal(status, 404);
  assert.equal(body.error.code, 'NOT_FOUND');
});
