'use strict';

const RESPONSES = Object.freeze({
  ACCESS: 'Lamentamos el inconveniente con su acceso. Verifique sus credenciales y utilice la opción "Recuperar contraseña". Si su cuenta está bloqueada, solicite su restablecimiento al equipo de soporte.',
  BUG: 'Gracias por reportar la falla. Para que nuestro equipo técnico pueda revisarla, envíenos los pasos para reproducirla y capturas sin información sensible.',
  FEATURE: 'Gracias por su sugerencia de nueva funcionalidad. El equipo de producto podrá evaluar su utilidad y viabilidad.',
  SECURITY: 'Su reporte de seguridad requiere revisión humana inmediata por el equipo de seguridad. No comparta contraseñas, claves ni información sensible por este medio.'
});
const CRITICAL_SUFFIX = ' Este caso fue marcado como CRÍTICO y requiere atención con máxima prioridad.';

module.exports = { RESPONSES, CRITICAL_SUFFIX };
