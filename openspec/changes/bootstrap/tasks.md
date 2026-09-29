# Tasks: bootstrap

Report path: `openspec/changes/bootstrap/reports/YYYY-MM-DD-step-N-<name>.md` (the Katalis standard fixes this path;
it overrides `specs/<change>/reports/` of the specboot template).

## 0. Setup: create the feature branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create `feature/bootstrap` from `main` without creating any commit in `main` -
      `reports/2026-09-28-step-0-branch.md`
- [x] 0.2 Confirm the current branch and that `main` carries no commit - `git rev-parse --verify main` fails, so the
      branch does not exist; `reports/2026-09-28-step-0-branch.md`
- [x] 0.3 `LOOP_STATE.md` with `STATUS: RUNNING` - committed with the workspace
- [x] 0.4 Report: `reports/2026-09-28-step-0-branch.md`

## 1. Specification artifacts (before any code)

- [x] 1.1 `proposal.md`, `specs/repository-bootstrap/spec.md`, `specs/app-skeleton/spec.md`,
      `specs/supply-chain-security/spec.md`, `design.md` and this file exist - commit `460dcb8`
- [x] 1.2 `openspec validate --all --strict` passes and the report carries the command and its output -
      `Totals: 1 passed, 0 failed`, exit 0; `reports/2026-09-28-step-1-specboot.md`
- [x] 1.3 Report: `reports/2026-09-28-step-1-specboot.md`

## 2. specboot: the workspace and the standards (no code yet)

- [x] 2.1 `openspec init --tools 'claude,codex,cursor'` - `OpenSpec Setup Complete`, 10 skills and 10 commands;
      `reports/2026-09-28-step-1-specboot.md`
- [x] 2.2 `openspec/config.yaml` with the context of the approved plan v2 - parses with `npx js-yaml`, exit 0;
      `reports/2026-09-28-step-1-specboot.md`
- [x] 2.3 `docs/base-standards.md`, `docs/documentation-standards.md`, `docs/frontend-standards.md` and
      `docs/backend-standards.md` rewritten for a Next.js application in strict TypeScript - the search for
      `uv run|pyproject|FastAPI|LangGraph|psycopg|pgvector` returns no match;
      `reports/2026-09-28-step-1-specboot.md`
- [x] 2.4 `docs/katalis-sdd-standard.md` as a copy of `tasks/estandar-sdd-agentes.md` - the two SHA-256 hashes are
      `F001DDBF...EBA3E`; `reports/2026-09-28-step-1-specboot.md`
- [x] 2.5 `docs/openspec-tasks-mandatory-steps.md` with the Katalis report path and the npm commands of this stack -
      committed in `460dcb8`
- [x] 2.6 `ai-specs/agents/backend-developer.md`, `ai-specs/agents/frontend-developer.md` and
      `ai-specs/agents/product-strategy-analyst.md` adapted, plus `ai-specs/README.md` - the search for
      `Prisma|Express|FastAPI|katalis-dev` returns no match; `reports/2026-09-28-step-1-specboot.md`
- [x] 2.7 Report: `reports/2026-09-28-step-1-specboot.md`

## 3. Tests first (TDD)

- [x] 3.1 Write the failing Vitest smoke test for the home page - `tests/home.test.tsx`; the red run found a real
      defect (missing `globals: true`); `reports/2026-09-28-step-3-tests.md`
- [x] 3.2 Write the failing Playwright smoke test for the home page - `e2e/home.spec.ts`
- [x] 3.3 Run both and paste the failing output in the report - the mutation of the heading turns Vitest red with
      exit 1; `reports/2026-09-28-step-3-tests.md`
- [x] 3.4 Report: `reports/2026-09-28-step-3-tests.md`

## 4. Application skeleton

- [x] 4.1 `package.json` with Node 24 in `engines`, the pinned dependency set and every script of the pipeline -
      commit `d3ffc35`
- [x] 4.2 `.nvmrc` with Node 24 and the committed `package-lock.json` - `npm ci` installs 550 packages, exit 0
- [x] 4.3 `tsconfig.json` strict, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs` - `strict` and
      `noUncheckedIndexedAccess` true, `allowJs` false
- [x] 4.4 `app/layout.tsx`, `app/page.tsx` and `app/globals.css` with Tailwind v4 and the single page - the served
      body carries `<main><h1>Katalis Responde Community</h1></main>`; `reports/2026-09-28-step-7-local-verification.md`
- [x] 4.5 `vitest.config.mts` and `vitest.setup.ts` - jsdom, globals, `@testing-library/jest-dom`
- [x] 4.6 `playwright.config.ts` - chromium, web server on port 3100, `reports/2026-09-28-step-3-tests.md`
- [x] 4.7 `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` green - exit 0 each;
      `reports/2026-09-28-step-7-local-verification.md`
- [x] 4.8 Report: `reports/2026-09-28-step-2-app-skeleton.md`

## 5. License and community files

- [x] 5.1 `LICENSE` with the full Apache License 2.0 text - it matches `https://www.apache.org/licenses/LICENSE-2.0.txt`
      line by line, without the leading blank line of the published file; `reports/2026-09-28-step-4-license-and-community.md`
- [x] 5.2 `NOTICE` with the Katalis attribution - `Built by Katalis (https://katalis.dev)`
- [x] 5.3 `SECURITY.md` with the reporting address and the supported version - GitHub private advisories; `main` is
      the only supported branch
