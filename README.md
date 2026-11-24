**Repositorio:** [KevMon007/practica-ia-E8](https://github.com/KevMon007/practica-ia-E8)

| Integrante | Usuario de GitHub | Nombre en commits de Git |
| --- | --- | --- |
| Juan Andrés Medina Gonzalez | [@JAndres-MGonzalez](https://github.com/JAndres-MGonzalez) | `Juan Andrés Medina Gonzalez` |
| José Ismael Montalvo Lopez | [@Ismael2509](https://github.com/Ismael2509) | `Ismael-2509` |
| Kevin Armando Montalvo Marcial | [@KevMon007](https://github.com/KevMon007) | `KevMon007` |

# AI Support Engine

Prototipo de clasificación de solicitudes de soporte con Node.js y Express. Integra un motor tradicional de IA simbólica basada en reglas y un motor generativo que utiliza la API de NVIDIA. Ambos reciben el mismo mensaje y devuelven categoría, prioridad, respuesta y decisión de revisión humana mediante un contrato JSON compartido.

## Qué hizo cada integrante

**Juan Andrés Medina Gonzalez:** implementó la normalización, el puntaje ponderado, los desempates, las prioridades y respuestas del motor tradicional. Preparó los 14 casos de referencia, las pruebas y evidencias tradicionales y corrigió la revisión humana de mensajes con señales de seguridad mezcladas. En el cierre se completaron el comparador, la documentación y la verificación integrada.

**José Ismael Montalvo Lopez:** implementó la integración real con NVIDIA, el prompt, el parser JSON, el reintento de formato y de respuestas vacías, los errores del proveedor y sus pruebas. Preparó la evidencia individual de ejecuciones reales del modelo.

**Kevin Armando Montalvo Marcial:** creó la estructura del proyecto, Express, el servidor, las rutas, el contrato compartido y EngineError. Implementó las validaciones y el manejo de errores HTTP, incorporó sus pruebas y package-lock.json y realizó la primera integración del motor tradicional.

Las contribuciones conservan su historial en los PR [#1](https://github.com/KevMon007/practica-ia-E8/pull/1), [#2](https://github.com/KevMon007/practica-ia-E8/pull/2), [#3](https://github.com/KevMon007/practica-ia-E8/pull/3) y [#4](https://github.com/KevMon007/practica-ia-E8/pull/4). El cierre reúne esos cambios y la comparación final.

## Clasificador supervisado TF-IDF

El repositorio también incluye en `ml/` un clasificador entrenable basado en
TF-IDF y regresión logística. Este componente es aprendizaje automático
supervisado y no un LLM: aprende de un archivo `tickets.csv` con las columnas
`message` y `category`.

Instala sus dependencias y entrena el modelo:

```powershell
python -m pip install -r requirements-ml.txt
npm run ml:train -- --data data/tickets.csv --message "Alguien entró a mi cuenta sin autorización"
```

El entrenamiento imprime el reporte de clasificación y la matriz de confusión
en `report.confusion_matrix`. El arreglo `labels` indica el orden de las
categorías en `counts`, con las categorías reales en las filas y las predichas
en las columnas. El comando guarda el pipeline en
`models/ticket_classifier.joblib`. Para reutilizarlo sin volver a entrenar:

```powershell
npm run ml:predict -- --message "Alguien entró a mi cuenta sin autorización"
```

El CSV debe tener al menos dos ejemplos por categoría y suficientes filas para
que cada categoría aparezca tanto en entrenamiento como en prueba. Para practicar
se incluye un dataset didáctico en `data/tickets.xlsx` y su versión CSV en
`data/tickets.csv`: 200 mensajes etiquetados, 50 por clase (`ACCESS`, `BUG`,
`FEATURE` y `SECURITY`), con una división orientativa de 160 entrenamiento y
40 prueba. Son ejemplos sintéticos creados para la clase, no tickets reales ni
datos de producción; la hoja `guia` del Excel documenta la política de
etiquetado y las precauciones contra fugas de datos.

El módulo `ml/ticket_classifier.py` realiza su propia división estratificada
(`test_size=0.2`, `random_state=42`) y solo lee `message` y `category`, por lo
que ignora la columna `split` del CSV. Para entrenar con el dataset incluido:

```powershell
npm run ml:train -- --data data/tickets.csv --message "Alguien entró a mi cuenta sin autorización"
```

La predicción por CLI devuelve `prediction` y `score`, la probabilidad
estimada para esa categoría, redondeada a tres decimales. El clasificador
supervisado por ahora no se expone en
`POST /api/analyze`, cuyo contrato también exige prioridad, respuesta y revisión
humana. Los archivos `.joblib` solo deben cargarse cuando hayan sido creados por
el equipo; no se deben abrir modelos recibidos de fuentes no confiables.

## Instalación

Requisitos: Node.js 18 o superior y una clave válida de NVIDIA para el motor generativo. El motor tradicional y las pruebas automatizadas funcionan sin esa clave.

```powershell
git clone https://github.com/KevMon007/practica-ia-E8.git
cd practica-ia-E8
npm ci
Copy-Item .env.example .env
```

Editar `.env` y reemplazar `NVIDIA_API_KEY` por la clave personal. No publicar `.env` ni incluir claves en capturas o resultados.

| Variable | Configuración de la ejecución final |
| --- | --- |
| `PORT` | `3000` para el servidor normal |
| `NVIDIA_BASE_URL` | `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL` | `nvidia/nemotron-3.5-lightning-30b-a3b` |
| `LLM_TIMEOUT_MS` | `45000` por llamada al proveedor |
| `NVIDIA_API_KEY` | Secreto personal; no se incluye en el repositorio |

La comparación utilizó temperatura 0.2, top_p 0.7 y max_tokens 2048. El proveedor reintenta una respuesta vacía una vez; el motor solicita una corrección de formato una vez. La disponibilidad del modelo y la credencial deben ser válidas en la cuenta que ejecute el proyecto.

## Ejecutar la API

```powershell
npm start
```

Servidor por defecto: `http://localhost:3000`. Para desarrollo: `npm run dev`.

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/health'
```

Respuesta de salud: `{"status":"ok"}`.

### Analizar una solicitud

```powershell
$solicitud = @{
    message = 'No puedo iniciar sesión'
    mode = 'traditional'
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/api/analyze' `
    -Method Post `
    -ContentType 'application/json; charset=utf-8' `
    -Body $solicitud
```

Usar `mode = 'generative'` para llamar al modelo real de NVIDIA. El cuerpo y la ruta son iguales para ambos motores.

Contrato de respuesta (el texto de `response` depende del motor y del mensaje):

```json
{
  "category": "ACCESS",
  "priority": "MEDIUM",
  "response": "Lamentamos el inconveniente con su acceso. Verifique sus credenciales y utilice la recuperación de contraseña.",
  "requiresHumanReview": false,
  "mode": "traditional"
}
```

| Categoría | Significado |
| --- | --- |
| `ACCESS` | Problemas de inicio de sesión o acceso |
| `BUG` | Fallas del sistema |
| `FEATURE` | Nuevas funcionalidades |
| `SECURITY` | Vulnerabilidades o incidentes |

Prioridades: `LOW`, `MEDIUM`, `HIGH` y `CRITICAL`. Un resultado SECURITY siempre requiere revisión humana y prioridad mínima HIGH. El tradicional también activa esa protección ante señales del diccionario de seguridad aunque gane otra categoría.

## Pruebas y comparación reproducible

```powershell
npm test
npm run compare
```

`npm test` ejecuta pruebas locales y mocks para errores del proveedor. `npm run compare` requiere una clave real y realiza 28 peticiones HTTP: los mismos 14 mensajes en ambos modos. Levanta Express en un puerto local efímero y lo cierra al terminar; no necesita otro servidor abierto. Los reintentos pueden incrementar el número de llamadas a NVIDIA.

La referencia compartida es `tests/cases.json`: ocho normales, tres ambiguos y tres adversariales. Se fijó antes de la evaluación y se conserva sin cambios.

Resultado de las pruebas integradas: **100 aprobadas, 0 fallidas y 0 omitidas**. [Salida completa](evidencias/final/npm-test.tap). La auditoría de dependencias está en [npm-audit.json](evidencias/final/npm-audit.json).

### Resultados de la comparación real

Ejecución: 2026-11-17T22:09:49.765Z. Los errores de ejecución permanecen en el denominador.

| Motor | Categoría correcta | Prioridad correcta | Formato válido | Acierto completo | Errores |
| --- | --- | --- | --- | --- | --- |
| Tradicional | 14/14 (100%) | 14/14 (100%) | 14/14 | 14/14 (100%) | 0 |
| Generativo NVIDIA | 12/14 (85.71%) | 9/14 (64.29%) | 13/14 | 9/14 (64.29%) | 1 |

Acierto completo exige categoría y prioridad esperadas, contrato válido y revisión humana cuando corresponde. El conjunto es conocido por los desarrolladores; sus porcentajes no garantizan la misma precisión en mensajes nuevos.

- [Tabla por caso, diferencias y conclusión](results/results.md).
- [Mensajes y respuestas reales completos, códigos HTTP y tiempos](results/comparison.json).
- [Solicitudes enviadas](results/requests.json).
- [Tabla CSV](results/results.csv).

### Conclusión técnica

El motor tradicional obtuvo el mayor acierto completo en esta referencia de 14 solicitudes: tradicional 100% y generativo 64.29%. El acierto de categoría fue 100% y 85.71%, respectivamente; se registraron 0 y 1 errores de ejecución. El tradicional ofrece resultados deterministas sin proveedor externo, pero depende del vocabulario y maneja de forma limitada el contexto y las negaciones. El generativo produce respuestas contextualizadas y depende de la latencia, disponibilidad y criterio del modelo. Los porcentajes incluyen todos los intentos, incluso errores del proveedor. Este conjunto conocido no demuestra superioridad general; deben ampliarse los casos y conservar revisión humana ante posibles incidentes.

## Validación, seguridad y errores

| Situación | HTTP | Código |
| --- | --- | --- |
| JSON mal formado | 400 | `INVALID_JSON` |
| Cuerpo mayor de 10 KB | 413 | `PAYLOAD_TOO_LARGE` |
| Campos inválidos, mensaje vacío o modo inválido | 400 | `VALIDATION_ERROR` |
| Ruta inexistente | 404 | `NOT_FOUND` |
| Proveedor sin configurar | 503 | `LLM_NOT_CONFIGURED` |
| Timeout del proveedor | 504 | `LLM_TIMEOUT` |
| Formato generativo inválido tras corrección | 502 | `INVALID_LLM_FORMAT` |

Los errores de autenticación, límite, red y contenido vacío también se devuelven de forma controlada. No se retransmiten cuerpos internos del proveedor al cliente. El tradicional no usa modelos ni APIs. La protección de prompts y el diccionario reducen riesgos, pero no sustituyen revisión humana ni cubren todos los ataques, sinónimos o negaciones.

## Código y evidencias

| Ruta | Contenido |
| --- | --- |
| `src/app.js`, `src/server.js`, `src/routes/` | API Express y arranque |
| `src/contracts/`, `src/middleware/` | Contrato, seguridad, validación y errores |
| `src/engines/traditional/` | IA simbólica, pesos y respuestas fijas |
| `src/engines/generative/` | NVIDIA, prompt, parser y proveedor |
| `tests/` | Referencia y pruebas de motores, API y comparador |
| `scripts/compare.js` | Comparación común por HTTP y generación de resultados |
| `evidencias/andres/` | Capturas, pruebas y solicitudes del tradicional |
| `evidencias/ismael/` | Evidencia individual del generativo |
| `evidencias/kevin/` | Evidencia de validaciones HTTP |
| `evidencias/final/` | Pruebas y auditoría de la entrega integrada |
| `results/` | Comparación final, respuestas, tabla y conclusión |

`results/nvidia/` conserva la primera evaluación individual histórica de Ismael, con otros mensajes; no se utiliza para calcular la tabla final. Para evaluar solo el generativo sobre la referencia común: `node scripts/run-generative-cases.js`; sus resultados se guardan por separado en `results/nvidia-reference/`.

Para regenerar las evidencias individuales del tradicional: `node evidencias/andres/validar.cjs`. Las capturas individuales corresponden a su etapa de desarrollo; los resultados vigentes de integración están en `evidencias/final/` y `results/`.
