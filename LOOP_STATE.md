# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: guided-setup-and-knowledge (OpenSpec), section 11 only
BRANCH: feature/guided-setup-and-knowledge
BASE: 5929b64 (main when the change started)
HEAD AT THE START OF THE ROUND: 9d731f6 ("Amend the contract of guided-setup-and-knowledge again: one rule for step 1, a
ZIP is not a DOCX, a clean tree after the browser suite")
AGENT: DeepSeek (implementer), contract amended by Fable (decisions 20 to 22)
DATE: 2026-09-30

## Objective

Execute section 11 of `openspec/changes/guided-setup-and-knowledge/tasks.md` and nothing else: the second amendment
after the FAIL of `katalis-dev/tasks/revision-community-13b.md`, with the design decisions 20 to 22. Sections 0 to 10
were already marked and were not touched. Tests first, red before each fix, one real report per `[x]` inside the change,
small commits, gitleaks on every commit, no push, no remote, no archive, no commit on `main`, no edit of the text of the
tasks, of `design.md` or of the specs.

## The three findings of the review

- **Major M-7**: a chat provider saved in the panel whose key can no longer be read (`keyState: "unreadable"`,
  `chatProblem() !== null`) kept step 1 `verified`. Decision 20 gives step 1 one rule whatever the source.
- **Minor m-4**: a valid ZIP renamed `.docx` was classified as a DOCX by its `PK\x03\x04` head and the owner read the
  generic failure. Decision 21: a ZIP is a DOCX only when its archive holds `word/document.xml`.
- **Minor m-5**: the green browser suite rewrote four tracked PNGs under `docs/images/admin/` and left its clone dirty.
  Decision 22: the suite writes its captures to an ignored folder and never over a tracked image.

## Progress

- The round is open: the state of the loop and its rules are this file.

## Hard rules respected

- No `.env` file with secrets is opened; no push, no remote, no commit on `main`, no archive; the worktrees
  `community`, `community-ui`, `community-main` and `community-preview` are not touched.
- No test calls a real provider: the deterministic providers of the unit suite and the local double the two browser
  walks serve on port 3216.
- No personal path in a versioned file (a report writes `<worktree>` or `<clean clone>`); UTF-8 with LF; `MEMORY.md` is
  in no commit.
- The build, the E2E and the containers run in disposable clean clones, never in the working tree, which has an ignored
  `.env.local` that was never opened.
- The real run with the key of DeepSeek is Fable's (decision 18): this round never looks for a key and never uses one.
