# Implementación

agents.html, renderizador y verificaciones geométricas, prueba README, dos PNG agents y documentación. El extracto toma fuente y precio del cited_ask original; retira la viñeta y el punto de numeración sólo al representarlos. Sin cambios de prosa README, aplicación ni otros gráficos.

Inspección ejecutada: git diff --name-only y git diff contra 8d5f8dd52e401ebe454b7b37b1e497f3b54bd78a. git diff de runtime y evidencia canónica: vacío. SHA-256 de la transcripción en los tres repos: 49909a7c806ce03db15634aca064c3db6e6889e713f4cf764491d36548462cba. lib/index.js: 87d9f86651f530c033bef84816349a8d343935b67b7178f8969fdf29dcc08c3a; lib/cited.js: 210697405c61930b490143b0ada320f9227b6edbf39392f550e543fa7c3c682a.

El primer render Cited detectó la viñeta de la línea de precio original: la selección ahora toma esa línea exacta y quita sólo sus dos caracteres de viñeta. La prueba exacta de la landing detectó acentos dañados por stdin del shell y se corrigieron con apply_patch. Los logs fallidos se conservan.
