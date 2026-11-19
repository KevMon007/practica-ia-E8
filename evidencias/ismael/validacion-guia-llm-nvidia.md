# Evidencia — Guía de implementación del módulo LLM con NVIDIA

**Fecha:** 18/11/2026
**Rama:** `feat/llm-nvidia-module` (creada desde `main` actualizado)
**Responsable:** José Ismael Montalvo Lopez
**Alcance:** exclusivamente los archivos propiedad de Ismael indicados en la guía.

## 1. Estado de partida

`main` ya contenía una implementación previa del motor generativo (PR #2 fusionado).
Esta rama completa los puntos que la guía exige y que no estaban cubiertos:

- Pruebas del flujo del motor (primer intento, corrección única y doble fallo).
- Prueba explícita de prompt injection, de delimitadores y de la cadena `"false"`.
- Prueba de HTTP 403 y de petición con temperatura baja / cabecera Bearer.
- Script nuevo `scripts/run-llm-validation-cases.js` para los 14 casos adicionales: lee `.env` del proyecto, no fija el timeout por código y valida `LLM_TIMEOUT_MS` con la misma regla que `provider.js` (número finito y mayor que cero; si no, 45000 ms).
- `scripts/run-generative-cases.js` conserva su comportamiento original: usa los casos compartidos y la comparación oficial.
- Evidencia nueva en `results/nvidia/validacion-guia/` sin sobrescribir la evaluación histórica de `results/nvidia/`.
- Prompt con la política de datos sensibles y tiempo de espera alineado con la guía (45 s).

No se modificaron `package.json`, `.env.example`, `README.md`, `ml/`, `src/contracts/**`,
`src/routes/**`, `src/middleware/**`, `scripts/compare.js` ni `results/comparison.*`.

## 2. Configuración real utilizada

| Variable | Valor |
| --- | --- |
| `NVIDIA_BASE_URL` | `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL` | `nvidia/nemotron-3.5-lightning-30b-a3b` |
| `LLM_TIMEOUT_MS` | `45000` |
| `NVIDIA_API_KEY` | Solamente en `.env` local, ignorado por Git (`git check-ignore .env`) |

No se registraron claves, cabeceras de autorización ni el contenido de `.env`.

## 3. Pruebas automatizadas (sin consumo de API)

```text
node --test tests/generative.test.js tests/generative-provider.test.js
tests 27 | pass 27 | fail 0

npm test
tests 108 | pass 108 | fail 0

git diff --check
(sin salida: sin errores de whitespace)
```

`global.fetch` se sustituye temporalmente y se restaura con `t.after()` en todas las
pruebas que simulan al proveedor. No se realizaron llamadas reales durante las pruebas.

Cobertura añadida sobre el estado anterior:

- JSON válido con y sin bloque Markdown.
- Categoría y prioridad inválidas, respuesta corta, `requiresHumanReview` no booleano.
- La cadena `"false"` se rechaza, no se repara.
- Texto sin JSON y JSON mal formado.
- Intento de cerrar/abrir `<solicitud>` e instrucciones inyectadas en el ticket.
- `SECURITY` corregido a revisión humana y prioridad mínima `HIGH`, también vía `analyze()`.
- 401, 403, 429 y 500; red; timeout; contenido vacío en ambos intentos y vacío→válido.
- Motor: válido al primer intento, inválido corregido al segundo y doble fallo
  `INVALID_LLM_FORMAT` (HTTP 502).
- Contrato exacto: cinco campos, sin campos extra.

## 4. Validación real de 14 casos

Ejecutado con:

```powershell
node scripts/run-llm-validation-cases.js
```

Resultados guardados en `results/nvidia/validacion-guia/`:

- Casos ejecutados: **14**.
- Correctos completos: **12**.
- Incorrectos: **2** (`85.71 %` de acierto completo).
- Las 14 respuestas cumplieron los cinco campos del contrato.

Diferencias observadas (expectativa definida por esta evaluación, no etiqueta oficial):

| Caso | Esperado | Obtenido |
| --- | --- | --- |
| 02 — cuenta bloqueada tras varios intentos | `ACCESS/HIGH` | `ACCESS/MEDIUM` |
| 09 — vulnerabilidad SQL injection | `SECURITY/CRITICAL` | `SECURITY/HIGH` |

Los dos ataques de prompt injection (casos 13 y 14) se clasificaron como `SECURITY/HIGH`
con revisión humana activada, cumpliendo la política de seguridad.

## 5. Prueba manual controlada (API HTTP)

Solicitud real al endpoint con el servidor local, sin credenciales en la evidencia:

```json
{ "message": "Alguien entró a mi cuenta sin autorización", "mode": "generative" }
```

Respuesta verificada:

```json
{
  "category": "SECURITY",
  "priority": "HIGH",
  "response": "Entiendo perfectamente que alguien haya accedido a tu cuenta sin autorización es una situación seria. He activado el protocolo de seguridad y tu solicitud será revisada por nuestro equipo humano para investigar y proteger tu cuenta inmediatamente.",
  "requiresHumanReview": true,
  "mode": "generative"
}
```

Se comprueban los cinco campos del contrato, la revisión humana obligatoria y la
prioridad mínima `HIGH` para `SECURITY`.

## 6. Riesgos conocidos y alcance

- La prioridad generada por el modelo puede diferir de la expectativa en casos límite;
  el contrato valida el formato, no la exactitud semántica de la prioridad.
- El proveedor externo puede agotar el tiempo de espera o devolver contenido vacío;
  hay un solo reintento ante contenido vacío y un solo reintento ante formato inválido.
- `scripts/run-generative-cases.js` quedó restaurado a su comportamiento original, que es
  el que usa la comparación oficial (`results/nvidia-reference/`), por lo que el README
  compartido sigue siendo válido y no hay solicitudes pendientes para Kevin.
- `scripts/run-llm-validation-cases.js` es un archivo nuevo añadido a petición del equipo;
  no estaba en la lista original de archivos propiedad de Ismael de la guía, por lo que
  queda a revisión de Kevin al integrar.
- No se hicieron cambios en archivos de Kevin ni se fusionó su rama.
