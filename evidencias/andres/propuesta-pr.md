Título: feat: motor tradicional basado en reglas y casos de referencia

Los mensajes de soporte se clasifican en ACCESS, BUG, FEATURE o SECURITY mediante palabras clave ponderadas y respuestas fijas, con `mode: "traditional"`. El motor calcula prioridades sin aceptar órdenes de manipulación y exige revisión humana y prioridad mínima HIGH para SECURITY.

Incluye los 14 casos de referencia originales, pruebas con `node:test` y evidencias de las cuatro categorías y de un intento adversarial. Se limita a los archivos asignados a Andrés y no requiere NVIDIA ni otras APIs.

Validación: `npm test -- --test-reporter=tap`: 54 aprobadas, 0 fallidas y 0 omitidas, utilizando el contrato real de Kevin. Aciertos de categoría y prioridad: 14/14 en la referencia conocida, también comprobados mediante 14 solicitudes HTTP al endpoint Express con respuesta 200. Los registros finales están incluidos; las capturas corresponden a la ejecución inicial, anterior a la publicación del esqueleto.

Base: esqueleto del equipo en `main` (`af352a8`). Los cambios se prepararon en `feat/traditional` y se limitan a los archivos de Andrés. No se ha realizado ningún merge.
