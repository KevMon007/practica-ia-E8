'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { performance } = require('node:perf_hooks');
const { validateResult, CATEGORIES, PRIORITIES } = require('../src/contracts/responseContract');
const root = path.resolve(__dirname, '..');

function validateCases(cases) {
  if (!Array.isArray(cases) || cases.length < 10) throw new Error('Se requieren al menos 10 casos de referencia.');
  const ids = new Set();
  for (const c of cases) {
    if (!Number.isInteger(c.id) || ids.has(c.id) || typeof c.message !== 'string' || !c.message.trim() || !CATEGORIES.includes(c.expected?.category) || !PRIORITIES.includes(c.expected?.priority)) throw new Error('Caso inválido o ID duplicado.');
    ids.add(c.id);
  }
  if (cases.filter(c => c.type === 'adversarial').length < 2 || !cases.some(c => c.type === 'ambiguo')) throw new Error('Faltan ambiguos o dos adversariales.');
}

function evaluate(c, mode, status, result, elapsedMs) {
  const formatValid = status === 200 && validateResult(result).valid && result.mode === mode;
  const categoryCorrect = formatValid && result.category === c.expected.category;
  const priorityCorrect = formatValid && result.priority === c.expected.priority;
  const reviewRequired = c.expected.category === 'SECURITY' || c.type === 'adversarial';
  const safetyValid = formatValid && (!reviewRequired || result.requiresHumanReview === true) && (result.category !== 'SECURITY' || (result.requiresHumanReview === true && ['HIGH', 'CRITICAL'].includes(result.priority)));
  return { mode, status, elapsedMs: Math.round(elapsedMs), result, formatValid, categoryCorrect, priorityCorrect, safetyValid, completeCorrect: categoryCorrect && priorityCorrect && safetyValid };
}

function summarize(rows, modes) {
  const percent = (n, d) => Number((100 * n / d).toFixed(2));
  return Object.fromEntries(modes.map(mode => {
    const runs = rows.map(row => row.runs[mode]);
    const count = field => runs.filter(run => run[field]).length;
    return [mode, { total: runs.length, validFormat: count('formatValid'), categoryCorrect: count('categoryCorrect'), priorityCorrect: count('priorityCorrect'), completeCorrect: count('completeCorrect'), errors: runs.filter(run => run.status !== 200).length, categoryAccuracyPercent: percent(count('categoryCorrect'), runs.length), priorityAccuracyPercent: percent(count('priorityCorrect'), runs.length), completeAccuracyPercent: percent(count('completeCorrect'), runs.length), meanElapsedMs: Math.round(runs.reduce((sum, run) => sum + run.elapsedMs, 0) / runs.length) }];
  }));
}

function conclusion(summary) {
  if (!summary.traditional || !summary.generative) return 'Evaluación individual del generativo sobre la referencia compartida. La comparación de ambos motores está en results/results.md.';
  const t = summary.traditional, g = summary.generative;
  const winner = t.completeCorrect === g.completeCorrect ? 'Ambos motores empataron en acierto completo' : `El motor ${t.completeCorrect > g.completeCorrect ? 'tradicional' : 'generativo'} obtuvo el mayor acierto completo`;
  return `${winner} en esta referencia de ${t.total} solicitudes: tradicional ${t.completeAccuracyPercent}% y generativo ${g.completeAccuracyPercent}%. El acierto de categoría fue ${t.categoryAccuracyPercent}% y ${g.categoryAccuracyPercent}%, respectivamente; se registraron ${t.errors} y ${g.errors} errores de ejecución. El tradicional ofrece resultados deterministas sin proveedor externo, pero depende del vocabulario y maneja de forma limitada el contexto y las negaciones. El generativo produce respuestas contextualizadas y depende de la latencia, disponibilidad y criterio del modelo. Los porcentajes incluyen todos los intentos, incluso errores del proveedor. Este conjunto conocido no demuestra superioridad general; deben ampliarse los casos y conservar revisión humana ante posibles incidentes.`;
}

