# LOOP_STATE · Cited

STATUS: DONE
CHANGE: passage-display-polish (OpenSpec), Amendment 4, section 13 (tasks 13.1 to 13.4)
BRANCH: feature/passage-display-polish
BASE: 86b250f (main when the change started); main (`e52e527`) is already merged into the branch at `54c61eb`
HEAD AT THE START OF THE ROUND: 1a08b0f ("Amend the contract of passage-display-polish a fourth time: a cut at a line break, a frozen golden corpus")
AGENT: DeepSeek (implementer), contract by Fable, review by an independent session
DATE: 2026-09-30 (the checks of 13.4 ran in the first minutes of 2026-10-01, machine clock)

## Objective

Execute tasks 13.1 to 13.4 of `openspec/changes/passage-display-polish/tasks.md` and nothing else: the frozen golden
corpus of decision 23 (frozen copies of the files of `samples/`, of the Markdown files of `docs/` as they were on
`86b250f`, of the two documents the review named and of the synthetic cases) written once from the chunker of `86b250f`
with its command in the report and red on `54c61eb` (13.1); the `cut()` of decision 22 (13.2); the golden test reading
no live file of `docs/` or of the archive, with the old fixture over live documents replaced and not kept beside it
(13.3); and the checks of the round on the branch, which already carries `main`, in
`reports/2026-10-01-step-13-amendment.md` naming the commit verified, with the `## Issues` of the round there and in
the section "Ronda 5" of the delivery (13.4). Steps 0 to 12 are marked and stay untouched; 13.5 (the push, the fifth
review and the acceptance) is not mine.

Small commits, gitleaks on every commit, no push, no remote, no commit on `main`, no archive, no edit of the text of
the tasks, of `design.md` or of the specs. The build and the E2E run in a disposable clean clone with no `.env`, never
opening a `.env.local`. The E2E uses the ports 3100 and 3210 to 3217, and waits while another agent holds them. No test
calls a real provider.

## Progress

- **13.1**: `tests/fixtures/chunk-golden/inputs/` holds the 30 frozen files of decision 23 (19 Markdown of `docs/` and
  the 4 of `samples/` as they were on `86b250f`, the two documents of the fourth review, and 5 synthetic cases); the
  copies came from `git archive 86b250f` and all 25 of them match `git rev-parse 86b250f:<path>` byte for byte.
  `scripts/chunk-golden.mts` reads only those copies, and `tests/fixtures/chunker-golden.json` was written once from
  the chunker of `86b250f` (30 files, 385 passages) with the command named in the report. The check is red on the
  chunker of `54c61eb` (blob `7774c199…`): the first difference is
  `openspec/changes/archive/2026-09-29-core-hybrid-search/reports/2026-09-29-step-9-docs.md`, passage 2, and 4 of the
  30 files differ. Decision 24 was verified with the chunker of `c2f5d2a`: the check names `docs/admin.md, passage 1`
  where the old one named the `min` of the counts (passage 30). The report is
  `reports/2026-09-30-step-13-corpus.md`.
- **13.2**: `cut()` takes the last space **or line break** before the cut (decision 22, one line). The golden check is
  green, the list tests of the change are green (4 files, 46 tests), the 30 files of the corpus are identical to
  `86b250f` (`{"files":30,"same":30,"differ":0}`) and an independent fuzz of 5,000 documents goes from 312 moved
  documents to 0, with no document without a list moving in either run.
- **13.3**: the golden check reads no live file: it builds every path from `tests/fixtures/chunk-golden/inputs/` and
  from the fixture, the old fixture over live documents was replaced at the same path, and with a line appended to the
  live `docs/security.md` and to the live `…2026-09-29-step-9-docs.md` the check stays green (2 of 2). The report of
  13.2 and 13.3 is `reports/2026-09-30-step-13-cut.md`.
- **13.4**: the checks ran in a clean clone of `c93c1ff` with no `.env`: `npm run typecheck` exit 0, `npm run lint`
  exit 0, `npx -y -p node@24 node node_modules/vitest/vitest.mjs run` **90 files and 1067 tests** in 80.96 s (Node
  `v24.21.0`), `npm test` **1067 tests** in 37.55 s, `npm run openspec:validate` 14 passed and 0 failed,
  `npm run build` exit 0 and `CI=1 npm run test:e2e -- --reporter=list` **96 passed** in 2.5 min with no flaky. The
  report is `reports/2026-10-01-step-13-amendment.md`.