- [x] 5.4 `CONTRIBUTING.md` with the local steps and the hook installation - commit `834a4ca`
- [x] 5.5 `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md` and
      `.github/pull_request_template.md` - commit `834a4ca`
- [x] 5.6 Report: `reports/2026-09-28-step-4-license-and-community.md`

## 6. Security from the first commit

- [x] 6.1 `docs/security.md` with the threat model of section 3 of the plan as a living document - eight areas, each
      with its state and the change that builds the rest; `reports/2026-09-28-step-5-security-day-one.md`
- [x] 6.2 `.env.example` with the planned names and empty values - 26 names, every assignment ends at the equals sign
- [x] 6.3 `.gitignore` that ignores `.env*` except `.env.example` - `git check-ignore .env .env.local .env.production`
      exits 0 and `git ls-files` lists only `.env.example`
- [x] 6.4 `.gitleaks.toml` extending the default rules - commit `c429235`
- [x] 6.5 `.githooks/pre-commit` and `scripts/install-hooks.mjs`, with instructions when gitleaks is missing -
      `npm run hooks:install` exits 0 and sets `core.hooksPath`; without gitleaks on `PATH` the hook exits 1 with the
      installation command
- [x] 6.6 Prove the hook: a planted credential is refused and a clean commit passes - `leaks found: 1`, exit 1, no
      commit created; the five commits of the change passed with `no leaks found`
- [x] 6.7 Report: `reports/2026-09-28-step-5-security-day-one.md`

## 7. Continuous integration and dependency updates

- [x] 7.1 `.github/workflows/ci.yml` with one blocking job per check - types, lint, unit tests, build, end to end,
      audit, secret scan and OpenSpec validation; commit `9f3770d`
- [x] 7.2 `.github/workflows/codeql.yml` for JavaScript and TypeScript - `security-extended`, push, pull request and a
      weekly schedule; commits `9f3770d`
- [x] 7.3 `.github/dependabot.yml` for npm and GitHub Actions - weekly, five open pull requests per ecosystem
- [x] 7.4 Report: `reports/2026-09-28-step-6-ci-and-dependabot.md`

## 8. Review and update existing tests (MANDATORY)

- [x] 8.1 Re-read both smoke tests and remove what the implementation made obsolete - both assert the product name and
      nothing that the change invalidates; `reports/2026-09-28-step-3-tests.md`
- [x] 8.2 Confirm that no test needs the network, a real key or a container - the unit test renders a component and
      the end-to-end test talks to the server it starts itself; `reports/2026-09-28-step-7-local-verification.md`
- [x] 8.3 Confirm the unit smoke test fails when the page text changes - mutation run with exit 1;
      `reports/2026-09-28-step-3-tests.md`
- [x] 8.4 Report: `reports/2026-09-28-step-3-tests.md`

## 9. Run the tests (MANDATORY)

- [x] 9.1 Run `npm ci` from the committed lockfile - `added 550 packages`, `found 0 vulnerabilities`, exit 0
- [x] 9.2 Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`, with the output in the report -
      exit 0 each; `reports/2026-09-28-step-7-local-verification.md`
- [x] 9.3 Run `npm audit --audit-level=high` - `found 0 vulnerabilities`, exit 0
- [x] 9.4 Run gitleaks over the full history and prove a planted secret turns it red - `no leaks found` over the five
      commits, exit 0; the planted credential of step 6 turned it red with exit 1
- [x] 9.5 Write the evidence in `reports/2026-09-28-step-7-local-verification.md`

## 10. Manual verification of the running application (MANDATORY - AGENT MUST EXECUTE)

- [x] 10.1 Start the production server and request `GET /` with `curl.exe`, pasting the status and the body - status
      200 and `<main><h1>Katalis Responde Community</h1></main>`;
      `reports/2026-09-28-step-7-local-verification.md`
- [x] 10.2 Confirm the answer carries the product name - the same evidence, plus `npm run dev` on port 3000
- [x] 10.3 Paste every command and its response in the report - `reports/2026-09-28-step-7-local-verification.md`

## 11. End-to-end testing with Playwright (MANDATORY - THIS CHANGE HAS A FRONTEND)

- [x] 11.1 Install the Chromium browser used by the Playwright configuration - `npx playwright install chromium`,
      exit 0, version 1.63.0
- [x] 11.2 Run `npm run test:e2e` and paste the output in the report - `1 passed (9.8s)`, exit 0
- [x] 11.3 Report: `reports/2026-09-28-step-7-local-verification.md`

## 12. Update the technical documentation (MANDATORY)

- [x] 12.1 `README.md` bilingual, with the construction status, the license and the local steps - commit `834a4ca`
- [x] 12.2 `docs/development-guide.md` with the local commands, the ports and the environment files - commit `460dcb8`
- [x] 12.3 `openspec/config.yaml` updated with what this change really added - the standards read after the skeleton
      exists; commit `460dcb8`
- [x] 12.4 Report: `reports/2026-09-28-step-8-documentation.md`

## 13. Close the change

- [x] 13.1 Every task of this file marked `[x]` with its evidence in a report - this file
- [x] 13.2 Commits in English on `feature/bootstrap`, with no push, no commit in `main` and no archive - six commits;
      `git rev-parse --verify main` fails and `git log origin/main` fails, so nothing exists in `main` and nothing was
      pushed
- [x] 13.3 `tasks/entrega-community-00.md` in Spanish with `## Issues` - written outside the repository, in
      `katalis-dev/tasks/`
- [x] 13.4 `LOOP_STATE.md` with the final status - `STATUS: DONE` with the commits and the pending items
