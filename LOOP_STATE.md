# LOOP_STATE · Katalis Responde Community

STATUS: DONE
CHANGE: bootstrap (OpenSpec 0)
BRANCH: feature/bootstrap
AGENT: deepseek-harness
DATE: 2026-09-28

## Round 2: the fixes of the review 00 (closed)

`revision-community-00.md` returned FAIL with 0 blockers, 5 majors and 3 minors. Fable corrected the contract
(`openspec/changes/bootstrap/tasks.md`) and amended section 3 of the plan about `SECURITY.md`. The nine open tasks are
executed and verified, with the command and its real output in
`openspec/changes/bootstrap/reports/2026-09-28-step-9-review-fixes.md`:

- **2.8**: `openspec/specs/.gitkeep` is versioned, so a clean clone carries the canonical tree, and `.claude/agents`,
  `.codex/agents` and `.cursor/agents` are Git symbolic links, mode `120000`, to `ai-specs/agents`, verified in a
  clean clone.
- **2.9**: the personal paths left `docs/base-standards.md` and the two reports that carried them, and
  `tests/personal-paths.test.ts` fails when a tracked text file carries a home directory of a development machine. The
  red run found exactly the three files of the review.
- **5.3**: `SECURITY.md` documents the private vulnerability reporting of GitHub as the channel with its exact
  address, states that the role address `security@katalis.dev` is added when the mailbox exists and that a personal
  address is never used. Enabling the repository setting is an owner action.
- **6.8**: `docs/security.md` presents the local hook as a developer aid that only exists after
  `npm run hooks:install` and can be skipped, and the pipeline as the enforced scan of the full history.
- **7.5**: the CI secret scan no longer uses the event range of `gitleaks-action@v3`; it installs the gitleaks command
  line pinned by version and SHA-256 and scans every commit. A synthetic history with a secret added and removed in
  older commits turns it red with exit 2, while the range of the action reports no leaks.
- **7.6**: `engines.node` is `>=24.15.0 <25.0.0`, the intersection of the supported line with the locked
  dependencies, in `package.json` and in the root entry of `package-lock.json`, and the README in its two languages
  and the development guide state the floor.
- **9.6**: the state of the database was measured with exact commands before and after the whole pipeline: no
  datastore dependency in the eighteen declared packages, no tracked database, dump or migration, and no file created
  by the suites.
- **13.1**: 72 tasks, 72 marked `[x]`, every one with its report; the 30 references that were missing were appended
  after the existing evidence without touching the text of a task.
- **13.2**: the real commits are listed below. No push, no commit in `main`, no archive.

## Round 1: what was delivered

Change `bootstrap` of the plan `tasks/plan-rag-abierto.md` (v2, approved by Franc on 2026-09-28), complete and green:

- specboot: `openspec init`, `openspec/config.yaml` with the real context of the plan, and `docs/` and `ai-specs/`
  adapted from the generic standards only;
- a Next.js 16 skeleton with React 19, strict TypeScript and Tailwind v4, with one page that names the product;
- Vitest and Playwright, one smoke test each, both proven able to fail;
- Apache-2.0 `LICENSE` (official text verified), `NOTICE`, `SECURITY.md`, `CONTRIBUTING.md` and the templates;
- security from the first commit: `docs/security.md`, `.env.example` with no values, `.gitignore` and a gitleaks
  hook;
- a blocking pipeline: types, lint, unit tests, build, end to end, `npm audit --audit-level=high`, gitleaks over the
  whole history, `openspec validate --all --strict` and CodeQL, plus Dependabot.

## Commits (all on feature/bootstrap, none in main)