const md = value => String(value ?? '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
function renderReport(report) {
  const lines = ['# Resultados comparativos — AI Support Engine', '', `Ejecución: ${report.executedAt}. Referencia: tests/cases.json (${report.cases.length} mensajes idénticos por motor).`, `SHA-256 de la referencia: \`${report.referenceSha256}\`.`, `Proveedor: NVIDIA. Modelo: \`${report.configuration.model}\`. Timeout por llamada: ${report.configuration.timeoutMs} ms.`, '', '## Porcentajes', '', '| Motor | Casos | Categoría correcta | Prioridad correcta | Formato válido | Acierto completo | Errores | Tiempo medio (ms) |', '| --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const [mode, s] of Object.entries(report.summary)) lines.push(`| ${mode} | ${s.total} | ${s.categoryCorrect}/${s.total} (${s.categoryAccuracyPercent}%) | ${s.priorityCorrect}/${s.total} (${s.priorityAccuracyPercent}%) | ${s.validFormat}/${s.total} | ${s.completeCorrect}/${s.total} (${s.completeAccuracyPercent}%) | ${s.errors} | ${s.meanElapsedMs} |`);
  lines.push('', 'Acierto completo exige categoría y prioridad de referencia, formato válido y revisión humana cuando corresponde. El denominador incluye todos los casos y los errores del proveedor. Las expectativas se fijaron antes de ejecutar y no se modificaron.', '', '## Resultados por caso', '', '| ID | Tipo | Motor | Referencia | Obtenido | Formato | Cat. correcta | Prior. correcta | Revisión humana | HTTP |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const c of report.cases) for (const [mode, r] of Object.entries(c.runs)) lines.push(`| ${c.id} | ${md(c.type)} | ${mode} | ${c.expected.category}/${c.expected.priority} | ${md(r.result.category || r.result.error?.code || 'ERROR')}/${md(r.result.priority || '-')} | ${r.formatValid ? 'Sí' : 'No'} | ${r.categoryCorrect ? 'Sí' : 'No'} | ${r.priorityCorrect ? 'Sí' : 'No'} | ${r.result.requiresHumanReview ?? '-'} | ${r.status} |`);
  lines.push('', '## Diferencias y limitaciones observadas', '');
  const differences = report.cases.flatMap(c => Object.values(c.runs).filter(r => !r.completeCorrect).map(r => `- Caso ${c.id}, ${r.mode}: referencia ${c.expected.category}/${c.expected.priority}; obtenido ${r.result.category || r.result.error?.code || 'ERROR'}/${r.result.priority || '-'}. ${!r.formatValid ? 'No se obtuvo una respuesta válida.' : !r.categoryCorrect ? 'La categoría difiere de la referencia.' : !r.priorityCorrect ? 'La valoración de prioridad difiere de la referencia.' : 'La revisión humana no cumple la política.'}`));
  lines.push(...(differences.length ? differences : ['Todos los criterios se cumplieron en esta ejecución de la referencia conocida.']), '', 'Los mensajes, respuestas, códigos HTTP, tiempos y verificaciones están en [comparison.json](comparison.json). La tabla exportable está en [results.csv](results.csv) y las solicitudes en [requests.json](requests.json). Los tiempos incluyen HTTP local y reintentos del proveedor.', '', '## Conclusión técnica (máximo 150 palabras)', '', report.conclusion, '', '## Reproducir', '', 'Desde la raíz: configurar .env con NVIDIA_API_KEY, NVIDIA_MODEL y LLM_TIMEOUT_MS, instalar con npm ci y ejecutar npm run compare. El comparador levanta Express en un puerto local efímero y lo cierra al finalizar. Usa respuestas reales de NVIDIA, no mocks.', '');
  return lines.join('\n');
}

function renderCsv(report) {
  const cell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = [['id', 'type', 'mode', 'message', 'expected_category', 'expected_priority', 'category', 'priority', 'format_valid', 'category_correct', 'priority_correct', 'requires_human_review', 'complete_correct', 'http_status', 'elapsed_ms', 'error_code']];
  for (const c of report.cases) for (const [mode, r] of Object.entries(c.runs)) rows.push([c.id, c.type, mode, c.message, c.expected.category, c.expected.priority, r.result.category, r.result.priority, r.formatValid, r.categoryCorrect, r.priorityCorrect, r.result.requiresHumanReview, r.completeCorrect, r.status, r.elapsedMs, r.result.error?.code]);
  return rows.map(row => row.map(cell).join(',')).join('\n') + '\n';
}

async function main(options = {}) {
  require('dotenv').config({ path: path.join(root, '.env') });
  const modes = options.modes || ['traditional', 'generative'];
  if (modes.some(mode => !['traditional', 'generative'].includes(mode))) throw new Error('Modo de comparación inválido.');
  if (modes.includes('generative') && (!process.env.NVIDIA_API_KEY || /TU_API|YOUR_KEY|REEMPLAZA/i.test(process.env.NVIDIA_API_KEY))) throw new Error('Configura una NVIDIA_API_KEY válida para la comparación real.');
  const casesPath = path.join(root, 'tests/cases.json');
  const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
  validateCases(cases);
  const output = options.outputDir || path.join(root, 'results');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'requests.json'), JSON.stringify(cases.flatMap(c => modes.map(mode => ({ id: c.id, method: 'POST', path: '/api/analyze', body: { message: c.message, mode } }))), null, 2) + '\n');
  const report = { executedAt: new Date().toISOString(), referenceSha256: createHash('sha256').update(fs.readFileSync(casesPath)).digest('hex'), configuration: { provider: 'NVIDIA', model: process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b', timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 20000, temperature: 0.2, topP: 0.7, maxTokens: 2048 }, cases: [] };
  const server = require('../src/app').listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const endpoint = `http://127.0.0.1:${server.address().port}/api/analyze`;
  try {
    for (const c of cases) {
      const row = { ...c, runs: {} };
      for (const mode of modes) {
        const start = performance.now();
        let status, result;
        try {
          const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: c.message, mode }), signal: AbortSignal.timeout(210000) });
          status = res.status; result = await res.json();
        } catch { status = 0; result = { error: { code: 'COMPARISON_TRANSPORT_ERROR', message: 'No se completó la petición HTTP local.' } }; }
        row.runs[mode] = evaluate(c, mode, status, result, performance.now() - start);
        console.log(`[${c.id}/${cases.length}] ${mode}: HTTP ${status} ${result.category || result.error?.code}/${result.priority || '-'} (${row.runs[mode].elapsedMs} ms)`);
        if (['LLM_NOT_CONFIGURED', 'LLM_AUTH_ERROR'].includes(result.error?.code) || /estado 404\b/.test(result.error?.message || '')) throw new Error('El proveedor rechazó la configuración. Revisa la clave y el modelo; no se generó una comparación final incompleta.');
      }
      report.cases.push(row);
      fs.writeFileSync(path.join(output, 'comparison.partial.json'), JSON.stringify(report, null, 2) + '\n');
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
  report.summary = summarize(report.cases, modes);
  report.conclusion = conclusion(report.summary);
  if (report.conclusion.split(/\s+/).length > 150) throw new Error('La conclusión supera 150 palabras.');
  fs.writeFileSync(path.join(output, 'comparison.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'results.csv'), renderCsv(report));
  fs.writeFileSync(path.join(output, 'results.md'), renderReport(report));
  fs.unlinkSync(path.join(output, 'comparison.partial.json'));
  console.log(JSON.stringify(report.summary, null, 2));
  return report;
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { main, evaluate, summarize, conclusion, validateCases, renderReport, renderCsv };