Every box of section 13.1 to 13.4 is marked in the same commit as its report, and every report names the commit it
validates. Box 13.5 stays unchecked: it is Fable's, the reviewer's and Franc's.

## Close

STATUS: DONE. The two Majors of `katalis-dev/tasks/revision-passage-display-polish-d.md` are closed and measured (the
cut at a list join and the golden check over frozen copies), the four boxes of the section are marked with their
reports, and the round is delivered in the section "Ronda 5" of `katalis-dev/tasks/entrega-passage-display-polish.md`.
The commits of the round, in order: `56f0c23` (this state in RUNNING), `18c49c1` (the frozen corpus, the fixture and
the test), `dd4aa4c` (the red on `54c61eb` and the box 13.1), `5fe6fa5` (the cut of decision 22), `f7c8ac9` (the green,
the check that reads no live file and the boxes 13.2 and 13.3), `c93c1ff` (a trailing space of a report), `3e5f87a`
(the checks of the round and the box 13.4) and the commit that carries this state, with STATUS in DONE.

## Evidence

- The corpus of decision 23: 30 files and 385 passages, written once from the chunker of `86b250f` (blob
  `0a647e68106bf600c230e23b26e1c18e6247d4fa`); the 25 copies verified against `git rev-parse 86b250f:<path>` with 0
  differences; red on the chunker of `54c61eb` in 4 files and green on the branch in all 30
  (`reports/2026-09-30-step-13-corpus.md`, `reports/2026-09-30-step-13-cut.md`).
- The cut of decision 22: the corpus `{"files":30,"same":30,"differ":0}` and the fuzz of 5,000 documents from 312
  moved to 0, none of them without a list.
- The check of decision 24: with the chunker of `c2f5d2a` the first difference named is `docs/admin.md, passage 1`
  (30 against 33 passages), where the old check returned the `min` of the counts.
- The golden check reads no live file: `tests/chunk-golden.test.ts` and `scripts/chunk-golden.mts` name `docs/`,
  `samples/` or the archive in comments only, and the check stayed green (2 of 2) with two live documents edited.
- The checks of a clean clone of `c93c1ff`: typecheck 0, lint 0, **1067 of 1067 tests** in 90 files (80.96 s, Node
  `v24.21.0`), `npm test` 1067 tests (37.55 s), `openspec validate` 14 of 14, build 0, **96 of 96 browser tests** in
  2.5 min with no flaky (`reports/2026-10-01-step-13-amendment.md`).
- gitleaks on every commit of the round (`--log-opts="HEAD~1..HEAD"`) and on the seven that came before this state
  (`1a08b0f..HEAD`): `no leaks found` in all of them, and the commit of this state scanned on its own as well;
  `git diff --check 86b250f...HEAD` exit 0.
- The contract did not change: the blobs of `design.md`, `proposal.md` and the five deltas are the same as in
  `1a08b0f`, and `tasks.md` differs only in the boxes of 13.1 to 13.4.

## Hard rules respected

- No `.env` file with secrets was opened; no push, no remote, no commit on `main`, no archive; the worktrees
  `community`, `community-ins`, `community-ui`, `community-main`, `community-preview`, `community-2p` and `community-2zi`
  were not touched, and no process of another agent was stopped (the ports 3100 and 3210 to 3217 were free before the
  browser suite and the suite served its own doubles).
- No test called a real provider: the deterministic providers of the unit suite and the local double of the browser
  suite.
- No personal path in a versioned file (a report writes `<worktree>`, `<clean clone>` or `<scratch>`); UTF-8 with LF;
  `MEMORY.md` is in no commit.
- The build and the E2E ran in a disposable clean clone with no `.env` and no `.env.local`, never in the working tree,
  which has an ignored `.env.local` that was never opened.
- The text of the tasks, of `design.md` and of the specs was not edited; only the boxes of 13.1 to 13.4 were marked.
