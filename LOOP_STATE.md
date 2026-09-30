# LOOP_STATE · Cited

STATUS: DONE
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

- **0**: the branch and the base confirmed; `npm ci` (`e401e0f` carries the tests of step 2).
- **1**: the state of the base before: the suite, the checks and the store.
- **2.1**: the unit and route tests of decisions 2, 3, 4 and 6, with the red run of the eight interface cases.
- **2.2**: the browser suite of the eight scenarios, the walk timed end to end, the axe check of every page in both
  languages and the captures; green in its seventh full run, after finding four real defects (`10ec582`).
- **3.1 to 3.5**: the welcome and the lane, the information with its document page, Try it, Publish with the live
  preview, and the honest public page with `/privacy` (`fba4208`).
- **4.1**: the cases of the rounds before this one that the new navigation, the new pages and the new answer of an
  upload moved (`fba4208`).
- **5.1**: the suite on Windows and in a `node:24` container, typecheck, lint, audit, gitleaks, openspec and
  `git diff --check`.
- **6.1**: `build`, `start` and the `curl` of `/admin`, `/`, `/embed` and `/privacy` in a clean clone of the commit,
  in both languages and in both states.
- **7.1**: the browser suite green (78 passed), "from zero to an answer" in 1.8 s of scripted time, and the captures
  at 1440 and 375 px.
- **8.1**: the state of the store after: one table added (`setup_flags`) and no count moved.
- **9.1 and 9.2**: `docs/owner-guide.md`, the README and its twin, and
  `katalis-dev/tasks/entrega-community-13.md`.

Every box of the contract is marked with its report inside the change.

## Evidence

- Reports: `openspec/changes/guided-setup-and-knowledge/reports/2026-09-30-step-N-*.md`, one per step.
- The suite of this change: 78 cases green in the five files of step 2.
- The whole suite on Windows: 971 passed, and the two known cases of `tests/personal-paths.test.ts`, which are the
  absolute path of decision 1 of `design.md`, whose text this round may not edit.
- The whole suite in the `node:24` container on a clean clone: 969 passed, the same two cases.
- The browser suite: 78 passed, 0 failed, with axe at 0 violations on every new page in both languages.
- The delivery: `katalis-dev/tasks/entrega-community-13.md`, with the real time per step and `## Issues`.

## Hard rules respected

- No `.env` file with secrets was opened (only the public template `.env.example`); no push, no remote, no commit on
  `main`, no archive; the worktrees `community`, `community-ui`, `community-main` and `community-preview` are not
  touched.
- No test calls a real provider: the local double of `tests/provider-double.ts`, the deterministic providers, the
  global `fetch` of the suite and the local double of `e2e/setup.spec.ts`.
- No personal path in a versioned file; UTF-8 with LF; `MEMORY.md` is in no commit.
- The text of no task, of `design.md` or of the specs is edited: the only change in `tasks.md` is the box of each task.
- The build, the `curl` and the store of the round were read in a disposable clean clone of the commit and never in
  the working tree, which has an ignored `.env.local`.
