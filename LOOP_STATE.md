# LOOP_STATE · Katalis Responde Community

STATUS: RUNNING
CHANGE: bootstrap (OpenSpec 0)
BRANCH: feature/bootstrap
AGENT: deepseek-harness
DATE: 2026-09-28

## Qué se está haciendo

Cambio `bootstrap` del plan `tasks/plan-rag-abierto.md` (v2, aprobado por Franc el 2026-09-28):
specboot de OpenSpec, esqueleto de la app Next.js 16 en TypeScript estricto con Tailwind v4,
licencia Apache-2.0 con NOTICE, seguridad desde el día uno y CI bloqueante.

## Reglas duras de esta corrida

- Nunca se copia la fuente Lufga ni ningún archivo de fuente con licencia de pago.
- Del repo privado `katalis-dev/rag` solo se adaptan los estándares genéricos; nada de código,
  prompts, casos dorados, `tasks/` ni datos del libro.
- Ningún archivo `.env` se abre.
- Sin push y sin tocar el remoto.
- Ningún commit en `main`: todo vive en `feature/bootstrap`.
- El cambio no se archiva.

## Evidencia

Los reportes por paso viven en `openspec/changes/bootstrap/reports/`.

## Pendiente

Cierre con `../tasks/entrega-community-00.md` y el STATUS final en este archivo.
