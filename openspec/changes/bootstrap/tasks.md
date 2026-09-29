# Tasks: bootstrap

Report path: `openspec/changes/bootstrap/reports/YYYY-MM-DD-step-N-<name>.md` (the Katalis standard fixes this path;
it overrides `specs/<change>/reports/` of the specboot template).

## 0. Setup: create the feature branch (MANDATORY - FIRST STEP)

- [ ] 0.1 Create `feature/bootstrap` from `main` without creating any commit in `main`
- [ ] 0.2 Confirm the current branch and that `main` carries no commit
- [ ] 0.3 `LOOP_STATE.md` with `STATUS: RUNNING`
- [ ] 0.4 Report: `reports/2026-09-28-step-0-branch.md`

## 1. Specification artifacts (before any code)

- [ ] 1.1 `proposal.md`, `specs/repository-bootstrap/spec.md`, `specs/app-skeleton/spec.md`,
      `specs/supply-chain-security/spec.md`, `design.md` and this file exist
- [ ] 1.2 `openspec validate --all --strict` passes and the report carries the command and its output
- [ ] 1.3 Report: `reports/2026-09-28-step-1-specboot.md`

## 2. specboot: the workspace and the standards (no code yet)

- [ ] 2.1 `openspec init --tools 'claude,codex,cursor'`
- [ ] 2.2 `openspec/config.yaml` with the context of the approved plan v2
- [ ] 2.3 `docs/base-standards.md`, `docs/documentation-standards.md`, `docs/frontend-standards.md` and
      `docs/backend-standards.md` rewritten for a Next.js application in strict TypeScript
- [ ] 2.4 `docs/katalis-sdd-standard.md` as a copy of `tasks/estandar-sdd-agentes.md`
- [ ] 2.5 `docs/openspec-tasks-mandatory-steps.md` with the Katalis report path and the npm commands of this stack
- [ ] 2.6 `ai-specs/agents/backend-developer.md`, `ai-specs/agents/frontend-developer.md` and
      `ai-specs/agents/product-strategy-analyst.md` adapted, plus `ai-specs/README.md`
- [ ] 2.7 Report: `reports/2026-09-28-step-1-specboot.md`

## 3. Tests first (TDD)

- [ ] 3.1 Write the failing Vitest smoke test for the home page
- [ ] 3.2 Write the failing Playwright smoke test for the home page
- [ ] 3.3 Run both and paste the failing output in the report
- [ ] 3.4 Report: `reports/2026-09-28-step-3-tests.md`

## 4. Application skeleton

- [ ] 4.1 `package.json` with Node 24 in `engines`, the pinned dependency set and every script of the pipeline
- [ ] 4.2 `.nvmrc` with Node 24 and the committed `package-lock.json`
- [ ] 4.3 `tsconfig.json` strict, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`
- [ ] 4.4 `app/layout.tsx`, `app/page.tsx` and `app/globals.css` with Tailwind v4 and the single page
- [ ] 4.5 `vitest.config.mts` and `vitest.setup.ts`
- [ ] 4.6 `playwright.config.ts`
- [ ] 4.7 `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` green
- [ ] 4.8 Report: `reports/2026-09-28-step-2-app-skeleton.md`

## 5. License and community files

- [ ] 5.1 `LICENSE` with the full Apache License 2.0 text
- [ ] 5.2 `NOTICE` with the Katalis attribution
- [ ] 5.3 `SECURITY.md` with the reporting address and the supported version
- [ ] 5.4 `CONTRIBUTING.md` with the local steps and the hook installation
- [ ] 5.5 `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md` and
      `.github/pull_request_template.md`
- [ ] 5.6 Report: `reports/2026-09-28-step-4-license-and-community.md`

## 6. Security from the first commit

- [ ] 6.1 `docs/security.md` with the threat model of section 3 of the plan as a living document
- [ ] 6.2 `.env.example` with the planned names and empty values
- [ ] 6.3 `.gitignore` that ignores `.env*` except `.env.example`
- [ ] 6.4 `.gitleaks.toml` extending the default rules
- [ ] 6.5 `.githooks/pre-commit` and `scripts/install-hooks.mjs`, with instructions when gitleaks is missing
- [ ] 6.6 Prove the hook: a planted credential is refused and a clean commit passes
- [ ] 6.7 Report: `reports/2026-09-28-step-5-security-day-one.md`

## 7. Continuous integration and dependency updates

- [ ] 7.1 `.github/workflows/ci.yml` with one blocking job per check
- [ ] 7.2 `.github/workflows/codeql.yml` for JavaScript and TypeScript
- [ ] 7.3 `.github/dependabot.yml` for npm and GitHub Actions
- [ ] 7.4 Report: `reports/2026-09-28-step-6-ci-and-dependabot.md`

## 8. Review and update existing tests (MANDATORY)

- [ ] 8.1 Re-read both smoke tests and remove what the implementation made obsolete
- [ ] 8.2 Confirm that no test needs the network, a real key or a container
- [ ] 8.3 Confirm the unit smoke test fails when the page text changes

## 9. Run the tests (MANDATORY)

- [ ] 9.1 Run `npm ci` from the committed lockfile
- [ ] 9.2 Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`, with the output in the report
- [ ] 9.3 Run `npm audit --audit-level=high`
- [ ] 9.4 Run gitleaks over the full history and prove a planted secret turns it red
- [ ] 9.5 Write the evidence in `reports/2026-09-28-step-7-local-verification.md`

## 10. Manual verification of the running application (MANDATORY - AGENT MUST EXECUTE)

- [ ] 10.1 Start the production server and request `GET /` with `curl.exe`, pasting the status and the body
- [ ] 10.2 Confirm the answer carries the product name
- [ ] 10.3 Paste every command and its response in the report

## 11. End-to-end testing with Playwright (MANDATORY - THIS CHANGE HAS A FRONTEND)

- [ ] 11.1 Install the Chromium browser used by the Playwright configuration
- [ ] 11.2 Run `npm run test:e2e` and paste the output in the report
- [ ] 11.3 Report: `reports/2026-09-28-step-7-local-verification.md`

## 12. Update the technical documentation (MANDATORY)

- [ ] 12.1 `README.md` bilingual, with the construction status, the license and the local steps
- [ ] 12.2 `docs/development-guide.md` with the local commands, the ports and the environment files
- [ ] 12.3 `openspec/config.yaml` updated with what this change really added
- [ ] 12.4 Report: `reports/2026-09-28-step-8-documentation.md`

## 13. Close the change

- [ ] 13.1 Every task of this file marked `[x]` with its evidence in a report
- [ ] 13.2 Commits in English on `feature/bootstrap`, with no push, no commit in `main` and no archive
- [ ] 13.3 `tasks/entrega-community-00.md` in Spanish with `## Issues`
- [ ] 13.4 `LOOP_STATE.md` with the final status
