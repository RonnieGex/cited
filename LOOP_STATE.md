# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: provider-keys-in-panel (OpenSpec)
ROUND: section 11 of the contract, tasks 11.1 to 11.6 — what the second review of Codex reproduced
BRANCH: feature/provider-keys-in-panel
BASE: c07640b (main, "Write the product context of Cited: the owner, the visitor, and what the design must honour"); the
change starts at 71f08f0 ("Specify the keys in the panel: connect your AI without touching the server")
HEAD AT THE START OF THE ROUND: ca59b1f ("Put the obligation of the pinned address in the first line of its
requirement")
HEAD AT THE END OF THE ROUND: the closing commit that carries this file, the report of section 11 and the six marks
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Close the findings of `katalis-dev/tasks/revision-community-12b.md` (the second adversarial review of Codex, FAIL):
the four Majors — M-1 (the hexadecimal form of an IPv4 mapped into IPv6 evades the classification), M-2 (the address
that was validated is not the address that is connected to: a DNS that changes its answer between the guard and the
request reaches an internal service with the customer key in the header), M-3 (the test and save routes name
`ALLOW_LOCAL_PROVIDERS` in their JSON, outside "For the installer") and M-4 (`scripts/store-state.ts` opens the store
with the application, which creates and migrates it, so the "before" it prints is the state after the current schema)
— and the Minor of the delivery (a closing hash and a commit count that do not describe the HEAD that ships). Tests
first and red before each fix, reproducing what the review reproduced, with the two new requirements of the spec
delta: "The address that was validated is the address that is connected to" and "The owner never reads a variable name
in an answer of the panel".

## What was delivered

- Work in progress: the round has started; this file is written with `STATUS: RUNNING` before the first fix.

## Evidence

- Pending: `openspec/changes/provider-keys-in-panel/reports/2026-09-29-step-11-review-fixes.md` will carry the command,
  the commit and the output of every task of this section.

## The issues that stay open

- The round is running; nothing is closed yet.
- No test calls a real provider and none opens a real private network: the doubles listen on `127.0.0.1` and every
  resolution that decides something is a controlled double.
- The change is not archived (that needs the explicit OK of Franc), nothing was pushed and nothing was deployed.

## Hard rules respected

- No `.env` file with secrets is opened (the repository has none); only the public template `.env.example` is edited.
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- `community`, `community-ui` and `community-preview` are not touched by this round.
- `MEMORY.md` goes in no commit. No personal path in a versioned file. UTF-8 with LF in every file written.
- The text of no task, of `design.md` or of the specs is edited: the only change in `tasks.md` is the box of each task
  of section 11.
