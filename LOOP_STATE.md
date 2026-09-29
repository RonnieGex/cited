# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: provider-keys-in-panel (OpenSpec)
ROUND: section 12 of the contract, tasks 12.1 to 12.4 — what the third review of Codex reproduced
BRANCH: feature/provider-keys-in-panel
BASE: c07640b (main when the change started, "Write the product context of Cited: the owner, the visitor, and what the
design must honour"); the change starts at 71f08f0 ("Specify the keys in the panel: connect your AI without touching
the server"). `main` has moved since (now `03101b6`, "Merge elevenlabs-voice-agent"); the base of this change stays
`c07640b`
HEAD AT THE START OF THE ROUND: 287539e ("Amend the keys contract after the third review: an unfinished installation
names no variable, and the state reader fails on a missing store")
HEAD AT THE END OF THE ROUND: the closing commit that carries this file, the report of section 12 and the four marks
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Close the findings of `katalis-dev/tasks/revision-community-12c.md` (the third adversarial review of Codex, FAIL):

- **M-1 (Major):** the shared constructor of administrative errors (`lib/admin/respond.ts`) answered `503` with the
  names of the missing variables in its JSON, and `app/admin/layout.tsx` printed `guarded.missing`, so `/admin/ai`,
  `/admin/business`, `/admin/conversations` and `/admin/documents` could name a variable of the environment. The new
  scenario "An installation that is not finished" of the requirement "The owner never reads a variable name in an
  answer of the panel" forbids it: the route answers `503` with the code `panel_not_configured` or
  `admin_password_too_short` and the words of the owner, the names go once to the server log (`console.error`) and stay
  on "For the installer".
- **M-2 (Major):** `npm run store:state -- <path>` treated a file that does not exist as a success (exit code 0). It
  must exit with code 2 and write `store not found: <path>` to stderr, creating nothing, and an existing file must keep
  its SHA-256.
- **Minor:** every `[x]` of section 12 is marked in the same commit as the evidence it cites, the Linux container run
  included, and the gitleaks table of the report lists every commit of the round up to the final HEAD.

Tests first and red before each fix, reproducing what the review reproduced.

## What was delivered

- Pending: the round is running.

## Evidence

- Pending: the report `openspec/changes/provider-keys-in-panel/reports/2026-09-29-step-12-review-fixes.md` is written
  part by part, one part per commit of the round, with the exact command, the commit and the output of every task.

## Hard rules respected

- No `.env` file with secrets is opened (the repository has none: `Test-Path .env` is `False`); only the public
  template `.env.example` may be edited, and this round does not need to touch it.
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- The worktrees `community`, `community-ui` and `community-preview` are not touched.
- No test calls a real provider and none opens a real private network: every provider is a local HTTP double.
- `MEMORY.md` is in no commit. No personal path in a versioned file. UTF-8 with LF in every file written.
- The text of no task, of `design.md` or of the specs is edited: the only change in `tasks.md` is the box of each task
  of section 12.
