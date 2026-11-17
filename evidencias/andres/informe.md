# Entrega de Andrés — motor tradicional

Actualización: 17 de noviembre de 2026, America/Mexico_City. Rama: `feat/traditional`.

## Alcance y estado del repositorio

El repositorio estaba vacío al clonarlo. Esta entrega contiene únicamente los tres módulos de `src/engines/traditional/`, `tests/cases.json`, `tests/traditional.test.js` y las evidencias de Andrés. No se crearon archivos de Kevin ni de Ismael. No se utiliza la API de NVIDIA, ninguna otra API, un modelo generativo ni un archivo `.env`.

Durante el trabajo se publicó la Fase 0 en `main` (base `af352a8`). Se actualizó `feat/traditional` sobre esa base sin modificar `main`. La implementación final importa directamente `EngineError` y `enforceSecurityReview` del contrato real de Kevin. Las pruebas validan los cinco campos publicados y todas las salidas con su `validateResult`.

## Cómo funciona

1. Normaliza el mensaje a minúsculas, elimina acentos y compacta espacios.
2. Suma pesos por palabras y frases de cada categoría. Cada término suma una vez; repetirlo no multiplica su peso. Se respetan límites de palabras: `error` no coincide con `terror` y `500` no coincide con `15000`.
3. Escoge el mayor puntaje. En empate conserva este orden: SECURITY, ACCESS, BUG, FEATURE.
4. Si hay coincidencias en el diccionario de seguridad, calcula la prioridad con la política SECURITY, aunque gane otra categoría: mínimo HIGH y CRITICAL ante términos críticos. Sin esas señales, aplica prioridad base, términos críticos, urgencia y atenuantes de la categoría ganadora. `No es urgente` no activa por accidente el término `urgente`.
5. Detecta instrucciones de manipulación y activa revisión humana. La categoría sigue siendo la ganadora del puntaje; no interpreta como órdenes los valores de categoría o prioridad incluidos en el mensaje. Un intento detectado tampoco puede utilizar atenuantes para bajar la prioridad.
6. Devuelve una respuesta fija con `mode: "traditional"`. Cualquier señal del diccionario de seguridad activa revisión humana. Si gana otra categoría, añade a su respuesta el aviso de revisión por el equipo de seguridad. Un mensaje sin coincidencias devuelve BUG/LOW con revisión humana.

Los mensajes no textuales rechazan la promesa con un error llamado `EngineError`. Los mensajes vacíos se tratan como ambiguos.

## Decisiones frente a las contradicciones del ejemplo

- La referencia establece BUG/LOW para «No funciona», aunque la palabra clave propuesta tendría BUG/MEDIUM. Se agregó una regla explícita para reportes mínimos «No funciona» y «No carga», sin detalles: LOW y revisión humana.
- «Me gustaría que el login tuviera autenticación de dos factores» empataría con ACCESS en el ejemplo. Se asignó peso 4 a la intención «me gustaría», manteniendo el desempate global solicitado. Esto expresa una propuesta de función, no un problema al iniciar sesión.
- El caso de acceso a cuentas ajenas necesitaba vocabulario adicional. Se agregaron «accedió a cuentas» y «descargó sus datos», además de variantes útiles.
- Los ejemplos de atenuantes podrían rebajar SECURITY y los modificadores posteriores podrían rebajar CRITICAL. Se impusieron ambos límites para cumplir el checklist de seguridad.
- Las respuestas no afirman haber creado un ticket ni enviado una notificación: este módulo clasifica y responde; el servidor debe efectuar esas acciones.

## Referencia fija y resultados

Se conservaron los 14 mensajes y sus clasificaciones originales, antes de ejecutar pruebas: 8 normales, 3 ambiguos y 3 adversariales. No se cambiaron los resultados esperados para mejorar la medición.

SHA-256 de `tests/cases.json` en esta entrega: `C6AACBBD0EEA9B6A8B8B599BC9C0AD3A958B80A86C16F5E804E55AB3B18F85EB`.

| Medida | Resultado |
| --- | --- |
| Aciertos de categoría | 14/14, 100% |
| Aciertos de prioridad | 14/14, 100% |
| Casos adversariales con revisión humana | 3/3 |
| Pruebas aprobadas | 62 |
| Pruebas fallidas | 0 |
| Pruebas omitidas | 0 |
| Peticiones HTTP a POST /api/analyze | 14/14 correctas, HTTP 200 |
| Regresiones adicionales de seguridad por HTTP | 7/7 correctas, HTTP 200 |
| Entorno utilizado | Node.js v24.19.0; CommonJS, sin dependencias externas |

La puntuación mide solo esta referencia conocida, no la precisión en mensajes nuevos. No hay fallos de referencia en esta ejecución. Las pruebas adicionales de seguridad detectaron un fallo fuera de la referencia; la corrección y sus límites se describen más abajo. La comparación con el motor generativo corresponde a la integración posterior.

