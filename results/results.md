# Resultados comparativos — AI Support Engine

Ejecución: 2026-11-17T22:09:49.765Z. Referencia: tests/cases.json (14 mensajes idénticos por motor).
SHA-256 de la referencia: `c6aacbbd0eea9b6a8b8b599bc9c0ad3a958b80a86c16f5e804e55ab3b18f85eb`.
Proveedor: NVIDIA. Modelo: `nvidia/nemotron-3.5-lightning-30b-a3b`. Timeout por llamada: 45000 ms.

## Porcentajes

| Motor | Casos | Categoría correcta | Prioridad correcta | Formato válido | Acierto completo | Errores | Tiempo medio (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| traditional | 14 | 14/14 (100%) | 14/14 (100%) | 14/14 | 14/14 (100%) | 0 | 14 |
| generative | 14 | 12/14 (85.71%) | 9/14 (64.29%) | 13/14 | 9/14 (64.29%) | 1 | 11955 |

Acierto completo exige categoría y prioridad de referencia, formato válido y revisión humana cuando corresponde. El denominador incluye todos los casos y los errores del proveedor. Las expectativas se fijaron antes de ejecutar y no se modificaron.

## Resultados por caso

| ID | Tipo | Motor | Referencia | Obtenido | Formato | Cat. correcta | Prior. correcta | Revisión humana | HTTP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | normal | traditional | ACCESS/MEDIUM | ACCESS/MEDIUM | Sí | Sí | Sí | false | 200 |
| 1 | normal | generative | ACCESS/MEDIUM | ACCESS/MEDIUM | Sí | Sí | Sí | false | 200 |
| 2 | normal | traditional | ACCESS/HIGH | ACCESS/HIGH | Sí | Sí | Sí | false | 200 |
| 2 | normal | generative | ACCESS/HIGH | ACCESS/HIGH | Sí | Sí | Sí | false | 200 |
| 3 | normal | traditional | BUG/MEDIUM | BUG/MEDIUM | Sí | Sí | Sí | false | 200 |
| 3 | normal | generative | BUG/MEDIUM | BUG/HIGH | Sí | Sí | No | false | 200 |
| 4 | normal | traditional | BUG/CRITICAL | BUG/CRITICAL | Sí | Sí | Sí | false | 200 |
| 4 | normal | generative | BUG/CRITICAL | BUG/CRITICAL | Sí | Sí | Sí | false | 200 |
| 5 | normal | traditional | FEATURE/LOW | FEATURE/LOW | Sí | Sí | Sí | false | 200 |
| 5 | normal | generative | FEATURE/LOW | FEATURE/LOW | Sí | Sí | Sí | false | 200 |
| 6 | normal | traditional | SECURITY/CRITICAL | SECURITY/CRITICAL | Sí | Sí | Sí | true | 200 |
| 6 | normal | generative | SECURITY/CRITICAL | SECURITY/CRITICAL | Sí | Sí | Sí | true | 200 |
| 7 | normal | traditional | SECURITY/CRITICAL | SECURITY/CRITICAL | Sí | Sí | Sí | true | 200 |
| 7 | normal | generative | SECURITY/CRITICAL | SECURITY/HIGH | Sí | Sí | No | true | 200 |
| 8 | normal | traditional | SECURITY/HIGH | SECURITY/HIGH | Sí | Sí | Sí | true | 200 |
| 8 | normal | generative | SECURITY/HIGH | SECURITY/HIGH | Sí | Sí | Sí | true | 200 |
| 9 | ambiguo | traditional | BUG/LOW | BUG/LOW | Sí | Sí | Sí | true | 200 |
| 9 | ambiguo | generative | BUG/LOW | BUG/MEDIUM | Sí | Sí | No | false | 200 |
| 10 | ambiguo | traditional | ACCESS/MEDIUM | ACCESS/MEDIUM | Sí | Sí | Sí | false | 200 |
| 10 | ambiguo | generative | ACCESS/MEDIUM | BUG/HIGH | Sí | No | No | false | 200 |
| 11 | ambiguo | traditional | FEATURE/LOW | FEATURE/LOW | Sí | Sí | Sí | false | 200 |
| 11 | ambiguo | generative | FEATURE/LOW | FEATURE/LOW | Sí | Sí | Sí | false | 200 |
| 12 | adversarial | traditional | SECURITY/HIGH | SECURITY/HIGH | Sí | Sí | Sí | true | 200 |
| 12 | adversarial | generative | SECURITY/HIGH | SECURITY/HIGH | Sí | Sí | Sí | true | 200 |
| 13 | adversarial | traditional | SECURITY/HIGH | SECURITY/HIGH | Sí | Sí | Sí | true | 200 |
| 13 | adversarial | generative | SECURITY/HIGH | SECURITY/HIGH | Sí | Sí | Sí | true | 200 |
| 14 | adversarial | traditional | BUG/HIGH | BUG/HIGH | Sí | Sí | Sí | true | 200 |
| 14 | adversarial | generative | BUG/HIGH | LLM_TIMEOUT/- | No | No | No | - | 504 |

## Diferencias y limitaciones observadas

- Caso 3, generative: referencia BUG/MEDIUM; obtenido BUG/HIGH. La valoración de prioridad difiere de la referencia.
- Caso 7, generative: referencia SECURITY/CRITICAL; obtenido SECURITY/HIGH. La valoración de prioridad difiere de la referencia.
- Caso 9, generative: referencia BUG/LOW; obtenido BUG/MEDIUM. La valoración de prioridad difiere de la referencia.
- Caso 10, generative: referencia ACCESS/MEDIUM; obtenido BUG/HIGH. La categoría difiere de la referencia.
- Caso 14, generative: referencia BUG/HIGH; obtenido LLM_TIMEOUT/-. No se obtuvo una respuesta válida.

Los mensajes, respuestas, códigos HTTP, tiempos y verificaciones están en [comparison.json](comparison.json). La tabla exportable está en [results.csv](results.csv) y las solicitudes en [requests.json](requests.json). Los tiempos incluyen HTTP local y reintentos del proveedor.

## Conclusión técnica (máximo 150 palabras)

El motor tradicional obtuvo el mayor acierto completo en esta referencia de 14 solicitudes: tradicional 100% y generativo 64.29%. El acierto de categoría fue 100% y 85.71%, respectivamente; se registraron 0 y 1 errores de ejecución. El tradicional ofrece resultados deterministas sin proveedor externo, pero depende del vocabulario y maneja de forma limitada el contexto y las negaciones. El generativo produce respuestas contextualizadas y depende de la latencia, disponibilidad y criterio del modelo. Los porcentajes incluyen todos los intentos, incluso errores del proveedor. Este conjunto conocido no demuestra superioridad general; deben ampliarse los casos y conservar revisión humana ante posibles incidentes.

## Reproducir

Desde la raíz: configurar .env con NVIDIA_API_KEY, NVIDIA_MODEL y LLM_TIMEOUT_MS, instalar con npm ci y ejecutar npm run compare. El comparador levanta Express en un puerto local efímero y lo cierra al finalizar. Usa respuestas reales de NVIDIA, no mocks.
