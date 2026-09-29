# LOOP_STATE · Katalis Responde Community

STATUS: DONE
CHANGE: bootstrap (OpenSpec 0)
BRANCH: feature/bootstrap
AGENT: deepseek-harness
DATE: 2026-09-28

## Qué se entregó

Cambio `bootstrap` del plan `tasks/plan-rag-abierto.md` (v2, aprobado por Franc el 2026-09-28), completo y en verde:

- specboot: `openspec init`, `openspec/config.yaml` con el contexto real, `docs/` y `ai-specs/` adaptados solo desde
  los estándares genéricos;
- esqueleto Next.js 16 con React 19, TypeScript estricto y Tailwind v4, con una página que dice el nombre;
- Vitest y Playwright, una prueba de humo de cada uno, ambas probadas capaces de fallar;
- `LICENSE` Apache-2.0 (texto oficial verificado), `NOTICE`, `SECURITY.md`, `CONTRIBUTING.md` y plantillas;
- seguridad desde el día uno: `docs/security.md`, `.env.example` sin valores, `.gitignore` y gancho de gitleaks;
- CI bloqueante: tipos, lint, unitarias, build, extremo a extremo, `npm audit --audit-level=high`, gitleaks sobre el
  historial, `openspec validate --all --strict` y CodeQL, más Dependabot.

## Commits (todos en feature/bootstrap, ninguno en main)

| SHA | Mensaje |
|---|---|
| `460dcb80cc88c718137499c8eeba9b1ca8d16119` | chore(bootstrap): initialize the OpenSpec workspace and the adapted Katalis standards |
| `d3ffc350ec9d654f550e98a46baa793846eac912` | feat(bootstrap): add the Next.js 16 skeleton with its smoke tests |
| `834a4caf089c76d236624d7bbd612eb4453092ab` | feat(bootstrap): license the project under Apache-2.0 and add the community files |
| `c429235f89b8cce2af607a377858fd5ce5c3369b` | feat(bootstrap): add secret scanning, the threat model and the environment template |
| `9f3770d716ef724ae567bda441232818ab81620c` | ci(bootstrap): add the blocking pipeline, CodeQL and Dependabot |
| `06a967c563a6af954a30dca2a08608c21f364a9a` | docs(bootstrap): report the verification of the change |

La verificación completa (`npm ci`, tipos, lint, unitarias, build, extremo a extremo, auditoría, gitleaks y OpenSpec)
corrió en verde sobre `06a967c563a6af954a30dca2a08608c21f364a9a`, con el árbol limpio. Este mismo archivo tiene un
commit posterior que solo agrega este SHA.

## Verificación

Todo comando del CI que puede correr en esta máquina está en verde: `npm ci`, `npm run typecheck`, `npm run lint`,
`npm test`, `npm run build`, `npm run test:e2e`, `npm run audit:high`, `npm run secrets:scan` y
`npm run openspec:validate`, más la verificación manual con `curl.exe` del servidor de producción y del de
desarrollo. La evidencia está en `openspec/changes/bootstrap/reports/`.

## Reglas duras respetadas

- Ningún archivo de fuente con licencia: el repositorio no contiene `.woff`, `.woff2`, `.ttf`, `.otf` ni `.eot`.
- Del repo privado del RAG solo viajaron los estándares genéricos, reescritos para este stack.
- Ningún archivo `.env` se abrió; `.env`, `.env.local` y `.env.production` están ignorados y solo se versiona
  `.env.example` sin valores.
- Sin push: `git log origin/main` falla porque nunca se subió nada.
- Ningún commit en `main`: la rama `main` no existe todavía como referencia, no tiene commits.
- El cambio no se archivó.

## Pendiente y fuera de alcance

- CodeQL y la validación del YAML del lado de GitHub solo corren en la pipeline: no se pueden ejecutar sin push, y
  los reportes lo dicen como UNKNOWN en lugar de darlo por verificado.
- El correo de reporte de seguridad quedó como aviso privado de GitHub; si Franc quiere un correo, se agrega en el
  cambio 6.
- Los cambios 1 a 7 del plan siguen sin empezar.

## Cierre

Entrega en `katalis-dev/tasks/entrega-community-00.md`, en español, con su sección `## Issues`.
