# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: guided-setup-and-knowledge (OpenSpec), section 12 only
BRANCH: feature/guided-setup-and-knowledge
BASE: 5929b64 (main when the change started)
HEAD AT THE START OF THE ROUND: b55dc5e ("Amend the contract of guided-setup-and-knowledge a third time: no silent fake,
an unknown provider needs attention")
AGENT: DeepSeek (implementer), contract amended by Fable (decision 23)
DATE: 2026-09-30

## Objective

Execute section 12 of `openspec/changes/guided-setup-and-knowledge/tasks.md` and nothing else: the third amendment
after the FAIL of `katalis-dev/tasks/revision-community-13c.md`, with the design decision 23. Sections 0 to 11 were
already marked and were not touched. Tests first, red before each fix, one real report per `[x]` inside the change,
small commits, gitleaks on every commit, no push, no remote, no archive, no commit on `main`, no edit of the text of the
tasks, of `design.md` or of the specs.

## Progress

- **12.1**: in progress. The red cases and the fix of decision 23: an unknown provider of the panel or of the server
  resolves with a problem, step 1 asks for attention in both languages and `chatModelFrom()` throws instead of building
  the test double in silence — report: `reports/2026-09-30-step-12-1-no-silent-fake.md`.
- **12.2**: pending. The checks of 10.3 and the E2E of 10.4 on the amended tree, and the delivery with a section
  "Ronda 13d" — report: `reports/2026-09-30-step-12-2-checks.md`.

## Evidence

- Pending: the red runs are being written and measured now.

## Hard rules respected

- No `.env` file with secrets was opened; no push, no remote, no commit on `main`, no archive; the worktrees
  `community`, `community-ui`, `community-main` and `community-preview` were not touched.
- No test calls a real provider: the deterministic providers of the unit suite and the local double the two browser
  walks serve on port 3216.
- No personal path in a versioned file (a report writes `<worktree>` or `<clean clone>`); UTF-8 with LF; `MEMORY.md` is
  in no commit.
- The build, the E2E and the containers run in disposable clean clones, never in the working tree, which has an ignored
  `.env.local` that is never opened.
- The real run with the key of DeepSeek is Fable's (decision 18): this round never looks for a key and never uses one.
