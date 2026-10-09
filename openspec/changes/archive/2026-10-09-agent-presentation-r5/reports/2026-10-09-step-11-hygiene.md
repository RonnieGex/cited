# Corrección de higiene de evidencia

El primer CI de 2f8021dc59220c6c10511c8deeadc68311f47ec0 falló dos pruebas de tests/personal-paths.test.ts por seis reportes con prefijos absolutos de la máquina. [Evidencia CI](https://github.com/RonnieGex/cited/actions/runs/37991380422/job/114026135860), conservada en r5-ci-unit-failure.log. La prueba sólo recorre git ls-files, así que los reportes todavía no registrados no formaron parte de la validación local inicial.

Reproducción local antes de corregir: `npx vitest run tests/personal-paths.test.ts tests/readme.test.ts`, 51 aprobadas y 2 fallidas, exit 1. Salida: r5-paths-red.log.

El autor contractual aclaró design/tasks antes de la corrección; el revisor independiente la aprobó. Se sustituyeron únicamente los prefijos de entorno: primero el workspace por `<workspace>` y después el directorio personal por `<user-home>`. Los argumentos relativos, salidas, resultados y dictamen no cambian. Los logs conservados documentan esa normalización; los originales completos siguen en tasks/ del workspace local y en GitHub.

No se cambió implementación, pruebas ni expectativas para ocultar la falla. El paso 11 permanece pendiente de validación del contenido registrado, revisión independiente y CI del nuevo SHA.

Después de `git add -- openspec/changes/archive/2026-10-09-agent-presentation-r5`, el mismo comando focal pasó 53/53, exit 0. `git diff --cached --check` pasó. El resultado verde está en r5-paths-green.log; se volverá a validar después de agregar este reporte y su log al índice.