Reproducir desde la raíz del repositorio:

```sh
npm install --package-lock=false
npm test -- --test-reporter=tap
node -e "console.log(require('./tests/cases.json').length)"
node -e "require('./src/engines/traditional/traditionalEngine').analyze('No puedo iniciar sesión').then(console.log)"
node evidencias/andres/validar.cjs
```

La suite incluye casos adicionales fuera de la referencia, desempates, normalización, límites de palabras, repeticiones, prioridad crítica, piso de seguridad, detección adversarial, entradas inválidas y determinismo. El último comando regenera las evidencias de pruebas y las 21 solicitudes HTTP locales. Las capturas deben actualizarse si se vuelve a ejecutar la validación y cambian los datos mostrados.

## Corrección de seguridad del 17 de noviembre

El mensaje «Hay una vulnerabilidad XSS en el login: no puedo iniciar sesión con mi contraseña ni recuperar cuenta.» obtenía ACCESS/MEDIUM sin revisión humana. Los términos de acceso sumaban más puntos que los de seguridad y ocultaban el posible incidente.

Se conservó la categoría ganadora por puntaje, separando la decisión de seguridad. Ahora devuelve ACCESS/HIGH con `requiresHumanReview: true` y añade el aviso de seguridad a la respuesta. Una filtración o datos expuestos conservan CRITICAL aunque gane otra categoría. FEATURE sigue su prioridad normal cuando no hay señales de seguridad; con un posible incidente, la política de seguridad tiene precedencia.

Se añadieron ocho pruebas: siete regresiones de seguridad mezclada con ACCESS, BUG o FEATURE, incluyendo atenuantes, manipulación y términos críticos, y una comprobación de que la revisión no se propaga a mensajes posteriores normales. Las siete regresiones fallaban antes de cambiar el motor y pasan con la corrección; también se comprobaron mediante HTTP. `tests/cases.json` conserva su contenido y hash originales.

Esta política es conservadora: las coincidencias de seguridad pueden generar revisiones adicionales incluso en mensajes benignos. No interpreta negaciones ni garantiza detectar un incidente descrito con vocabulario ausente del diccionario.

## Evidencias

- `pruebas.tap`: salida completa y real de `npm test` con el reportero TAP de `node:test`.
- `npm-test-resumen.txt`: comando, resumen extraído de esa salida y estado de la integración.
- `comparacion.json`: mensajes, referencia, resultados completos y aciertos por caso.
- `http-resultados.json`: las 14 solicitudes HTTP reales al servidor Express del equipo, ejecutado en un puerto local efímero, y sus respuestas.
- `http-regresiones-seguridad.json`: siete solicitudes HTTP adicionales con señales de seguridad y sus resultados esperados.
- `http-*.txt`: seis solicitudes HTTP reales con sus cuerpos, códigos 200 y respuestas, una por categoría más una adversarial y una de seguridad mezclada con acceso.
- `captura-*.png`: siete capturas originales finales, sin editar imágenes, mostrando esos registros en Bloc de notas: 62 pruebas aprobadas, las cuatro categorías, un caso adversarial y la corrección de seguridad. Son capturas del visor de resultados de ejecuciones reales; la salida completa está en los archivos TAP y JSON.
- `validar.cjs`: genera las pruebas y evidencias HTTP de forma reproducible, sin APIs externas.
- `aporte-conclusion.md`: tres frases preparadas para la conclusión técnica del equipo.

Los registros y capturas finales corresponden al 17 de noviembre de 2026: 62 pruebas aprobadas sin omisiones, 14 solicitudes HTTP de referencia y siete regresiones de seguridad correctas.

## Pendientes de integración del equipo

- Revisar el PR #1 de Andrés antes de integrar las contribuciones de Ismael y Kevin, conforme al orden del equipo. No se ha realizado ningún merge.
- Cuando existan resultados del motor generativo, revisar los casos fallidos de la comparación y compartir conclusiones con Kevin e Ismael. No se han enviado mensajes a terceros.

## Explicación y conclusión propuesta

Es IA simbólica porque aplica conocimiento explícito escrito como reglas, pesos y decisiones deterministas, sin entrenar ni consultar un modelo. La referencia clasifica problemas de autenticación como ACCESS, fallos existentes como BUG, propuestas de funciones como FEATURE e incidentes de seguridad como SECURITY; los ambiguos se resuelven por intención y detalle disponible, y los adversariales por el incidente reportado en vez de la orden de manipulación.

El motor tradicional es reproducible, rápido y fácil de auditar, y conserva revisión humana y prioridad alta cuando reconoce señales del diccionario de seguridad, aunque otra categoría gane el puntaje. Sus limitaciones son los sinónimos ausentes, errores ortográficos, negaciones, frases con varias intenciones y contexto que no aparece en el diccionario. El 100% observado en estos 14 casos debe contrastarse con mensajes nuevos y con el motor generativo antes de extraer conclusiones generales.
