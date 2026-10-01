# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: passage-display-polish (OpenSpec), Amendment 1, section 10 (tasks 10.1 to 10.5)
BRANCH: feature/passage-display-polish
BASE: 86b250f (main when the change started)
HEAD AT THE START OF THE ROUND: db57d2d ("Amend the contract of passage-display-polish after the review")
AGENT: DeepSeek (implementer), contract by Fable, review by Codex
DATE: 2026-09-30

## Objective

Execute tasks 10.1 to 10.5 of `openspec/changes/passage-display-polish/tasks.md` and nothing else: the four Majors of
`katalis-dev/tasks/revision-passage-display-polish.md` and the decisions 9 to 14 that Fable closed in `db57d2d`.
Steps 0 to 9 are marked and stay untouched; 10.6 (the push, the second review and the acceptance) is not mine. Tests
first, red on `f1ca9df` before each fix, one real report per `[x]` inside the change, small commits, gitleaks on every
commit, no push, no remote, no archive, no commit on `main`, no edit of the text of the tasks, of `design.md` or of
the specs. The build and the E2E run in a disposable clean clone, never opening a `.env.local`. The E2E uses the ports
3100 and 3210 to 3217, and waits while another agent holds them.

## Progress

- **10.1 and 10.2**: the tests of the amendment first, red at the code of `f1ca9df`: the heading text exactly once on
  the section line of the panel, in Try it and on the page of a document; `Precios` as one list with five children;
  the lead node and the highlighter starting after it in Try it and on the page of a document; a body with no line
  break in one paragraph. The assertion of `tests/chat.test.tsx:116` that accepted two headings is corrected to one.
  Report `2026-09-30-step-10-red.md`.
- **10.3**: the four decisions implemented — the citation panel shows the heading only on its section line, the item
  that opens a body no longer opens a list of its own, Try it takes the `lead` of its citation, the page of a
  document computes `leadLength` for every passage and reads `?highlight=`, and a body with no line break stays one
  paragraph. Report `2026-09-30-step-10-implementation.md`.
- **10.4**: the two captures that 7.2 declared NOT DONE (Try it with a cited passage and the page of a document with
  the highlighted passage), in Spanish and in English, at 1440 px and at 375 px, and the five of the public page and
  the widget taken again with `prefers-reduced-motion: reduce`; thirteen images in `reports/images/`. Report
  `2026-09-30-step-10-captures.md`.
- **10.5**: the checks in a clean clone — types, linter, 1055 unit tests, build, audit, 569 commits of gitleaks, 14 of
  14 specifications and 94 browser cases — with the `## Issues` of the round. Report
  `2026-09-30-step-10-amendment.md`.

Every box of section 10.1 to 10.5 is marked with its report inside the change, and every report names the commit it
validates. Box 10.6 stays unchecked: it is Fable's, Codex's and Franc's.

## Evidence

- Unit suite of the amendment in the worktree: 89 files, **1055 tests passed**, 76.50 s, exit 0, at the code of the
  implementation; the same suite at the code of `f1ca9df` is **8 failed and 1047 passed** in three files. The suite
  before the change was 1052 cases: this round adds three.
- Browser suite of a clean clone of `8c99552`: **94 passed** (92 of the round before this one plus the two cases of
  the page of a document with the highlighted passage), 2.0 min, exit 0; the red runs of the same cases at the tests
  commit are 5 failed in the public project, 1 in the project `setup` and 1 in `setup-es`.
- The checks of a clean clone of `28bd86f` (the code of `8c99552`): `npm run typecheck` 0 errors, `npm run lint`
  0 problems, `npm run build` compiles in 22 s with Next.js 16.3.6, `npm run audit:high` 0 vulnerabilities,
  `npm run secrets:scan` 569 commits with no leak, `npm run openspec:validate` 14 passed and 0 failed.
- gitleaks on every commit of the round (`--log-opts="HEAD~1..HEAD"`): no leak.

## Hard rules respected

- No `.env` file with secrets was opened; no push, no remote, no commit on `main`, no archive; the worktrees
  `community`, `community-ins`, `community-ui`, `community-main`, `community-preview` and `community-2zi` were not
  touched, and no process of another agent was stopped: the E2E ran with the ports 3100 and 3210 to 3217 free.
- No test called a real provider: the deterministic providers of the unit suite and the local double of the browser
  suite.
- No personal path in a versioned file (a report writes `<worktree>`, `<clean clone>` or `<scratch>`); UTF-8 with LF;
  `MEMORY.md` is in no commit.
- The build, the captures and the E2E ran in a disposable clean clone, never in the working tree, which has an ignored
  `.env.local` that was never opened.
- The text of the tasks, of `design.md` and of the specs was not edited; only the boxes of the tasks are marked.
