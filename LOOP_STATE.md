# LOOP_STATE · Cited

STATUS: DONE
CHANGE: codeql-findings (OpenSpec)
BRANCH: feature/codeql-findings
BASE: 86b250f (origin/main when the change started)
HEAD AT THE START OF THE ROUND: 69aa289 ("Contract of codeql-findings: the four CodeQL alerts of the product")
AGENT: DeepSeek (implementer), contract written by Fable
DATE: 2026-09-30

## Objective

Execute steps 1 to 9.1 of `openspec/changes/codeql-findings/tasks.md` and nothing else: close the four open CodeQL
alerts of the product (`js/double-escaping` and `js/incomplete-multi-character-sanitization` on `docxToMarkdown`,
`js/file-system-race` on `parseFile`, `js/insufficient-password-hash` on `passwordMatches`). Tests first, red before
each fix, one real report per `[x]` inside the change, small commits, gitleaks on every commit, no push, no remote,
no archive, no commit on `main`, no edit of the text of the tasks, of `design.md` or of the specs. Steps 0, 9.2, 9.3
and 9.4 are not part of this round.

## Progress

- Reading of the contract done: `proposal.md`, `design.md`, `tasks.md`, the two spec deltas, `openspec/config.yaml`
  and `docs/openspec-tasks-mandatory-steps.md`.

## Evidence

- Base of step 1 in `69aa289`: `npm ci` with 0 vulnerabilities, 85 files and 1018 tests passed in 81.37 s under Node 24
  (`node -v` v24.11.0), `npm run typecheck` with 0 errors. Report
  `openspec/changes/codeql-findings/reports/2026-09-30-step-1-base.md`.
- Steps 2.1 to 2.4 and 3.1 to 3.3: the four alerts closed with their tests first. The red at `86b250f` is 4 failed and
  28 passed of 32 in `tests/ingest.test.ts` and `tests/admin-session.test.ts`, and the green after the fixes is 32
  passed of 32; the whole suite is 85 files and 1024 passed in 77.94 s. Report
  `openspec/changes/codeql-findings/reports/2026-09-30-step-2-tests-first.md`.
- Steps 4.1 and 5.1: no existing test weakened or deleted (the diff of the two test files removes only their import
  lines), and the seven checks green at the code of `93dc0ca` — typecheck 0 errors, lint 0 problems, 85 files and 1024
  tests passed in 77.94 s, build compiled in 9.0 s with 30 of 30 static pages, 0 vulnerabilities, gitleaks with no
  leak over 546 commits, openspec 14 of 14. Reports
  `reports/2026-09-30-step-4-existing-tests.md` and `reports/2026-09-30-step-5-checks.md`.
- Steps 6.1, 7.1 and 8.1: the login, the refusal with its lockout and two DOCX uploads verified with `curl.exe` against
  the built application of a clean disposable clone (the passages of the store read `5 &lt; 6` and `5 < 6` as the spec
  asks); the browser suite green in a second clean clone with no `.env` (87 passed in 2.1 min, one worker); and the two
  rows of `docs/security.md` that name this change. Reports `reports/2026-09-30-step-6-curl.md`,
  `reports/2026-09-30-step-7-e2e.md` and `reports/2026-09-30-step-8-docs.md`.
- Step 9.1: the `## Issues` of the last report (BROKEN, RISK, NOT DONE, UNKNOWN) with the five decisions taken by the
  implementer, copied to `design.md` under "Decisions taken by the implementer" and to the delivery document
  `katalis-dev/tasks/entrega-codeql-findings.md`. Report
  `openspec/changes/codeql-findings/reports/2026-09-30-step-8-docs.md`.
- Every box of steps 1 to 9.1 is marked with its report inside the change, and every report names the commit it
  validates.

## Hard rules respected

- No `.env` file with secrets is opened; no push, no remote, no commit on `main`, no archive; the worktrees
  `community`, `community-ins`, `community-ui`, `community-main`, `community-preview` and `community-2zc` are not
  touched, and no process of another agent was stopped.
- No test calls a real provider: the suite of the panel and the browser walks use the deterministic `fake` providers
  and the local doubles of the fixtures.
- No personal path in a versioned file (a report writes `<worktree>` or `<clean clone>`); UTF-8 with LF; `MEMORY.md`
  is in no commit.
- The build, the curl verification and the browser suite ran in disposable clean clones under
  `katalis-dev/community-codeql-curl` and `katalis-dev/community-codeql-e2e`, never in the `<worktree>`, whose ignored
  `.env.local` was never opened. The two clones carry no commit of this round and can be deleted.
- gitleaks ran on every commit through `.githooks/pre-commit` and once over the whole history: no leak.
