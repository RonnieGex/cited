# Change: bootstrap

## Why

Katalis Responde Community is the free and forkable edition of Katalis Responde: a business forks it, fills in its
own information and its own API keys, and answers its customers with citations from its own documents
(`tasks/plan-rag-abierto.md` v2, approved by Franc on 2026-09-28). Change 0 is the bootstrap: a new private
repository that already carries the working standard, the application skeleton, the license of the project, the
threat model and a blocking continuous integration pipeline, before any product feature exists.

## What changes

- The OpenSpec workspace is initialized and `openspec/config.yaml` describes this project, not another one.
- `docs/` and `ai-specs/` carry the generic Katalis standards rewritten for a Next.js application in TypeScript.
- The repository holds a Next.js 16 App Router skeleton with React 19, strict TypeScript and Tailwind v4, plus a
  Vitest suite and a Playwright suite with one smoke test each.
- The project is licensed under Apache-2.0 with a `NOTICE` file, and it ships `SECURITY.md`, `CONTRIBUTING.md`,
  issue templates and a pull request template.
- Security exists from the first commit: `docs/security.md` holds the threat model of section 3 of the plan,
  `.env.example` lists the planned variable names with empty values, `.gitignore` keeps every environment file out,
  and a local gitleaks hook refuses a commit that carries a secret.
- Continuous integration is blocking and covers types, lint, unit tests, the production build, `npm audit` at the
  high level, gitleaks over the history, the strict OpenSpec validation and CodeQL for JavaScript and TypeScript.
  Dependabot watches npm and GitHub Actions.

## Impact

- Affected specs: `repository-bootstrap`, `app-skeleton`, `supply-chain-security` (all new).
- Affected code: the whole repository; every file of this change is new.
- Out of scope: the design system (`design-system-shared`), the knowledge store (`core-libsql-hybrid-search`), the
  model providers (`pluggable-models-and-ask`), the administration panel and the public page
  (`admin-and-public-ui`), the voice agent (`elevenlabs-voice-agent`), the hardening pass
  (`security-hardening`) and the deployment documentation (`docs-deploy-and-launch`).
- Never in this repository: the Lufga font or any other commercially licensed font file, the book of Construye,
  golden cases, holdout data, prompts of clients, prices or keys.
