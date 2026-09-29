# LOOP_STATE · Cited

STATUS: DONE
CHANGE: admin-panel-and-onboarding (OpenSpec)
ROUND: section 10 of the contract, tasks 10.1 to 10.5, after the review `revision-community-07`
BRANCH: feature/admin-panel-and-onboarding
BASE: 7c4f4ff (main, "Merge brand-and-design-system"); the change starts at 8c054c1 ("Specify the admin panel and the
first-run assistant")
HEAD AT THE START OF THE ROUND: c289f94 ("Keep one visitor from locking the owner out, and count the trusted proxies",
the contract amended by Fable)
HEAD AT THE END OF THE ROUND: 4aa559e, plus the closing commit that carries this file, the report of step 10, the five
marks and the round of the delivery
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute section 10 of `openspec/changes/admin-panel-and-onboarding/tasks.md`, the one Fable amended after
`revision-community-07`: the Major of the IP lockout and the Major of the trusted proxies, the Minor of
`readBusiness()`, the Minors of the evidence, and the battery of the round. Tests first, red before each fix,
reproducing what the review reproduced. One real report per `[x]` inside the change folder, small commits on the
branch, and the round appended to `katalis-dev/tasks/entrega-community-07.md` in Spanish with its `## Issues`.

## What was delivered

- **10.1**: `TRUST_PROXY` is the number of trusted proxies in front of the application, as the MODIFIED requirement of
  `specs/answering/spec.md` says. `lib/guards/ip.ts` takes the address that many places from the right of
  `x-forwarded-for` (the one the outermost trusted proxy received the request from) and falls back to `x-real-ip` and
  then to nothing; `.env.example`, `docs/answering.md`, `README.md` and `README.es.md` say the same thing, and
  `docs/security.md` and `docs/admin.md` too.
- **10.2**: the lock of the login exists only for a known address; without one no attempt is counted and every failed
  attempt takes at least one second. `ADMIN_PASSWORD` needs sixteen characters or `/admin` and every `/api/admin/*`
  route answer `503` naming the variable and never its value.
- **10.3**: `readBusiness()` answers `null` only when the table is missing and lets every other error through.
- **10.4**: the exact commit in the nine reports that lacked it, the count of the delivery (17 against `main` at
  `57bbeb4`, not 16) and the missing capture `login-375.png` (375 × 812, 9926 bytes).
- **10.5**: the battery on Windows and in a `node:24` Linux container, the manual reproduction of both Majors over
  HTTP, and the round in the delivery with its `## Issues`.

## Evidence

- 11 commits of the round between `c289f94` and `4aa559e`, one per red and one per fix, plus the closing commit.
- Report: `openspec/changes/admin-panel-and-onboarding/reports/2026-09-29-step-10-review-fixes.md`, with the exact
  command, the commit and the output of every task.
- `npm test`: 28 files and 260 tests green on Windows (13.22 s), 258 green and 2 skipped in a `node:24` Linux
  container from a clean clone (v24.21.0, 54.32 s).
- `npm run test:e2e`: 10 tests green, axe without violations. `npm run typecheck`, `npm run lint`,
  `gitleaks git` (258 commits, no leaks), `openspec validate --all --strict` (9 items) and `git diff --check
  main...HEAD`: green. The working tree is clean.
- The manual HTTP reproduction: `/admin` answers `503` for a short password; without `TRUST_PROXY` five failures each
  take a second, the header a client wrote is ignored and the right password answers `200`; with `TRUST_PROXY=2` two
  clients of the same CDN edge and Traefik fall in their own bucket.

## The issues that stay open

- `readBusinessLogo()` keeps the broad `catch` that 10.3 removed from `readBusiness()`: a store that fails answers
  `404` instead of reporting the failure. It is not the finding of the review and the contract names only
  `readBusiness()`, so it is left as it is.
- The one second of an unknown address is per attempt in series, not a global gate: a client that fires many
  concurrent failures spends them in parallel. The requirement is Fable's trade-off, and a shared gate is exactly the
  lock the amendment removed; the sixteen characters are what makes the brute force useless.
- The change is not archived (that needs the explicit OK of Franc), nothing was pushed and nothing was deployed.
- The merge with the parallel lane is not proven: both edit the README and both write the shared language module.
- The panel was not tried with a real provider nor with a remote Turso database.

## Hard rules respected

- No `.env` file was opened (the repository has none: `Test-Path .env` is `False`).
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- The other worktree (`community-ui`, `feature/public-page-and-widget`) was not touched.
- No test calls a real provider: the deterministic `fake` providers ran the suite, the browser flows and the manual
  reproduction.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- The text of no task, of `design.md` or of the specs was edited: only the five checkboxes of section 10.
