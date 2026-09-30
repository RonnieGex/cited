# LOOP_STATE · Cited

STATUS: DONE
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

## Progress

- **11.1**: the red cases and the fixes of decisions 20 to 22 — the cases in `4163b79`, the fix of the rule of step 1,
  the ZIP reader and the captures folder in `3a58b2a`; report `reports/2026-09-30-step-11-1-amendment.md`.
- **11.1, ZIP64**: the document of Word written with the 64-bit directory, red in `b20c7b9` and green in `cb10c81`.
- **11.1, strict reading of decision 20**: a provider that cannot answer needs attention with or without a test, red in
  `7ddce38` and green in `af14a9b`.
- **11.2**: `git diff --check` clean (`d99e1a0`) and the checks of 5.1 with the browser suite of 10.4 at the code of
  `af14a9b`; report `reports/2026-09-30-step-11-2-checks.md`. The delivery `katalis-dev/tasks/entrega-community-13.md`
  carries the section "Ronda 13c" with the only current table of results and its `## Issues` (this closing commit).

Every box of section 11 is marked with its report inside the change, and every report names the commit it validates.

## Evidence

- Windows, twice, at the code of `af14a9b`, with Node 24.21.0: 85 files and 1003 tests passed, 59.22 s and 59.92 s.
- The `node:24` container over a clean clone, with its own `npm ci`: Node 24.21.0, 85 files, 1001 passed and the 2
  cases that only measure on Windows skipped, 21.56 s.
- `CI=1 npm run test:e2e` over a clean clone: 86 passed, 0 failed, 1.7 min, with the two walks timed by themselves
  (1.8 s in English, 1.1 s in Spanish); `git status --short` empty afterwards and the 14 captures of the run under
  `test-results/captures/`, which `.gitignore` excludes.
- `git diff --check main...HEAD` clean, `eslint` 0 problems, `tsc --noEmit` 0 errors, `npm audit --audit-level=high`
  0 vulnerabilities, gitleaks 504 commits with no leak, `openspec validate --all --strict` 13 of 13.
- The three findings of the review: the Major M-7 and the Minors m-4 and m-5 are closed; m-6 (a backslash in a file
  name) is kept by decision 22.

## Hard rules respected

- No `.env` file with secrets was opened; no push, no remote, no commit on `main`, no archive; the worktrees
  `community`, `community-ui`, `community-main` and `community-preview` were not touched.
- No test calls a real provider: the deterministic providers of the unit suite and the local double the two browser
  walks serve on port 3216.
- No personal path in a versioned file (a report writes `<worktree>` or `<clean clone>`); UTF-8 with LF; `MEMORY.md` is
  in no commit.
- The build, the E2E and the containers ran in disposable clean clones, never in the working tree, which has an ignored
  `.env.local` that was never opened.
- The real run with the key of DeepSeek is Fable's (decision 18): this round never looked for a key and never used one.
