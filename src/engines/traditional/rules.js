'use strict';

// Cada término suma su peso una sola vez, aunque se repita en el mensaje.
const KEYWORDS = {
  SECURITY: [
    ['vulnerabilidad', 3], ['inyeccion sql', 4], ['sql injection', 4], ['xss', 3],
    ['hackeo', 4], ['hackearon', 4], ['phishing', 3], ['malware', 4], ['ransomware', 5],
    ['filtracion', 4], ['datos expuestos', 4], ['acceso no autorizado', 4], ['sin permiso', 3],
    ['robo de', 3], ['texto plano', 3], ['brecha', 3], ['exploit', 4], ['suplantacion', 3],
    ['usando mi cuenta', 3], ['accedio a cuentas', 5], ['descargo sus datos', 4],
    ['robaron mi cuenta', 4], ['credenciales expuestas', 4], ['fuga de datos', 4]
  ],
  ACCESS: [
    ['iniciar sesion', 3], ['inicio de sesion', 3], ['login', 3], ['contrasena', 3],
    ['contrasenas', 3], ['password', 3], ['no puedo entrar', 3], ['no me deja entrar', 3],
    ['acceso', 2], ['bloqueada', 2], ['bloqueado', 2], ['credenciales', 2],
    ['usuario incorrecto', 3], ['recuperar cuenta', 3], ['2fa', 1], ['token expirado', 2],
    ['restablecer contrasena', 3], ['cuenta suspendida', 3], ['autenticacion fallida', 3]
  ],
  BUG: [
    ['error', 2], ['falla', 2], ['no funciona', 2], ['se cierra', 2], ['se traba', 2],
    ['caido', 3], ['caida', 3], ['excepcion', 2], ['500', 2], ['no carga', 2],
    ['pantalla en blanco', 3], ['cobra dos veces', 3], ['bug', 3], ['lento', 1],
    ['cobro duplicado', 3], ['se congela', 2], ['error al guardar', 3]
  ],
  FEATURE: [
    // La intención explícita de proponer una función supera una mención de "login".
    ['me gustaria', 4], ['seria util', 3], ['seria bueno', 3], ['podrian agregar', 3],
    ['agregar', 1], ['nueva funcion', 3], ['funcionalidad', 2], ['sugerencia', 2],
    ['propongo', 2], ['exportar', 1], ['mejora', 2], ['quisiera que', 4],
    ['modo oscuro', 2], ['solicito una funcion', 3]
  ]
};

const CATEGORY_ORDER = Object.freeze(['SECURITY', 'ACCESS', 'BUG', 'FEATURE']);
const PRIORITY_LEVELS = Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const PRIORITY_BASE = Object.freeze({ SECURITY: 'HIGH', ACCESS: 'MEDIUM', BUG: 'MEDIUM', FEATURE: 'LOW' });
const CRITICAL_TERMS = [
  'todos los usuarios', 'produccion', 'caido', 'caida total', 'datos expuestos', 'filtracion',
  'ransomware', 'datos personales', 'clientes afectados', 'texto plano', 'descargo sus datos'
];
const URGENT_TERMS = [
  'urgente', 'no puedo trabajar', 'bloqueado', 'bloqueada', 'clientes', 'pagos',
  'cobra', 'nomina', 'lo antes posible'
];
const SOFT_TERMS = ['cuando puedan', 'sugerencia', 'seria bueno', 'no es urgente', 'me gustaria'];
const INJECTION_PATTERNS = [
  /\bignora (todas )?(las )?instrucciones\b/,
  /\bolvida (las )?instrucciones\b/,
  /\bclasifica\b[^.!?\n]*\bcomo\b/,
  /\bprioridad\s+(baja|low)\b/,
  /\bsystem\s*:/,
  /\bresponde unicamente\b/,
  /\{\s*"category"/,
  /\bignore (all )?(previous )?instructions\b/
];

function normalize(text) {
  if (typeof text !== 'string') throw new TypeError('El mensaje debe ser una cadena de texto.');
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function containsTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Evita que "error" coincida con "terror" o "500" con "15000".
  return new RegExp(`(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`, 'u').test(text);
}

function scoreCategories(text) {
  const normalized = normalize(text);
  return Object.fromEntries(CATEGORY_ORDER.map(category => [
    category,
    KEYWORDS[category].reduce((score, [term, weight]) => score + (containsTerm(normalized, term) ? weight : 0), 0)
  ]));
}

function pickCategory(scores) {
  // Comparación estricta: conserva la primera categoría si hay empate.
  return CATEGORY_ORDER.reduce((winner, category) => scores[category] > scores[winner] ? category : winner);
}

function isVagueReport(text) {
  return /^no (funciona|carga)[.!?]*$/.test(normalize(text));
}

function computePriority(category, text) {
  if (!Object.hasOwn(PRIORITY_BASE, category)) throw new RangeError('Categoría desconocida.');
  const normalized = normalize(text);

  // Un incidente crítico nunca se rebaja por urgencia ni por frases atenuantes.
  if (category !== 'FEATURE' && CRITICAL_TERMS.some(term => containsTerm(normalized, term))) return 'CRITICAL';
  if (category === 'BUG' && isVagueReport(normalized)) return 'LOW';

  let level = PRIORITY_LEVELS.indexOf(PRIORITY_BASE[category]);
  const urgencyText = normalized.replace(/\bno es urgente\b/g, ' ');
  if (URGENT_TERMS.some(term => containsTerm(urgencyText, term))) level = Math.min(level + 1, 2);
  // Una orden de manipulación no puede usar atenuantes para bajar la prioridad.
  if (!detectInjection(normalized) && SOFT_TERMS.some(term => containsTerm(normalized, term))) level = Math.max(level - 1, 0);
  if (category === 'SECURITY') level = Math.max(level, 2);
  return PRIORITY_LEVELS[level];
}

function detectInjection(text) {
  const normalized = normalize(text);
  return INJECTION_PATTERNS.some(pattern => pattern.test(normalized));
}

module.exports = { normalize, scoreCategories, pickCategory, computePriority, detectInjection, isVagueReport };
