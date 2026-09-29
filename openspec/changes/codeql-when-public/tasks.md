Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task. Evidence rule: every
`[x]` needs a real report that supports it at archive time; a report in a later commit than its mark is recorded, not
blocking, unless the evidence is missing or contradicts the mark. Reports: `reports/2026-09-29-step-N-<name>.md`.

## 0. Step 0: the branch

- [x] 0.1 Work on `feature/codeql-when-public`, created by Fable from `main` (`efdda14`) with this contract; confirm
      branch and base — report: `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [x] 1.1 `npm test`, `openspec validate --all --strict`, and the failing CodeQL run `36511364255` quoted from
      `gh run view --log-failed` (the upload error) — report: `reports/2026-09-29-step-1-base-before.md`
- [x] 1.2 The state of the database: none exists in this repository; prove it — report:
      `reports/2026-09-29-step-1-base-before.md`

## 2. Tests first

- [x] 2.1 The workflow contract test for `codeql.yml` written or extended first and run red: it requires the condition
      of the design on the analysis job and unchanged languages, queries, triggers and permissions — report:
      `reports/2026-09-29-step-2-tests-first.md`

## 3. Implementation

- [x] 3.1 The one-line condition in `codeql.yml`; the test green — report: `reports/2026-09-29-step-3-implementation.md`

## 4. Review and update of the existing tests

- [ ] 4.1 The whole suite green on Windows and in a `node:24` Linux container; say which tests changed — report:
      `reports/2026-09-29-step-4-existing-tests.md`

## 5. Run the checks

- [ ] 5.1 `npm run typecheck`, `npm run lint`, gitleaks over the history, `openspec validate --all --strict`,
      `git diff --check`, `actionlint` if installed — report: `reports/2026-09-29-step-5-checks.md`

## 6. Manual verification with curl

- [ ] 6.1 Not applicable: no route changes; say so with the changed-file list — report: `reports/2026-09-29-step-6-curl.md`

## 7. End-to-end

- [ ] 7.1 Not applicable: the page does not change; say so — report: `reports/2026-09-29-step-7-e2e.md`

## 8. The state of the base after

- [ ] 8.1 Repeat 1.1 (local part) and 1.2 — report: `reports/2026-09-29-step-8-base-after.md`

## 9. Documentation

- [ ] 9.1 One line in `docs/security.md` on when CodeQL runs and why; the delivery
      `katalis-dev/tasks/entrega-community-00g.md` in Spanish with `## Issues` — report: `reports/2026-09-29-step-9-docs.md`

## 10. After merge (Fable)

- [BLOCKED] 10.1 Push `main` and confirm the CodeQL run is reported as skipped, not failed. Reserved for Fable.
