# LOOP_STATE · Cited

STATUS: DONE
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

- **12.1, the Major of the shared answer**: `lib/admin/guard.ts` writes the names of the missing variables to the log
  of the server once per state (`console.error`, `writeOnce()`), keeps them for the two states in `OWNER_WORDS` and
  hands them to `adminProblem()` only when the caller says `installerPage: true`, which `proxy.ts` does only for
  `/admin`. `lib/admin/respond.ts` answers `503` with `panel_not_configured` or `admin_password_too_short` and the
  words of the owner; `app/admin/layout.tsx` stops printing `guarded.missing` and also stops the panel in the
  `short-password` state, which used to fall through to the pages, and links "For the installer". `cb5a558`,
  `0effde0` (red), `2709134` (fix).
- **12.2, the Major of the reader of the state**: `scripts/store-state.ts` writes `store not found: <path>` to stderr
  and exits with code 2 when the file is not there, creating neither the file nor its folder; the reader of a store
  that exists is unchanged (`node:sqlite`, `readOnly: true`). `33c443c` (red), `a978752` (fix).
- **12.3 and 12.4**: every `[x]` of the section is marked in the commit that carries its evidence, gitleaks is
  registered for every commit of the round, and the battery ran on Windows and inside a `node:24` Linux container over
  a copy of the exact tree of the closing commit. The delivery and the state of the loop close with it.

## Evidence

- Report: `openspec/changes/provider-keys-in-panel/reports/2026-09-29-step-12-review-fixes.md`, with the exact command,
  the commit and the output of every task, the red run of each Major in its own commit and the transcription of the
  Windows battery and of the container.
- The two reproductions of the review, now the other way around: every route of `/api/admin/*` answers the code and no
  variable name in an installation that is not finished, every page of `/admin` other than "For the installer" says it
  in the words of the owner, the names reach the log once, and `npm run store:state` over a path that does not exist
  answers `store not found: <path>` with code 2 and creates nothing.
- `npm test`: 56 files and 489 tests green on Windows; 56 files, 487 green and 2 skipped in the `node:24` Linux
  container (v24.21.0) over the exact tree of the closing commit. The two skipped are the ones of
  `tests/design-system.test.ts` that were already skipped on Linux.
- `npm run typecheck`, `npm run lint`, `npm run test:e2e` (30 green), `npm audit --audit-level=high`,
  `openspec validate --all --strict` (11 items), `git diff --check main...HEAD` and gitleaks per commit: green.

## Hard rules respected

- No `.env` file with secrets is opened (the repository has none: `Test-Path .env` is `False`); only the public
  template `.env.example` may be edited, and this round does not need to touch it.
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- The worktrees `community`, `community-ui` and `community-preview` are not touched.
- No test calls a real provider and none opens a real private network: every provider is a local HTTP double.
- `MEMORY.md` is in no commit. No personal path in a versioned file. UTF-8 with LF in every file written.
- The text of no task, of `design.md` or of the specs is edited: the only change in `tasks.md` is the box of each task
  of section 12.