| SHA | Message |
|---|---|
| `6840541374f34037cf6d8320041cca4f624ebec4` | docs(bootstrap): report the review 00 fixes and complete the contract evidence |
| `7a5ac9791ab8da4b7e914c92f608d87784b89356` | fix(bootstrap): correct the review 00 findings in the tree, the pipeline and security |
| `ac8007326e0a8f6b320506277f612587cb36bb8e` | chore(bootstrap): version the canonical tree and link the agent folders |
| `c693c984787ccec117413910172c0f3c4141fd85` | chore(bootstrap): set the state file to running for the review fixes |
| `51b57f5211e463cd542bf4672ab9c3a430eea941` | Correct the bootstrap tasks contract after review 00 (Fable) |
| `a175060a35eded44832f519650ed415853fac34e` | docs(bootstrap): keep the state file and the standards in English |
| `19fae5246eef75bc2843ef7b00aa17b12da3c762` | chore(bootstrap): record the verified closing commit in the state file |
| `06a967c563a6af954a30dca2a08608c21f364a9a` | docs(bootstrap): report the verification of the change |
| `9f3770d716ef724ae567bda441232818ab81620c` | ci(bootstrap): add the blocking pipeline, CodeQL and Dependabot |
| `c429235f89b8cce2af607a377858fd5ce5c3369b` | feat(bootstrap): add secret scanning, the threat model and the environment template |
| `834a4caf089c76d236624d7bbd612eb4453092ab` | feat(bootstrap): license the project under Apache-2.0 and add the community files |
| `d3ffc350ec9d654f550e98a46baa793846eac912` | feat(bootstrap): add the Next.js 16 skeleton with its smoke tests |
| `460dcb80cc88c718137499c8eeba9b1ca8d16119` | chore(bootstrap): initialize the OpenSpec workspace and the adapted Katalis standards |

The whole verification (`npm ci`, types, lint, unit tests, build, end to end, audit, the secret scan and the strict
OpenSpec validation) ran green on `7a5ac9791ab8da4b7e914c92f608d87784b89356` with a clean tree, and the unit suite and
the validation ran again on the tree that carries the report. The last commit adds this list to this file.

## Evidence

The reports of every step live in `openspec/changes/bootstrap/reports/`, ten files with the command, its real output
and a verdict. Every `[x]` of `tasks.md` names its report.

## Hard rules respected

- No licensed font file: the repository holds no `.woff`, `.woff2`, `.ttf`, `.otf` or `.eot`.
- No personal path: the documents and the reports that had one were corrected, and a unit test fails when a tracked
  text file carries a home directory of a development machine.
- From the private repository only the generic standards travelled, rewritten for this stack.
- No `.env` file was opened. `.env`, `.env.local` and `.env.production` are ignored, and only `.env.example` with
  empty values is versioned.
- No push: `git for-each-ref refs/remotes` is empty, so no reference was ever fetched or uploaded from this clone.
- No commit in `main`: the branch has no commits and does not even exist as a reference yet.
- The change was not archived: `openspec/changes/archive/` is empty.
- UTF-8 with LF in every file that was added or modified.

## Pending and out of scope

- NOT DONE, owner action: the private vulnerability reporting setting of the repository. The channel is documented in
  `SECURITY.md`, but enabling it is a write against the repository settings and this mission forbids remote
  operations.
- RISK: this machine runs Node 24.11.0 and the declared floor is 24.15.0, the version the locked dependencies require,
  so `npm ci` prints an `EBADENGINE` warning about the root package. The pipeline resolves Node from `.nvmrc` and is
  not affected.
- RISK: on a Windows clone without the symlink privilege, the three `agents` entries are plain files with the target
  path inside, so the canonical definitions do not materialise as a folder there. Linux, macOS and Windows with
  developer mode are not affected.
- RISK, deferred by the contract note that Fable wrote: Minor 2 of the review, the authorship metadata of the history
  and the references to the name of the private repository, belongs to change 7 `docs-deploy-and-launch`.
- UNKNOWN: CodeQL, the GitHub-side validation of the workflows and the new secret scan on a runner. They cannot run
  without a push, and the reports mark them UNKNOWN instead of claiming a local run.
- Changes 1 to 7 of the plan have not started.

## Closing

Delivery in `katalis-dev/tasks/entrega-community-00b.md`, in Spanish, with its `## Issues` section.
