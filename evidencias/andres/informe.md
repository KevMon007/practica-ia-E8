# Entrega de Andrés — motor tradicional

Fecha de trabajo: 12 de noviembre de 2026, America/Mexico_City. Rama: `feat/traditional`.

## Alcance y estado del repositorio

El repositorio estaba vacío al clonarlo. Esta entrega contiene únicamente los tres módulos de `src/engines/traditional/`, `tests/cases.json`, `tests/traditional.test.js` y las evidencias de Andrés. No se crearon archivos de Kevin ni de Ismael. No se utiliza la API de NVIDIA, ninguna otra API, un modelo generativo ni un archivo `.env`.

Durante el trabajo se publicó la Fase 0 en `main` (base `af352a8`). Se actualizó `feat/traditional` sobre esa base sin modificar `main`. La implementación final importa directamente `EngineError` y `enforceSecurityReview` del contrato real de Kevin. Las pruebas validan los cinco campos publicados y todas las salidas con su `validateResult`.

## Cómo funciona

1. Normaliza el mensaje a minúsculas, elimina acentos y compacta espacios.
2. Suma pesos por palabras y frases de cada categoría. Cada término suma una vez; repetirlo no multiplica su peso. Se respetan límites de palabras: `error` no coincide con `terror` y `500` no coincide con `15000`.
3. Escoge el mayor puntaje. En empate conserva este orden: SECURITY, ACCESS, BUG, FEATURE.
4. Aplica prioridad base, términos críticos, urgencia y atenuantes. Un crítico domina el resto y SECURITY nunca baja de HIGH. `No es urgente` no activa por accidente el término `urgente`.
5. Detecta instrucciones de manipulación y activa revisión humana. La categoría sigue siendo la ganadora del puntaje; no interpreta como órdenes los valores de categoría o prioridad incluidos en el mensaje. Un intento detectado tampoco puede utilizar atenuantes para bajar la prioridad.
6. Devuelve una respuesta fija con `mode: "traditional"`. SECURITY siempre requiere revisión humana. Un mensaje sin coincidencias devuelve BUG/LOW con revisión humana.

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
| Pruebas aprobadas | 54 |
| Pruebas fallidas | 0 |
| Pruebas omitidas | 0 |
| Peticiones HTTP a POST /api/analyze | 14/14 correctas, HTTP 200 |
| Entorno utilizado | Node.js v24.19.0; CommonJS, sin dependencias externas |

La puntuación mide solo esta referencia conocida, no la precisión en mensajes nuevos. No hay fallos de referencia que explicar en esta ejecución. Aún no existe `results/results.md` ni resultados comparativos del motor generativo; esa revisión corresponde a la integración posterior.

Reproducir desde la raíz del repositorio:

```sh
npm install --package-lock=false
npm test -- --test-reporter=tap
node -e "console.log(require('./tests/cases.json').length)"
node -e "require('./src/engines/traditional/traditionalEngine').analyze('No puedo iniciar sesión').then(console.log)"
```

La suite incluye casos adicionales fuera de la referencia, desempates, normalización, límites de palabras, repeticiones, prioridad crítica, piso de seguridad, detección adversarial, entradas inválidas y determinismo.

## Evidencias

- `pruebas.tap`: salida completa y real de `npm test` con el reportero TAP de `node:test`.
- `npm-test-resumen.txt`: comando, resumen extraído de esa salida y estado de la integración.
- `comparacion.json`: mensajes, referencia, resultados completos y aciertos por caso.
- `http-resultados.json`: las 14 solicitudes HTTP reales al servidor Express del equipo, ejecutado en un puerto local efímero, y sus respuestas.
- `http-*.txt`: cinco solicitudes HTTP reales con sus cuerpos, códigos 200 y respuestas, una por categoría más una adversarial.
- `captura-*.png`: seis capturas originales de la etapa inicial, mostrando en Bloc de notas la suite directa (53 aprobadas y una omitida antes de existir el contrato) y cinco llamadas directas. Se conservan como evidencia de esa etapa y no representan las pruebas HTTP ni la ejecución final de `npm test`.

Los registros finales muestran 54 pruebas aprobadas sin omisiones y 14 solicitudes HTTP correctas. No se lograron actualizar las capturas finales: el control de Windows informó `user input was detected in this window` y la ventana fue minimizada; el visor alternativo rechazó URLs locales por su política de seguridad. No se alteraron las capturas iniciales para simular resultados posteriores.

## Pendientes de integración del equipo

- Reemplazar las capturas iniciales por capturas de `npm test` y de las solicitudes HTTP finales cuando el escritorio esté disponible.
- Revisar el PR de Andrés antes de integrar las contribuciones de Ismael y Kevin, conforme al orden del equipo. No se ha realizado ningún merge.
- Cuando existan resultados del motor generativo, revisar los casos fallidos de la comparación y compartir conclusiones con Kevin e Ismael. No se han enviado mensajes a terceros.

## Explicación y conclusión propuesta

Es IA simbólica porque aplica conocimiento explícito escrito como reglas, pesos y decisiones deterministas, sin entrenar ni consultar un modelo. La referencia clasifica problemas de autenticación como ACCESS, fallos existentes como BUG, propuestas de funciones como FEATURE e incidentes de seguridad como SECURITY; los ambiguos se resuelven por intención y detalle disponible, y los adversariales por el incidente reportado en vez de la orden de manipulación.

El motor tradicional es reproducible, rápido y fácil de auditar, y conserva revisión humana y prioridad alta en los reportes clasificados como seguridad. Sus limitaciones son los sinónimos ausentes, errores ortográficos, negaciones, frases con varias intenciones y contexto que no aparece en el diccionario. El 100% observado en estos 14 casos debe contrastarse con mensajes nuevos y con el motor generativo antes de extraer conclusiones generales.
