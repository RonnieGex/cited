# Revisión adversarial independiente

Fecha: 2026-10-09. Revisor: Codex, agente `presentation_review`, independiente del autor del contrato y del implementador. Alcance: cambio `agent-evidence-r3`, working tree de `docs/agents-readme`. No escribí la implementación ni ejecuté nuevas corridas de modelos. Leí el encargo R3, ambas críticas R2, el estándar SDD, el contrato y los diffs finales.

Veredicto: **PASS WITH GAPS**. Cero Blocker y cero Major pendientes. Los gaps son la dependencia pública de fusión y los checks de cierre posteriores al commit, no fallas de la implementación revisada.

## Hallazgos y correcciones revisadas

- Minor, resuelto: el texto inicial llamaba al contenido un extracto pero omitía que la corrida también llamó a `cited_search`. Ambos README ahora dicen que es exactamente el primer párrafo, identifican la llamada adicional y enlazan la transcripción con todas las llamadas y la respuesta completa.
- Minor, resuelto: faltaba la declaración explícita de la falsa afirmación de ausencia del precio tras la negativa inglesa, requerida por la enmienda. Ambos idiomas ahora la declaran, junto con 2 de 3 respuestas con precio sustentado, búsqueda por palabras clave y ausencia de embeddings.
- Minor, resuelto: faltaba una regresión específica de selección y conteo. La prueba nueva fija los tres resultados, la selección de attempt-2, sus eventos y su pasaje propio. Se volvió a ejecutar la suite dirigida después de la corrección.

## Evidencia independiente

- Ejecuté `npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/readme.test.ts`: **46/46**, exit 0, después de las correcciones. La ejecución previa fue 45/45.
- Comparé el transcript crudo en los tres entregables con `Get-FileHash -Algorithm SHA256`: todos tienen `49909A7C806CE03DB15634ACA064C3DB6E6889E713F4CF764491D36548462CBA`.
- Leí attempt-2 y la respuesta inglesa original. El precio, documento, sección y posición provienen de la propia respuesta `cited_ask`. El primer párrafo mostrado coincide exactamente, salvo Markdown renderizado y chip de cita declarados. El resto permanece en la descarga. La respuesta inglesa con citas irrelevantes no se cuenta como precio sustentado.
- Inspeccioné `agents-light.png` y `agents-dark.png`: pregunta completa, extracto rotulado, chip 1 en respuesta y pasaje, dirección de fuente y posición 2, texto legible, pie completo y sin recorte. SVG de roadmap y leyenda distinguen respuesta, conexión/listado y documentación. Las dos rutas de Harness tienen filas y evidencia separadas.
- Revisé el escape previo al renderizado Markdown en `scripts/render-readme-graphics.mjs`; el texto del modelo no se convierte en HTML activo. El validador compartido rechaza IDs duplicados, resultados huérfanos, truncamiento y resultados fuera de orden.
- Leí los reportes de validación: 96 archivos/1167 pruebas unitarias, lint, typecheck y OpenSpec estricto 15/15. Inspeccioné `e2e-output.txt`, que termina en **96 passed (2.4m)**. Estas ejecuciones son del implementador; no las presento como ejecutadas por este revisor.
- Comparé snapshots antes/después: SHA-256 idéntico `E98EEA5D5C0F8795C4273CFABBAF8733DC23C7FFA7CCD88EB62DA4350DCB0C7B`. No se confunde la base estática de validación con el cambio legítimo de `model_calls` de la captura.
- Revisé `docs/readme-assets.md` y `docs/testing.md` actualizados. El diff no cambia runtime de Cited ni app/perfil desktop de Harness.
- Ejecuté `curl.exe -s -o NUL -w '%{http_code}'` contra los archivos concretos `headless-answer.txt` y `compatibility.md` en `https://github.com/RonnieGex/dsh-cited/blob/main/docs/evidence/`: **404** ambos antes de fusión.

## Issues

- RISK: los enlaces a evidencia en main requieren que Fable fusione `RonnieGex/dsh-cited#1` antes de Cited #18. La dependencia está documentada; esta revisión no autoriza fusionar.
- NOT DONE: los checks remotos del commit final y el cierre de PR son posteriores a esta revisión del working tree; deben quedar verdes antes de declarar terminada la entrega.
