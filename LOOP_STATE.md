# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: guided-setup-and-knowledge (OpenSpec), section 10 only
BRANCH: feature/guided-setup-and-knowledge
BASE: 5929b64 (main when the change started)
HEAD AT THE START OF THE ROUND: 49d71ee ("Amend the contract of guided-setup-and-knowledge after the review: green
means usable, files by their bytes, undo clears the sample")
AGENT: DeepSeek (implementer), contract amended by Fable (decisions 14 to 19)
DATE: 2026-09-30

## Objective

Execute section 10 of `openspec/changes/guided-setup-and-knowledge/tasks.md` and nothing else: the amendment after
the FAIL of `katalis-dev/tasks/revision-community-13.md`, with the design decisions 14 to 19. Sections 0 to 9 are
already marked and are not touched. Tests first, red before each fix, one real report per `[x]` inside
`openspec/changes/guided-setup-and-knowledge/reports/`, small commits, gitleaks on every commit, no push, no remote,
no archive, no commit on `main`, no edit of the text of the tasks, of `design.md` or of the specs.

## Progress

- **10.1**: red first: the unit cases of decisions 14, 15 and 16, the browser cases of the four files and the walk
  "from zero to an answer" in Spanish.
- **10.2**: the fixes of decisions 14 to 16 and the ports of decision 17.
- **10.3**: `git diff --check main...HEAD` clean and the checks of 5.1 on the amended tree, each result with its
  commit.
- **10.4**: `CI=1 npm run test:e2e` whole and green in a clean clone.
- **10.5**: the delivery `katalis-dev/tasks/entrega-community-13.md` with its "Ronda 13b" section, one current table
  of results and `## Issues`, and the docs of the ports.

## Hard rules respected

- No `.env` file with secrets is opened; no push, no remote, no commit on `main`, no archive; the worktrees
  `community`, `community-ui`, `community-main` and `community-preview` are not touched.
- No test calls a real provider: the local double of the browser suites, the deterministic providers and the global
  `fetch` of the unit suite.
- No personal path in a versioned file (a report writes `<worktree>`); UTF-8 with LF; `MEMORY.md` is in no commit.
- The real run with the key of DeepSeek is Fable's (decision 18): this round never looks for a key.
- Build, curl and E2E run in a disposable clean clone, never in the working tree, which has an ignored `.env.local`.
