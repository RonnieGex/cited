# Revisión independiente de la corrección de evidencia

Fecha: 2026-10-09. Revisor: r5_review, sin autoría de la corrección ni de su aclaración contractual.

Dictamen: **PASS** para la corrección documental. Blocker abiertos: 0; Major abiertos: 0; Minor abiertos: 0. El CI del SHA nuevo todavía debe comprobarse antes de cerrar el paso 11.

Leí el log del fallo CI de 2f8021d, tests/personal-paths.test.ts, la aclaración de design/tasks y el diff registrado. La causa es verificable: las pruebas enumeran git ls-files y los reportes inicialmente sin registrar quedaron fuera. Seis reportes/logs tenían rutas locales, incluido el path de Node en mi revisión anterior. Este incumplimiento de higiene y la falla de CI se clasifican como Major, resuelto localmente por esta corrección; se conserva su evidencia.

La sustitución cambia únicamente prefijos de entorno por `<workspace>` y `<user-home>`, manteniendo sufijos, comandos, salidas y resultados. Revisé el diff de los seis archivos existentes: no cambia su contenido fuera de esa normalización. El suplemento contractual delimita esta acción al paso 11 todavía pendiente. `git diff --cached -- tests scripts src` no muestra cambios: las pruebas y la implementación permanecen intactas.

La primera comprobación independiente sobre la corrección detectó que r5-paths-green.log recién regenerado había reintroducido una ruta: 51 aprobadas y 2 fallidas, ambas señalando exclusivamente ese log. Reporté el defecto sin modificarlo. El implementador normalizó su línea RUN y dejó las siguientes capturas fuera del repositorio. Esta observación demuestra por qué la salida nueva también debe entrar en la validación final.

Después de registrar la corrección final ejecuté con Node 24.21.0, desde community-readme, `node node_modules/vitest/vitest.mjs run tests/personal-paths.test.ts tests/readme.test.ts`: **53/53**, dos archivos aprobados, exit 0, duración 2.26 segundos. La salida se mantuvo en terminal. El índice incluye la evidencia nueva; no se relajaron patrones ni exenciones de las pruebas. La revisión del diff confirma que la normalización de mi step 9 no altera su dictamen ni resultados.

## Issues

- NOT DONE: ejecutar la comprobación focal después de agregar este suplemento, escanear secretos y verificar CI de PR #18 en el SHA corregido. La pasada local no sustituye ese resultado remoto.
- RISK: permanece la dependencia de fusionar dsh-cited PR #1 antes de PR #18 y de publicar la landing.
