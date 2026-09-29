# LOOP_STATE · Katalis Responde Community

STATUS: DONE
CHANGE: bootstrap (OpenSpec 0)
BRANCH: feature/bootstrap
AGENT: deepseek-harness
DATE: 2026-09-28

## What was delivered

Change `bootstrap` of the plan `tasks/plan-rag-abierto.md` (v2, approved by Franc on 2026-09-28), complete and green:

- specboot: `openspec init`, `openspec/config.yaml` with the real context of the plan, and `docs/` and `ai-specs/`
  adapted from the generic standards only;
- a Next.js 16 skeleton with React 19, strict TypeScript and Tailwind v4, with one page that names the product;
- Vitest and Playwright, one smoke test each, both proven able to fail;
- Apache-2.0 `LICENSE` (official text verified), `NOTICE`, `SECURITY.md`, `CONTRIBUTING.md` and the templates;
- security from the first commit: `docs/security.md`, `.env.example` with no values, `.gitignore` and a gitleaks
  hook;
- a blocking pipeline: types, lint, unit tests, build, end to end, `npm audit --audit-level=high`, gitleaks over the
  history, `openspec validate --all --strict` and CodeQL, plus Dependabot.

## Commits (all on feature/bootstrap, none in main)

| SHA | Message |
|---|---|
| `460dcb80cc88c718137499c8eeba9b1ca8d16119` | chore(bootstrap): initialize the OpenSpec workspace and the adapted Katalis standards |
| `d3ffc350ec9d654f550e98a46baa793846eac912` | feat(bootstrap): add the Next.js 16 skeleton with its smoke tests |
| `834a4caf089c76d236624d7bbd612eb4453092ab` | feat(bootstrap): license the project under Apache-2.0 and add the community files |
| `c429235f89b8cce2af607a377858fd5ce5c3369b` | feat(bootstrap): add secret scanning, the threat model and the environment template |
| `9f3770d716ef724ae567bda441232818ab81620c` | ci(bootstrap): add the blocking pipeline, CodeQL and Dependabot |
| `06a967c563a6af954a30dca2a08608c21f364a9a` | docs(bootstrap): report the verification of the change |
| `19fae5246eef75bc2843ef7b00aa17b12da3c762` | chore(bootstrap): record the verified closing commit in the state file |

The whole verification (`npm ci`, types, lint, unit tests, build, end to end, audit, gitleaks and OpenSpec) ran green
on `06a967c563a6af954a30dca2a08608c21f364a9a` with a clean tree. The last commit only adds that SHA to this file.

## Evidence

The reports of every step live in `openspec/changes/bootstrap/reports/`, nine files with the command, its real output
and a verdict. Every `[x]` of `tasks.md` points at its report.

## Hard rules respected

- No licensed font file: the repository holds no `.woff`, `.woff2`, `.ttf`, `.otf` or `.eot`.
- From the private repository only the generic standards travelled, rewritten for this stack.
- No `.env` file was opened. `.env`, `.env.local` and `.env.production` are ignored, and only `.env.example` with
  empty values is versioned.
- No push: `git log origin/main` fails because nothing was ever uploaded.
- No commit in `main`: the branch has no commits and does not even exist as a reference yet.
- The change was not archived.

## Pending and out of scope

- CodeQL and the GitHub-side validation of the workflows run in the pipeline only: they cannot run without a push,
  and the reports mark them UNKNOWN instead of claiming a local run.
- The security reporting channel is the private advisory of GitHub. If Franc wants an email address, it is added in
  change 6.
- Changes 1 to 7 of the plan have not started.

## Closing

Delivery in `katalis-dev/tasks/entrega-community-00.md`, in Spanish, with its `## Issues` section.
