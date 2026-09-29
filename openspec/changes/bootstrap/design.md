# Design: bootstrap

## Context

Change 0 of the plan `tasks/plan-rag-abierto.md` v2. The repository `katalis-dev/community` is new and empty, its
remote is `RonnieGex/katalis-responde-community` and it is private while it is built. The working branch is
`feature/bootstrap`; `main` stays without commits until Franc accepts the delivery.

The private repository `katalis-dev/rag` already carries the suite standards. Only the generic ones travel here, and
they are rewritten for this stack: they describe a Python 3.12 service with uv, FastAPI, LangGraph and pgvector, and
none of that is true in an application that is one Next.js process in TypeScript.

## Decisions taken by the implementer

1. **The standards are rewritten, not copied.** `docs/base-standards.md`, `docs/documentation-standards.md`,
   `docs/frontend-standards.md`, `docs/backend-standards.md`, `docs/katalis-sdd-standard.md` and
   `docs/openspec-tasks-mandatory-steps.md` keep the rules that are stack independent (English only, TDD, small
   steps, report path, definition of done) and replace every stack specific rule with its Next.js and TypeScript
   equivalent. `docs/katalis-sdd-standard.md` stays a copy of `tasks/estandar-sdd-agentes.md`, because that file is
   the standard of the suite, not of a repository.
2. **The report path is the Katalis one.** `openspec/changes/<change>/reports/YYYY-MM-DD-step-N-<name>.md`, as rule 3
   of the standard fixes, and not `specs/<change>/reports/` as the specboot template says. The standard prevails.
3. **Dependency versions follow the official Next.js 16 scaffolder.** `create-next-app@16.3.6` pins TypeScript `^5`,
   ESLint `^9`, React `19.2.8` and `@types/node ^20`. TypeScript 7 and ESLint 10 are published, but the combination
   the Next.js team tests and ships is the one this repository uses: a fork has to install and run, not to be the
   first to find out.
4. **The layout types are explicit.** `app/layout.tsx` types its props as `{ children: ReactNode }` instead of using
   the generated `LayoutProps<"/">` global. The generated route types only exist after `next build`, and the type
   check must be able to run on a fresh clone before the first build.
5. **Vitest runs over jsdom and React Testing Library.** The unit smoke test renders the page and asserts its text,
   which is the cheapest test that fails when the app stops rendering. Playwright runs the same assertion against the
   real server, so the two layers do not test the same thing twice: one tests the component, the other tests the
   built application.
6. **The gitleaks hook is opt-in per clone.** `npm run hooks:install` sets `core.hooksPath` to `.githooks`, and the
   hook fails with installation instructions when gitleaks is missing. A hook cannot be committed as executable
   configuration, so the installation command is part of the setup documented in `README.md` and `CONTRIBUTING.md`.
7. **CI has one job per check.** Failing fast is less useful than knowing which check failed: types, lint, unit
   tests, build, audit, secret scan, OpenSpec validation and CodeQL are separate jobs, all of them required.
8. **The threat model is a living document.** `docs/security.md` writes the seven areas of section 3 of the plan with
   the state of each one in this change (`later change` for everything that is not built yet) so the hardening pass
   of change 6 reviews a document instead of inventing one.
9. **No font files.** The design system arrives in change 1 with a free OFL font; the Lufga files of the paid license
   never enter this repository, and the CI and the local check look for font binaries to prove it.

## Risks

- `npm audit --audit-level=high` is blocking: a high advisory in a transitive dependency of Next.js stops the
  pipeline until the dependency is updated. That is the intent of the plan, and Dependabot opens the update.
- The Playwright suite needs a browser binary. The workflow installs Chromium with its own action; on a machine that
  cannot download it, the E2E step cannot run and the report says so instead of claiming a green run.
- CodeQL needs GitHub's runner. It runs in the pipeline only; the local verification covers the workflow syntax and
  the same checks that can run offline.
