# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: guided-setup-and-knowledge (OpenSpec)
BRANCH: feature/guided-setup-and-knowledge
BASE: 5929b64 (main when the change started: the identity of Cited in the panel and the public page, the keys in the
panel, and the voice agent with its codes)
HEAD AT THE START OF THE ROUND: 2a69eb5 ("Write the contract of guided-setup-and-knowledge: from zero to an answer in
four steps, on the identity of Cited")
AGENT: DeepSeek (implementer), contract written by Fable
DATE: 2026-09-30

## Objective

Execute `openspec/changes/guided-setup-and-knowledge/tasks.md` (design decisions 1 to 13) and nothing else: the guided
setup of four steps, the information lane with its uploads and its document page, Try it, Publish with the live
preview, the honest public page and `/privacy`, on the workspace navigation of `brand-identity-ui`. Tests first, one
real report per `[x]` inside `openspec/changes/guided-setup-and-knowledge/reports/`, small commits, no push, no
archive, no edit of the text of the tasks, of `design.md` or of the specs.

## Progress

- **0**: the branch and the base confirmed; `npm ci`.
- Pending: sections 1 to 9 of the contract.

## Evidence

- Reports: `openspec/changes/guided-setup-and-knowledge/reports/2026-09-30-step-N-*.md`.
- Pending.

## Hard rules respected

- No `.env` file with secrets was opened (only the public template `.env.example`); no push, no remote, no commit on
  `main`, no archive; the worktrees `community`, `community-ins`, `community-main` and `community-preview` are not
  touched.
- No test calls a real provider: the local double of `tests/provider-double.ts`, the deterministic providers and the
  global `fetch` of the suite.
- No personal path in a versioned file; UTF-8 with LF; `MEMORY.md` is in no commit.
- The text of no task, of `design.md` or of the specs is edited: the only change in `tasks.md` is the box of each task.
