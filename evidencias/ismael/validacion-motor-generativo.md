# Evidencia individual - Ismael
## AI Support Engine - Motor generativo NVIDIA

**Fecha:** 17/11/2026
**Rama:** feat/generative
**Responsabilidad:** Integración del motor generativo y validación del formato de salida del LLM.

### 1. Integración real con NVIDIA

Se implementó la conexión con NVIDIA API mediante el endpoint compatible con Chat Completions.

Modelo configurado por defecto:
`nvidia/nemotron-3.5-lightning-30b-a3b`

Se comprobó la generación de respuestas reales para:

| Caso | Categoría obtenida | Resultado |
|---|---|---|
| Problema de inicio de sesión | ACCESS | Correcto |
| Aplicación se cierra al guardar | BUG | Correcto |
| Solicitud de modo oscuro | FEATURE | Correcto |
| Vulnerabilidad SQL injection | SECURITY | Correcto |
| Intento de manipulación del prompt | SECURITY | Correcto |

### 2. Manejo de timeout

En la primera prueba ACCESS se obtuvo un error 504 (`LLM_TIMEOUT`) con el límite de 20 segundos.

Se repitió la solicitud con un límite temporal de 45 segundos y se obtuvo una respuesta válida:

- Categoría: ACCESS
- Prioridad: MEDIUM
- Revisión humana: false
- Modo: generative

El límite temporal se restauró después de la prueba. No se modificó permanentemente la configuración.

### 3. Pruebas automatizadas

Se ejecutó `npm test`.

Resultado:
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

Las pruebas de errores del proveedor utilizan respuestas simuladas y no consumen solicitudes reales de NVIDIA.

### 4. Decisión técnica

Se utiliza un parser que valida la respuesta del modelo antes de devolverla al sistema. Si el formato no es válido, el motor solicita una corrección una vez. Si continúa siendo inválido, devuelve un error controlado.

Además, los reportes SECURITY se fuerzan a revisión humana y prioridad mínima HIGH mediante la regla del contrato.

### 5. Limitaciones

- Las pruebas simuladas no demuestran la disponibilidad permanente de NVIDIA.
- La prueba adversarial realizada es un caso concreto y no garantiza protección completa contra todos los ataques de prompt injection.
- La clasificación depende de la respuesta del modelo y debe mantenerse validada por el contrato.
- El primer timeout demuestra que el proveedor puede tardar más que el límite configurado.

### 6. Seguridad de credenciales

La API key se utiliza mediante variables de entorno. No debe incluirse en evidencias, commits ni repositorios.
