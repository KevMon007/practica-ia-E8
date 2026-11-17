# Evidencia individual - Ismael
## AI Support Engine - Motor generativo NVIDIA

**Fecha:** 17/11/2026
**Rama:** feat/generative
**Responsabilidad:** Integración del motor generativo NVIDIA, validación del formato de salida y pruebas del proveedor.

### 1. Integración real con NVIDIA

Se implementó la conexión con NVIDIA API mediante el endpoint compatible con Chat Completions.

**Modelo configurado:**
`nvidia/nemotron-3.5-lightning-30b-a3b`

Se realizaron solicitudes reales al proveedor y se comprobaron respuestas de las categorías ACCESS, BUG, FEATURE y SECURITY.

### 2. Evaluación de 14 escenarios reales

Se ejecutó el script `scripts/run-generative-cases.js` con 14 solicitudes distintas.

**Resultado de la primera ronda:**

- Casos ejecutados: 14.
- Correctos completamente: 10.
- Incorrectos o con error: 4.
- Acierto completo: 71.43 %.
- Respuestas vacías: 2.
- Diferencias de prioridad: 2.

Los resultados se guardaron en `results/nvidia/requests/`, `results/nvidia/responses/` y `results/nvidia/summary.json`.

Los casos 01 y 03 devolvieron `LLM_EMPTY_RESPONSE`.
El caso 02 obtuvo ACCESS/MEDIUM cuando se esperaba ACCESS/HIGH.
El caso 09 obtuvo SECURITY/HIGH cuando se esperaba SECURITY/CRITICAL.

Las expectativas de categoría y prioridad fueron definidas como referencias para esta evaluación; no representan etiquetas oficiales proporcionadas por el docente.

### 3. Manejo de timeout

En una prueba inicial ACCESS se obtuvo un error 504 (`LLM_TIMEOUT`) con el límite de 20 segundos.

Se repitió la solicitud con un límite temporal de 45 segundos y se obtuvo una respuesta válida:

- Categoría: ACCESS.
- Prioridad: MEDIUM.
- Revisión humana: false.
- Modo: generative.

El límite temporal se configuró únicamente durante la prueba, sin modificar permanentemente la configuración del proyecto.

### 4. Mejora del proveedor: respuesta vacía

Después de detectar dos respuestas vacías, se modificó `src/engines/generative/provider.js`.

Se incorporó un máximo de dos intentos cuando NVIDIA devuelve contenido vacío. Si el segundo intento también está vacío, se conserva el error controlado `LLM_EMPTY_RESPONSE`.

No se agregaron reintentos ilimitados ni se modificaron los errores de autenticación, límite de solicitudes o conexión.

**Segunda ronda de validación:**

| Caso | Resultado |
|---|---|
| 01 - Inicio de sesión | ACCESS / MEDIUM |
| 03 - Recuperación de perfil | ACCESS / MEDIUM |

Ambos casos devolvieron respuestas válidas en la segunda ronda.

Esta prueba demuestra que los escenarios pudieron completarse después del cambio, aunque no permite afirmar que el reintento interno fue necesariamente el responsable en cada ejecución, porque no se registró el número de intento utilizado.

### 5. Pruebas automatizadas

Se ejecutó `npm test` después de modificar el proveedor.

**Resultado:**
- 17 pruebas ejecutadas.
- 17 aprobadas.
- 0 fallidas.

Las pruebas comprueban:

- Validación del JSON generado.
- Categorías y prioridades permitidas.
- Longitud y tipo de los campos.
- Rechazo de respuestas inválidas.
- Protección básica del delimitador de solicitud.
- Revisión humana obligatoria para SECURITY.
- Errores HTTP 401, 429 y 500.
- Ausencia de API key.
- Respuesta vacía.
- Error de red.
- Timeout.
- Respuesta correcta del proveedor.

Las pruebas automatizadas del proveedor utilizan respuestas simuladas y no consumen solicitudes reales de NVIDIA.

### 6. Decisiones técnicas

Se utiliza un parser que valida la respuesta del modelo antes de devolverla al sistema. Si el formato no es válido, el motor solicita una corrección una vez. Si continúa siendo inválido, devuelve un error controlado.

Además, los reportes SECURITY se fuerzan a revisión humana y prioridad mínima HIGH mediante la regla del contrato.

Se agregó un reintento limitado para respuestas vacías, con el objetivo de tolerar fallos transitorios del proveedor.

### 7. Limitaciones

- Las pruebas simuladas no demuestran la disponibilidad permanente de NVIDIA.
- La clasificación depende de la respuesta del modelo y debe mantenerse validada por el contrato.
- Dos escenarios presentaron diferencias entre la prioridad esperada y la generada.
- La primera ronda presentó dos respuestas vacías.
- La segunda ronda solamente volvió a probar los casos 01 y 03; no representa una repetición completa de los 14 escenarios.
- La prueba adversarial realizada es un caso concreto y no garantiza protección completa contra todos los ataques de prompt injection.
- El proveedor puede tardar más que el timeout configurado.

### 8. Seguridad de credenciales

La API key se utiliza mediante variables de entorno. No debe incluirse en evidencias, commits ni repositorios.

### 9. Archivos relacionados con mi contribución

- `src/engines/generative/provider.js`
- `src/engines/generative/prompt.js`
- `src/engines/generative/generativeEngine.js`
- `tests/generative-provider.test.js`
- `tests/generative.test.js`
- `scripts/run-generative-cases.js`
- `results/nvidia/`
- `evidencias/ismael/validacion-motor-generativo.md`

### Fortalezas y limitaciones del motor generativo

El motor generativo de NVIDIA logró interpretar correctamente las categorías de los casos que recibieron una respuesta válida, además de mantener la revisión humana en los incidentes de seguridad y resistir instrucciones de manipulación. Su principal fortaleza es que puede comprender solicitudes redactadas de diferentes maneras y clasificarlas con contexto.

Como limitaciones, presentó respuestas vacías en dos casos de la primera ejecución y algunas diferencias al determinar la prioridad. También depende de la disponibilidad del proveedor externo, la conexión y los tiempos de respuesta, por lo que sus resultados necesitan validación y supervisión humana.
