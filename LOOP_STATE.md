# LOOP_STATE · Cited

STATUS: DONE
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

- **12.1**: the red cases of decision 23 in `ad035b6` (8 failed | 78 passed of 86 in the five amended files), and the
  fix in `ba42e4b` (the constructor throws), `dcbda77` (the resolver checks the catalogue and resolves the unknown name
  with a problem), `f40465a` (step 1 asks for attention), `f140f26` (the words of the owner in both languages) and
  `fb63bb6` (one catalogue lookup); report `reports/2026-09-30-step-12-1-no-silent-fake.md`.
- **12.2**: `git diff --check` clean in `643f141` (the blank line `b55dc5e` left at the end of the tasks); the checks of
  10.3 with the browser suite of 10.4 at the code of `fb63bb6`, measured at `fb63bb6` and `ff256dc`; report
  `reports/2026-09-30-step-12-2-checks.md`. The delivery `katalis-dev/tasks/entrega-community-13.md` carries the section
  "Ronda 13d" with the only current table of results and its `## Issues` (this closing commit).

Every box of section 12 is marked with its report inside the change, and every report names the commit it validates.

## Evidence

- Windows, twice, at the code of `fb63bb6`, with Node 24.21.0: 85 files and 1011 tests passed, 65.65 s and 65.93 s.
- The `node:24` container over a clean clone, with its own `npm ci`: Node 24.21.0, 85 files, 1009 passed and the 2 cases
  that only measure on Windows skipped, 134.50 s.
- `CI=1 npm run test:e2e` over a second clean clone at `ff256dc`: 86 passed, 0 failed, 1.7 min, with the two walks timed
  by themselves (1.8 s in English, 1.1 s in Spanish); `git status --short` empty afterwards and the 14 captures of the
  run under `test-results/captures/`, which `.gitignore` excludes.
- `git diff --check main...HEAD` clean, `eslint` 0 problems, `tsc --noEmit` 0 errors, `npm audit --audit-level=high`
  0 vulnerabilities, gitleaks 515 commits with no leak, `openspec validate --all --strict` 13 of 13.
- The finding of the review: the Major M-8 is closed. An unknown provider of the panel or of the server resolves with a
  problem, step 1 asks for attention in both languages, `chatModelFrom()` throws for any name outside the catalogue and
  the answers path refuses the resolution before it builds a model, so no answer comes from the test double.

## Hard rules respected

- No `.env` file with secrets was opened; no push, no remote, no commit on `main`, no archive; the worktrees
  `community`, `community-ui`, `community-main` and `community-preview` were not touched.
- No test called a real provider: the deterministic providers of the unit suite and the local double the two browser
  walks serve on port 3216.
- No personal path in a versioned file (a report writes `<worktree>` or `<clean clone>`); UTF-8 with LF; `MEMORY.md` is
  in no commit.
- The build, the E2E and the container ran in disposable clean clones, never in the working tree, which has an ignored
  `.env.local` that was never opened.
- The real run with the key of DeepSeek is Fable's (decision 18): this round never looked for a key and never used one.
