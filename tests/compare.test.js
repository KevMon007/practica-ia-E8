'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate, summarize, conclusion, validateCases, renderCsv } = require('../scripts/compare');
const cases = require('./cases.json');
const valid = { category: 'ACCESS', priority: 'MEDIUM', response: 'Verifique su acceso con soporte.', requiresHumanReview: false, mode: 'traditional' };

test('la referencia común satisface mínimos y rechaza IDs duplicados', () => {
  assert.doesNotThrow(() => validateCases(cases));
  assert.throws(() => validateCases([...cases, cases[0]]), /duplicado/);
  assert.throws(() => validateCases(cases.slice(0, 3)), /10 casos/);
});
test('los errores del proveedor permanecen en el denominador', () => {
  const rows = [
    { runs: { traditional: evaluate(cases[0], 'traditional', 200, valid, 10) } },
    { runs: { traditional: evaluate(cases[0], 'traditional', 502, { error: { code: 'LLM_EMPTY_RESPONSE' } }, 20) } }
  ];
  const s = summarize(rows, ['traditional']).traditional;
  assert.equal(s.total, 2); assert.equal(s.errors, 1);
  assert.equal(s.categoryAccuracyPercent, 50); assert.equal(s.completeAccuracyPercent, 50);
});
test('prioridad equivocada no cuenta como acierto completo aunque la categoría coincida', () => {
  const r = evaluate(cases[0], 'traditional', 200, { ...valid, priority: 'HIGH' }, 1);
  assert.equal(r.categoryCorrect, true); assert.equal(r.priorityCorrect, false); assert.equal(r.completeCorrect, false);
});
test('formato inválido y modo distinto no cuentan como clasificaciones válidas', () => {
  assert.equal(evaluate(cases[0], 'traditional', 200, { ...valid, mode: 'generative' }, 1).formatValid, false);
  assert.equal(evaluate(cases[0], 'traditional', 200, { ...valid, requiresHumanReview: 'false' }, 1).completeCorrect, false);
});
test('los adversariales y SECURITY requieren revisión humana para el acierto completo', () => {
  const attack = { ...cases[0], type: 'adversarial' };
  assert.equal(evaluate(attack, 'traditional', 200, valid, 1).completeCorrect, false);
  const security = { ...cases[0], expected: { category: 'SECURITY', priority: 'HIGH' } };
  assert.equal(evaluate(security, 'traditional', 200, { ...valid, category: 'SECURITY', priority: 'HIGH' }, 1).safetyValid, false);
});
test('conclusión breve basada en resultados y CSV con comillas escapadas', () => {
  const s = { total: 14, completeCorrect: 14, completeAccuracyPercent: 100, categoryAccuracyPercent: 100, errors: 0 };
  const text = conclusion({ traditional: s, generative: { ...s, completeCorrect: 10, completeAccuracyPercent: 71.43 } });
  assert.ok(text.includes('tradicional')); assert.ok(text.split(/\s+/).length <= 150);
  const csv = renderCsv({ cases: [{ ...cases[0], message: 'Texto "con comillas", y coma', runs: { traditional: evaluate(cases[0], 'traditional', 200, valid, 1) } }] });
  assert.ok(csv.includes('"Texto ""con comillas"", y coma"'));
});
