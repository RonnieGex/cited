Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task. A task is `[x]` only
with evidence in its report (`reports/2026-09-29-step-N-<name>.md`): the exact command, the commit and the output.

## 0. Step 0: the branch

- [x] 0.1 Work on `feature/fix-tracked-text-scan`, created by Fable from `main` (`3ff834f`) with this contract; confirm
      branch and base — report: `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [x] 1.1 `npm test` locally on the base and the failing GitHub run of `main` (job Unit tests, `EISDIR`) quoted from
      `gh run view --log-failed`. **Contract corrected by Fable after `revision-community-00d.md` Major 2:** the base
      is not green on Windows either (1 failed, 4 passed: the archived contract is reported by the prefix check, the
      second defect of the proposal); the report records that result — report:
      `reports/2026-09-29-step-1-base-before.md`
- [x] 1.2 The state of the database: this repository has no database yet; prove it (no datastore dependency, no data
      file tracked) — report: `reports/2026-09-29-step-1-base-before.md`

## 2. Tests first

- [x] 2.1 Reproduce red on Linux: run the suite in a disposable Linux container (`node:24`) over a fresh clone of `main`,
      where the three symlinks are real, and paste the `EISDIR` failure — report: `reports/2026-09-29-step-2-tests-first.md`
- [x] 2.2 Add the scenarios of the spec as tests (a symlink whose target carries a home path is an offender; the
      archived contract path is exempt; any other file with the prefix is reported), run red first — report:
      `reports/2026-09-29-step-2-tests-first.md`

## 3. Implementation

- [x] 3.1 The scan reads `git ls-files -s -z` modes: `120000` checked by its target (`readlinkSync` on a real link, the
      file text on a Windows text link), regular files by content, binaries skipped; the exemption matches the active
      and the archived path — report: `reports/2026-09-29-step-3-implementation.md`

## 4. Review and update of the existing tests

- [x] 4.1 The three existing assertions still hold; say what changed — report:
      `reports/2026-09-29-step-4-existing-tests.md`

## 5. Run the checks

- [x] 5.1 Green in the Linux container and on Windows: `npm test`, `npm run typecheck`, `npm run lint`, gitleaks,
      `openspec validate --all --strict`, `git diff --check` — report: `reports/2026-09-29-step-5-checks.md`

## 6. Manual verification with curl

- [x] 6.1 Not applicable: no route or server behavior changes; say so with the changed-file list — report:
      `reports/2026-09-29-step-6-curl.md`

## 7. End-to-end

- [x] 7.1 `npm run test:e2e` still green (the page did not change) — report: `reports/2026-09-29-step-7-e2e.md`

## 8. The state of the base after

- [x] 8.1 Repeat 1.2 and the local checks — report: `reports/2026-09-29-step-8-base-after.md`

## 9. Documentation

- [x] 9.1 A line in `docs/development-guide.md` about symlinks on Windows checkouts (`core.symlinks`) and why the scan
      uses git modes; the delivery `katalis-dev/tasks/entrega-community-00d.md` in Spanish with `## Issues` — report:
      `reports/2026-09-29-step-9-docs.md`

## Contract note (Fable, 2026-09-29)

`design.md` was added by Fable after `revision-community-00d.md` Major 1. Evidence rule applied from this review on:
every `[x]` needs a real report whose content supports it at archive time; a report added in a later commit than
its mark is recorded, not blocking, unless the evidence is missing or contradicts the mark.
