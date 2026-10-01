# LOOP_STATE · Cited

STATUS: DONE
CHANGE: passage-display-polish (OpenSpec), steps 1 to 9.1
BRANCH: feature/passage-display-polish
BASE: 86b250f (main when the change started)
HEAD AT THE START OF THE ROUND: dbc324f ("Contract of passage-display-polish: a cited passage reads as its document
says it")
AGENT: DeepSeek (implementer), contract by Fable
DATE: 2026-09-30

## Objective

Execute tasks 1 to 9.1 of `openspec/changes/passage-display-polish/tasks.md` and nothing else. Steps 0, 9.2, 9.3 and
9.4 are not mine. Tests first, red before each fix, one real report per `[x]` inside the change, small commits,
gitleaks on every commit, no push, no remote, no archive, no commit on `main`, no edit of the text of the tasks, of
`design.md` or of the specs. The build, `curl.exe` and the E2E run in a disposable clean clone, never opening a
`.env.local`. The E2E uses the ports 3100 and 3210 to 3217, and waits while another agent holds them.

## Progress

- **1.1 and 1.2**: the base measured in a clean clone and the passages of the sample corpus before the change;
  reports `2026-09-30-step-1-base.md` and `2026-09-30-step-1-corpus.md`. Green: 85 files, 1018 tests, 83.39 s, 87
  browser cases in 2.0 min, Node 24.11.0.
- **2.1 to 2.7**: six files and ten red cases of the new behaviour, 39 green of the behaviour the same files already
  pinned; report `2026-09-30-step-2-red.md`.
- **3.1 to 3.7**: the eight decisions of `design.md` implemented — the chunker keeps the lines of a list,
  `lib/answer/lead.ts` and `components/chat/PassageBody.tsx` hold the pure helpers and the one view, every citation
  carries `lead`, `Try it` shows the citation's number, the document page shows no mark, the suggestions come first
  from the documents of the panel's language and the Spanish name is "configuración guiada"; report
  `2026-09-30-step-3-implementation.md`. Whole suite: 89 files, 1051 tests.
- **4.1**: the existing tests reviewed and the expectations that the new behaviour invalidates updated, each one with
  its reason; report `2026-09-30-step-4-existing-tests.md`.
- **5.1 and 5.2**: typecheck, lint, 1052 unit tests, build, audit, secrets scan and `openspec:validate` (14 of 14) in a
  clean clone; the corpus after the change differs from the baseline in the three passages with a list and in nothing
  else, and the four searches return the same passages in the same order; report `2026-09-30-step-5-checks.md`.
- **6.1**: two `curl.exe` requests of `POST /api/ask` against a real server of a clean clone, with `lead` on their
  citations; report `2026-09-30-step-6-curl.md`.
- **7.1 to 7.3**: the four scenarios of the delta measured in a browser at 1440 px and at 375 px, in Spanish and in
  English, on the public page and in the widget, the citation's number in `Try it`, the list and the absence of a mark
  on the page of a document, and the suggestions of the Spanish panel; five captures for the review; the whole suite
  passes with 92 cases in 2.0 min; report `2026-09-30-step-7-e2e.md`.
- **8.1 and 9.1**: the documentation follows the change and the `## Issues` of the change is written with the six
  decisions taken by the implementer; report `2026-09-30-step-9-issues.md`.

Every box of steps 1 to 9.1 is marked with its report inside the change, and every report names the commit it
validates. Steps 9.2, 9.3 and 9.4 stay unchecked: they are Fable's, Codex's and Franc's.

## Evidence

- Unit suite of the change in a clean clone of `fc8af39`: 89 files, **1052 tests passed**, 79.68 s, exit 0. The base was
  1018 tests in 85 files: the change adds 34 cases in four files.
- Browser suite of a clean clone of `308cb05`: **92 passed** (87 of the base plus five of
  `e2e/passage-display.spec.ts`), 2.0 min, 132 s of wall clock, exit 0; `git status --short` empty afterwards and the
  five captures under `test-results/captures/passage-display/`, which `.gitignore` excludes.
- `npm run typecheck` and `npm run lint`: 0 problems. `npm run build`: compiles in 24 s with Next.js 16.3.6.
  `npm run audit:high`: 0 vulnerabilities. `npm run secrets:scan`: 547 commits, no leak.
  `npm run openspec:validate`: 14 passed, 0 failed.
- The corpus before and after: 4 documents and 11 passages, the same order, the same positions and the same headings;
  only the three passages with a list changed, and only by their line breaks. The four searches of
  `tests/search.test.ts` return the same passages in the same order with the same scores.
- Two questions of `POST /api/ask` answered by a real server of the clean clone with the deterministic providers, each
  citation with `lead`.

## Hard rules respected

- No `.env` file with secrets was opened; no push, no remote, no commit on `main`, no archive; the worktrees
  `community`, `community-ins`, `community-ui`, `community-main`, `community-preview` and `community-2zi` were not
  touched, and no process of another agent was stopped: the E2E waited while the servers of the worktree `community-e2e`
  held the ports 3100, 3211, 3213, 3214, 3215 and 3217.
- No test called a real provider: the deterministic providers of the unit suite, the local double of the browser suite
  and `CHAT_PROVIDER=fake` for the manual questions.
- No personal path in a versioned file (a report writes `<worktree>`, `<clean clone>` or `<scratch>`); UTF-8 with LF;
  `MEMORY.md` is in no commit.
- The build, the `curl.exe` and the E2E ran in disposable clean clones, never in the working tree, which has an ignored
  `.env.local` that was never opened.
- The text of the tasks, of `design.md` and of the specs was not edited; only the boxes of the tasks are marked.
