Título: feat: motor tradicional basado en reglas y casos de referencia

Los mensajes de soporte se clasifican en ACCESS, BUG, FEATURE o SECURITY mediante palabras clave ponderadas y respuestas fijas, con `mode: "traditional"`. El motor calcula prioridades sin aceptar órdenes de manipulación. Cualquier señal del diccionario de seguridad activa revisión humana, prioridad mínima HIGH y un aviso de seguridad, incluso si otra categoría obtiene más puntos. Los términos críticos mantienen CRITICAL.

Incluye los 14 casos de referencia originales, pruebas con `node:test` y evidencias de las cuatro categorías y de un intento adversarial. Se limita a los archivos asignados a Andrés y no requiere NVIDIA ni otras APIs.

Validación: `npm test -- --test-reporter=tap`: 62 aprobadas, 0 fallidas y 0 omitidas, utilizando el contrato real de Kevin. Aciertos de categoría y prioridad: 14/14 en la referencia original, también comprobados mediante 14 solicitudes HTTP. Incluye siete regresiones de seguridad adicionales comprobadas por HTTP y una prueba de independencia entre mensajes. Registros y siete capturas finales actualizados al 17/11/2026. Reproducir evidencias con `node evidencias/andres/validar.cjs`.

Base: esqueleto del equipo en `main` (`af352a8`). Los cambios se prepararon en `feat/traditional` y se limitan a los archivos de Andrés. No se ha realizado ningún merge.
