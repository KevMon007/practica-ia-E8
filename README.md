**Repositorio:** [KevMon007/practica-ia-E8](https://github.com/KevMon007/practica-ia-E8)

| Integrante | Usuario de GitHub | Nombre registrado en los commits de Git |
| --- | --- | --- |
| Juan Andrés Medina Gonzalez | [@JAndres-MGonzalez](https://github.com/JAndres-MGonzalez) | `Juan Andrés Medina Gonzalez` |
| José Ismael Montalvo Lopez | [@Ismael2509](https://github.com/Ismael2509) | `Ismael-2509` |
| Kevin Armando Montalvo Marcial | [@KevMon007](https://github.com/KevMon007) | `KevMon007` |

# AI Support Engine

Prototipo de clasificación de solicitudes de soporte desarrollado con **Node.js y Express**. Implementa dos enfoques: un motor tradicional basado en reglas y un motor generativo conectado a la API de NVIDIA.

El sistema recibe un mensaje, identifica su categoría, asigna una prioridad y prepara una respuesta. Ambos motores utilizan el mismo contrato JSON para permitir su comparación.

## Contribuciones del equipo

### Juan Andrés Medina Gonzalez — Motor tradicional y casos de referencia

- Implementó la normalización de texto, el puntaje por palabras clave y el desempate entre categorías.
- Desarrolló las reglas de prioridad y las respuestas predeterminadas.
- Agregó detección de intentos de manipulación y revisión humana ante señales de seguridad, aunque otra categoría obtenga mayor puntaje.
- Preparó los 14 casos de referencia: ocho normales, tres ambiguos y tres adversariales.
- Implementó 62 pruebas automatizadas y documentó las ejecuciones HTTP, siete regresiones adicionales de seguridad y las capturas finales.
- Preparó su aporte para la conclusión técnica del equipo.

**Rama:** `feat/traditional`. **PR:** [#1](https://github.com/KevMon007/practica-ia-E8/pull/1).

### José Ismael Montalvo Lopez — Motor generativo

- Implementó la conexión con NVIDIA mediante un endpoint compatible con Chat Completions.
- Diseñó el prompt de clasificación y el tratamiento del mensaje del usuario como datos.
- Desarrolló el parser y la validación de la respuesta JSON del modelo.
- Agregó un reintento cuando la salida no cumple el formato y errores controlados de autenticación, límite de solicitudes, red, respuesta vacía y timeout.
- Aplicó el contrato compartido para asegurar revisión humana y prioridad mínima HIGH en resultados SECURITY.
- Implementó 17 pruebas automatizadas y documentó sus verificaciones individuales.
- Guardó solicitudes y respuestas de 14 ejecuciones reales con NVIDIA y añadió un reintento limitado ante contenido vacío del proveedor.

**Rama:** `feat/generative`. **PR:** [#2](https://github.com/KevMon007/practica-ia-E8/pull/2).

### Kevin Armando Montalvo Marcial — API, contrato e integración

- Creó la estructura inicial, la aplicación Express, el servidor y las rutas.
- Definió el contrato compartido, las categorías, las prioridades y `EngineError`.
- Implementó la selección del motor mediante `mode` y el endpoint de salud.
- Agregó validación de cuerpos, tipos, mensajes vacíos y modos inválidos.
- Corrigió el manejo de JSON mal formado y cuerpos que superan el límite permitido.
- Incorporó 13 pruebas HTTP, evidencias de errores y el archivo `package-lock.json` para instalaciones reproducibles.
- Integró el PR del motor tradicional en `main`.

**Rama de cambios de API:** `feat/integration`. **PR:** [#3](https://github.com/KevMon007/practica-ia-E8/pull/3).

## Estado verificado de la entrega

Al **17 de noviembre de 2026**:

| Componente | Estado |
| --- | --- |
| Motor tradicional, PR #1 | Integrado en `main` |
| Motor generativo, PR #2 | Implementado en su rama; pendiente de integración |
| Correcciones de API, PR #3 | Revisadas y aprobadas; pendiente de integración |
| Comparación completa entre ambos motores | Pendiente |
| Tabla final y conclusión comparativa | Pendientes |

Para ejecutar ambos motores desde `main`, primero debe integrarse el PR #2. Para contar con las validaciones HTTP descritas a continuación, debe integrarse el PR #3. Los resultados de pruebas de cada rama no sustituyen la comparación final de ambos motores.

## Tecnologías

- Node.js 18 o superior.
- Express y módulos CommonJS.
- `dotenv` para configuración por variables de entorno.
- `node:test` y `node:assert` para pruebas automatizadas.
- API de NVIDIA para el motor generativo.

## Instalación y configuración

```powershell
git clone https://github.com/KevMon007/practica-ia-E8.git
cd practica-ia-E8
npm install
Copy-Item .env.example .env
```

Edita `.env` y configura las variables:

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto del servidor; por defecto `3000` |
| `NVIDIA_API_KEY` | Clave personal para autenticar las solicitudes generativas |
| `NVIDIA_BASE_URL` | URL base del proveedor; el código usa `https://integrate.api.nvidia.com/v1` por defecto |
| `NVIDIA_MODEL` | Identificador del modelo habilitado que utilizará el equipo |
| `LLM_TIMEOUT_MS` | Tiempo máximo de espera del proveedor, en milisegundos |

El motor tradicional funciona sin una clave de NVIDIA. El motor generativo requiere una clave válida y un modelo disponible en la cuenta del proveedor.

El equipo debe registrar el modelo y el timeout efectivos utilizados para la comparación, ya que el modelo de `.env.example` y el valor predeterminado del proveedor difieren.

Cuando `package-lock.json` esté integrado, puede utilizarse `npm ci` para instalar exactamente las dependencias registradas.

## Ejecución

```powershell
npm start
```

El servidor inicia por defecto en `http://localhost:3000`.

Para desarrollo con reinicio automático:

```powershell
npm run dev
```

### Comprobar disponibilidad

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/health'
```

Respuesta:

```json
{ "status": "ok" }
```

## API de análisis

**Endpoint:** `POST /api/analyze`.

El cuerpo debe incluir `message`, como texto, y `mode`, con uno de los valores `traditional` o `generative`.

### Motor tradicional

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

Ejemplo de respuesta del motor tradicional:

```json
{
  "category": "ACCESS",
  "priority": "MEDIUM",
  "response": "Lamentamos el inconveniente con su acceso. Verifique sus credenciales y utilice la opción \"Recuperar contraseña\". Si su cuenta está bloqueada, solicite su restablecimiento al equipo de soporte.",
  "requiresHumanReview": false,
  "mode": "traditional"
}
```

### Motor generativo

Después de integrar su implementación y configurar NVIDIA:

```powershell
$solicitud = @{
    message = 'La aplicación se cierra cuando guardo una factura'
    mode = 'generative'
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/api/analyze' `
    -Method Post `
    -ContentType 'application/json; charset=utf-8' `
    -Body $solicitud
```

La respuesta generativa depende del mensaje y del modelo. Se valida antes de devolverla al cliente; no se sustituye por respuestas generativas escritas manualmente.

## Categorías y prioridades

| Categoría | Descripción |
| --- | --- |
| `ACCESS` | Problemas de inicio de sesión o acceso |
| `BUG` | Errores o fallas del sistema |
| `FEATURE` | Solicitudes de nuevas funcionalidades |
| `SECURITY` | Vulnerabilidades o incidentes de seguridad |

Las prioridades permitidas son `LOW`, `MEDIUM`, `HIGH` y `CRITICAL`.

Ambos motores devuelven los campos `category`, `priority`, `response`, `requiresHumanReview` y `mode`. Todo resultado SECURITY requiere revisión humana y prioridad mínima HIGH. El tradicional también activa esa protección cuando detecta señales del diccionario de seguridad en mensajes donde gana otra categoría.

## Validación y errores

Las correcciones del PR #3 responden:

| Situación | HTTP | Código |
| --- | --- | --- |
| JSON mal formado | `400` | `INVALID_JSON` |
| Campos inválidos o mensaje vacío | `400` | `VALIDATION_ERROR` |
| Cuerpo superior al límite de 10 KB | `413` | `PAYLOAD_TOO_LARGE` |
| Ruta inexistente | `404` | `NOT_FOUND` |

El motor generativo diferencia errores de configuración, autenticación, límite del proveedor, red, timeout y formato. Si el JSON generado es inválido, solicita una corrección una vez; si sigue siendo inválido, devuelve un error controlado.

## Pruebas y resultados verificados

```powershell
npm test
```

| Verificación | Resultado |
| --- | --- |
| Pruebas del tradicional | 62 aprobadas |
| Pruebas del generativo en su rama | 17 aprobadas |
| Suite actual de la rama generativa, que incluye el tradicional | 79 aprobadas, sin fallos |
| Pruebas HTTP incorporadas por Kevin | 13 aprobadas |
| Suite del PR #3, que incluye el tradicional | 75 aprobadas, sin fallos |
| Categorías tradicionales en los 14 casos de referencia | 14/14 correctas |
| Prioridades tradicionales en los 14 casos de referencia | 14/14 correctas |
| Regresiones adicionales de seguridad del tradicional por HTTP | 7/7 correctas |

El resultado de 14/14 corresponde al conjunto conocido de referencia y no representa una garantía de precisión en mensajes nuevos. Las pruebas del proveedor que usan mocks verifican el manejo de errores, no la inferencia real de NVIDIA.

La primera ronda real de NVIDIA, disponible en `results/nvidia/summary.json` dentro del PR #2, registra 10/14 casos completamente correctos (71.43%), dos respuestas vacías y dos diferencias de prioridad. Ese porcentaje evalúa conjuntamente categoría, prioridad, formato y revisión humana. Los mensajes de esa ronda son distintos de los de la referencia tradicional, por lo que todavía no constituyen una comparación común entre motores.

Para regenerar las evidencias tradicionales:

```powershell
node evidencias/andres/validar.cjs
```

## Comparación de motores

La referencia compartida está en `tests/cases.json` e incluye 14 solicitudes normales, ambiguas y adversariales. La comparación final debe ejecutar los mismos mensajes en ambos motores y registrar categoría, prioridad, validez del formato y corrección respecto a esa referencia.

Al estado verificado, `npm run compare` está declarado en `package.json`, pero todavía falta `scripts/compare.js`. Quedan pendientes las ejecuciones comparativas reales sobre la misma referencia, los porcentajes de ambos motores, la tabla final y una conclusión técnica de máximo 150 palabras basada en esos resultados. El script individual `scripts/run-generative-cases.js`, en el PR #2, también necesita reemplazar la ruta personal de su `.env` por una configuración reproducible en otras computadoras.

## Organización del código y evidencias

| Ruta | Contenido |
| --- | --- |
| `src/app.js` y `src/server.js` | Aplicación Express y arranque |
| `src/routes/` | Endpoint de análisis y selección del motor |
| `src/contracts/` | Contrato compartido y política de seguridad |
| `src/middleware/` | Validación de entrada y manejo de errores |
| `src/engines/traditional/` | Reglas, respuestas y motor tradicional |
| `src/engines/generative/` | Motor generativo; implementación completa en el PR #2 |
| `tests/` | Casos de referencia y pruebas automatizadas |
| `evidencias/andres/` | Resultados, capturas y aporte del motor tradicional |
| `evidencias/ismael/` | Evidencia individual del generativo en el PR #2 |
| `evidencias/kevin/` | Evidencias de validación HTTP en el PR #3 |
| `results/` | Carpeta destinada a los resultados comparativos finales |
| `results/nvidia/` | Solicitudes, respuestas y resumen de la evaluación individual de NVIDIA en el PR #2 |

## Seguridad y limitaciones

- Las claves se configuran mediante variables de entorno. `.env` y las credenciales reales no deben publicarse en GitHub ni aparecer en las evidencias.
- El motor tradicional no realiza llamadas a APIs ni utiliza modelos generativos.
- Las reglas dependen del vocabulario definido y pueden producir falsos positivos o no reconocer sinónimos, errores ortográficos, negaciones y contexto.
- El motor generativo depende de la disponibilidad, los límites, la latencia y las respuestas del proveedor.
- La detección de manipulación y la revisión humana reducen riesgos, pero requieren verificación continua con casos nuevos.
