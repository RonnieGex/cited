# Revisión adversarial R4

Fecha: 2026-10-09. Revisor: agente Codex independiente `r4_review`, distinto del autor del contrato y del implementador. Alcance: árbol de trabajo R4 después de `/verify`, antes de archivo y commit. No modifiqué implementación ni especificación.

## Veredicto: PASS

No quedan Blockers, Majors ni Minors de implementación identificados en este alcance. Este dictamen técnico no sustituye calificaciones de arte/UX ni aceptación de Fable.

## Evidencia independiente

- Leí completos el encargo R4, ambas críticas R3, estándar SDD, diseño, deltas, tareas, diff y reportes de pasos 0 a 9.
- `npx vitest run tests/readme.test.ts`: 46/46 en una ejecución propia.
- `openspec validate agent-presentation-r4 --strict`: válido.
- `Get-FileHash` para JSON/TXT canónicos en los tres repos: coincidencia byte por byte. JSON SHA-256 `44ee610d1af52edefe36e21a7e0db0fbdfb0333fe06123183b2107c94a055673`; TXT `49909a7c806ce03db15634aca064c3db6e6889e713f4cf764491d36548462cba`.
- `Compare-Object` de los snapshots before/after: ninguna diferencia. Los 19 conteos y hashes se conservan en este cambio.
- Abrí e inspeccioné `docs/images/agents-light.png`: lienzo 1280x680, pregunta completa etiquetada, primera línea de respuesta, fuente devuelta con chip y precio resaltado dentro de TOOL RESULT, leyenda sin clipping.
- Revisé el guard del renderer: compara exactamente el texto de Sources con el resultado canónico, exige un highlight, un chip y margen inferior >=36px; ambas imágenes se generaron correctamente según log guardado.
- Revisé los logs del implementador: 1167 unitarias, 96 E2E, lint/typecheck sin error. No presento esas corridas como ejecuciones nuevas propias.
- Revisé el informe curl y evidencia MCP: 200 con autorización, 401 sin ella, archivos locales 200 y dependencia documentada de GitHub main.

## Hallazgos y correcciones revisadas

- Blocker: ninguno.
- Major: ninguno.
- Minor resuelto: la tabla de `docs/readme-assets.md` conservaba 1280x640 pese al canvas R4. Relectura confirma 1280x680 en tabla, manifest y manual.

README EN/ES introduce MCP antes de comando, imagen y tabla; distingue las rutas MCP y plugin nativo, concluye con un solo párrafo de procedencia, 2 de 3 y negativa inglesa. La frase Markdown es completa y no existe dentro de la imagen sin enlace. Los modelos permanecen en evidencia enlazada. No se cambió runtime. Autoría de contrato, implementación y revisión está separada.

## Issues

- RISK: fusionar dsh-cited PR #1 antes de Cited PR #18; los enlaces a main aún dependen de esa fusión.
- NOT DONE: commit/push y CI del nuevo SHA siguen al archivo; no están cubiertos por una afirmación de ejecución en este dictamen.
- NOT DONE: puntuaciones de arte/UX y aceptación de Fable; no se declara 9.5 por inferencia.
