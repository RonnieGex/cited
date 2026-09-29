# LOOP_STATE · Katalis Responde Community

STATUS: DONE
CHANGE: codeql-when-public (OpenSpec)
BRANCH: feature/codeql-when-public
BASE: efdda14 (main)
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute the contract `openspec/changes/codeql-when-public/tasks.md`, written by Fable, in order, with the evidence of
every task in `openspec/changes/codeql-when-public/reports/`. The defect: the first CodeQL run of `main`
(`36511364255`) analyzed the code and then failed at the upload, "Code scanning is not enabled for this repository",
because GitHub accepts code scanning uploads from a private repository only with a paid plan (the workflow of `main`
was red on every push for a reason unrelated to the code). The change is one job-level condition,
`if: ${{ !github.event.repository.private }}`, so the analysis job is reported as skipped, not failed, while the
repository stays private, and it runs unchanged once change 7 makes it public.

## What was delivered

- **Step 0**: the branch and its base confirmed: `feature/codeql-when-public` over `efdda14` (`main`), with the
  contract of Fable as its only commit and a clean tree.
- **Step 1**: the state of the base. The failing run of `main` on GitHub (`gh run view 36511364255 --log-failed`) is
  quoted with the upload error, the run is `failure` on the push of `efdda14`, and the local suite and the strict
  validation are measured green at the base. The repository has no database: no tracked file with a database
  extension, no `migrations/`, no datastore dependency among the eighteen declared packages.
- **Step 2**: the red. `tests/codeql-workflow.test.ts` was written first, with a strict reader of the YAML subset the
  workflows use (no YAML library is declared, and the change adds no dependency); four assertions, one per scenario
  of the spec delta. It failed on Windows and in the disposable `node:24` container with one single failure: the
  missing condition. The three assertions of what must not change were green in both.
- **Step 3**: the fix. One line on the analysis job of `.github/workflows/codeql.yml`. The file was cross-checked with
  `npx --yes js-yaml` (exit 0), which reads the condition as the string `${{ !github.event.repository.private }}` and
  reads the triggers, the permissions, the languages and the queries exactly as the contract test does. The test and
  the whole suite went green.
- **Step 4**: the whole suite green on Windows and in the container: 3 files, 13 tests (the base had 9). The only test
  file that changes is the new one; `tests/home.test.tsx` and `tests/personal-paths.test.ts` are untouched.
- **Step 5**: every check green on both platforms: `npm test`, `npm run typecheck`, `npm run lint`, gitleaks over the
  whole history with the command of the pipeline, `openspec validate --all --strict`, `git diff --check`, plus
  `npm run build` on Windows. `actionlint` is not installed on this machine and the contract asks for it only if it
  is; the syntax is covered locally by the two YAML parsers.
- **Step 6**: no route or server behaviour changed, so `curl` does not apply; the changed-file list is in the report.
- **Step 7**: the page does not change, so the end-to-end suite has nothing of this change to exercise; said so, with
  the empty diff of `app/` and `e2e/`.
- **Step 8**: the state after is the state before plus one line of a workflow, one test file, one row of
  documentation and the reports: no database, no package added, no application file touched.
- **Step 9**: the row that `docs/security.md` owns now states when CodeQL runs and why it is skipped while the
  repository is private. This delivery is `katalis-dev/tasks/entrega-community-00g.md`, in Mexican Spanish.

All the eleven boxes of the contract that belong to this execution are `[x]`, every one with its report; task 10.1
stays `[BLOCKED]` and reserved for Fable; the text of no task and no line of the spec delta was edited.

## Commits (all on feature/codeql-when-public, none in main)

| SHA | Message |
|---|---|
| `36deb70` | docs(codeql-when-public): state when CodeQL runs and report the state after |
| `10aafd4` | docs(codeql-when-public): report the checks and the steps that do not apply |
| `59c369b` | docs(codeql-when-public): report the green suite on both platforms |
| `10ba77f` | ci(codeql-when-public): skip the CodeQL analysis while the repository is private |
| `b43f5a1` | test(codeql-when-public): add the contract test of the codeql workflow |
| `1c14bd6` | chore(codeql-when-public): set the state file to running and report the base state |

`789c2c8` ("Specify running CodeQL only while the repository is public") is the commit of Fable that carries the
contract, and the branch starts there. The closing commit of this execution carries this state file with the result of
the closing battery, and it is named in the delivery.

## Evidence

`openspec/changes/codeql-when-public/reports/` holds one report per step, with the exact command, the commit and the
real output: `2026-09-29-step-0-branch.md`, `-step-1-base-before.md`, `-step-2-tests-first.md`,
`-step-3-implementation.md`, `-step-4-existing-tests.md`, `-step-5-checks.md`, `-step-6-curl.md`, `-step-7-e2e.md`,
`-step-8-base-after.md` and `-step-9-docs.md`.

## Hard rules respected

- No Lufga source material and no licensed font file: nothing of the sort was downloaded, copied or added.
- No personal path: the reports and the documents use relative paths and elide the absolute path the tools print; the
  tracked-file scan of the suite passes on the tree that carries them.
- No `.env` file was opened; not even `.env.example`.
- No push: the remote was never contacted, and `git rev-parse origin/main` still points at the base.
- No commit in `main`: `main` stays at `efdda14`.
- No archive: `openspec/changes/archive/` keeps its entries of the earlier changes, and this change is not archived.
- No repository setting was touched: enabling code scanning belongs to the launch (decision 3 of the design).
- UTF-8 with LF in every file written or modified.

## Pending and out of scope

- UNKNOWN, by the rules of this mission: the CI of the branch on GitHub and the GitHub-side validation of the
  workflow schema. A push is forbidden here, so the suite, the checks and the container run were verified on a
  disposable `node:24` container that reproduces the runner, not on a GitHub runner.
- BLOCKED, owner Fable: task 10.1, "Push `main` and confirm the CodeQL run is reported as skipped, not failed". It is
  reserved for Fable and requires the merge and the push this mission does not authorize.
- RISK: this machine runs Node 24.11.0 while the declared floor is 24.15.0, so `npm ci` prints `EBADENGINE` warnings
  about the root package and about jsdom. Inherited from the bootstrap change and not affected by this one.
- RISK: a hand-written reader of the YAML subset is what the contract test uses, because no YAML library is declared
  and the proposal adds no dependency. It throws instead of guessing, and its reading of `codeql.yml` was
  cross-checked against `js-yaml` and against the file itself.
- RISK inherited and unchanged: on a Windows clone without the symlink privilege, `.claude/agents`, `.codex/agents`
  and `.cursor/agents` stay as text files with the target path, so the canonical definitions do not materialise as a
  folder there.

## Closing

Delivery in `katalis-dev/tasks/entrega-community-00g.md`, in Mexican Spanish, with its `## Issues` section.
