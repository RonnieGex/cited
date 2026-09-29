# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: admin-panel-and-onboarding (OpenSpec)
ROUND: section 10 of the contract, tasks 10.1 to 10.5, after the review `revision-community-07`
BRANCH: feature/admin-panel-and-onboarding
BASE: 7c4f4ff (main, "Merge brand-and-design-system"); the change starts at 8c054c1 ("Specify the admin panel and the
first-run assistant")
HEAD AT THE START OF THE ROUND: c289f94 ("Keep one visitor from locking the owner out, and count the trusted proxies",
the contract amended by Fable)
HEAD AT THE END OF THE ROUND: the closing commit of this round, which carries this file
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute section 10 of `openspec/changes/admin-panel-and-onboarding/tasks.md`, the one Fable amended after
`revision-community-07`: the Major of the IP lockout and the Major of the trusted proxies, the Minor of
`readBusiness()`, the Minors of the evidence, and the battery of the round. Tests first, red before each fix,
reproducing what the review reproduced. One real report per `[x]` inside the change folder, small commits on the
branch, and the round appended to `katalis-dev/tasks/entrega-community-07.md` in Spanish with its `## Issues`.

## What the round changes

- **10.1**: `TRUST_PROXY` stops being a flag and becomes the number of trusted proxies in front of the application,
  as the MODIFIED requirement of `specs/answering/spec.md` says. `lib/guards/ip.ts` takes the address that many
  places from the right of `x-forwarded-for` (the one the outermost trusted proxy received the request from), and
  `.env.example`, `docs/security.md`, `docs/answering.md` and the two READMEs say the same thing as the code.
- **10.2**: the lock of the login exists only for a known address; without one no attempt locks anybody and every
  failed attempt takes at least one second. `ADMIN_PASSWORD` needs at least sixteen characters or `/admin` and every
  `/api/admin/*` route answer `503` saying so, never with its value.
- **10.3**: `readBusiness()` returns `null` only when the table is missing and lets every other error through.
- **10.4**: the exact commit in every report that lacked it, the count of commits of the delivery, and the missing
  `login-375.png` capture.

## Evidence

- Report of the round: `openspec/changes/admin-panel-and-onboarding/reports/2026-09-29-step-10-review-fixes.md`.
- The battery of task 10.5: `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`,
  `npm run lint`, `npm run test:e2e`, gitleaks, `openspec validate --all --strict` and `git diff --check main...HEAD`.

## The issues that stay open

- Written at the close of the round.

## Hard rules respected

- No `.env` file was opened (the repository has none: `Test-Path .env` is `False`).
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- The other worktree (`community-ui`, `feature/public-page-and-widget`) was not touched.
- No test calls a real provider.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- The text of no task, of `design.md` or of the specs was edited: only the checkboxes of section 10.
