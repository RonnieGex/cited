# LOOP_STATE · Cited

STATUS: DONE
CHANGE: passage-display-polish (OpenSpec), Amendment 3, section 12 (tasks 12.1 to 12.5)
BRANCH: feature/passage-display-polish
BASE: 86b250f (main when the change started)
HEAD AT THE START OF THE ROUND: bb79565 ("Amend the contract of passage-display-polish a third time: the chunker cuts as on main")
AGENT: DeepSeek (implementer), contract by Fable, review by an independent session
DATE: 2026-09-30

## Objective

Execute tasks 12.1 to 12.5 of `openspec/changes/passage-display-polish/tasks.md` and nothing else: the golden fixture of
decision 19 written from the chunker of `86b250f` with its command in the report and its unit test red on `c2f5d2a`
(12.1), the chunker of decision 18 (12.2), the lead fixture of decision 20 without a `---` line (12.3), the correction
of `docs/answering.md` and of the comments of the code that decision 21 asks for (12.4), and the checks of the round
with their report naming the commit they verified (12.5). Steps 0 to 11 are marked and stay untouched; 12.6 (the push,
the fourth review and the acceptance) is not mine. Small commits, gitleaks on every commit, no push, no remote, no
archive, no commit on `main`, no edit of the text of the tasks, of `design.md` or of the specs. The build and the E2E
run in a disposable clean clone, never opening a `.env.local`. The E2E uses the ports 3100 and 3210 to 3217, and waits
while another agent holds them.

## Progress

- **12.1**: `scripts/chunk-golden.mts` wrote `tests/fixtures/chunker-golden.json` from the chunker of `86b250f` over
  the 23 Markdown and text files of `docs/` and `samples/` (345 passages), and `tests/chunk-golden.test.ts` requires
  the chunker of the branch to return the same passages once the `\n` of a list join is read as a space. Red on
  `c2f5d2a`: the first difference is `docs/admin.md` at position 30 (33 passages against 30). The branch moved 21 of
  the 23 files and returned 377 passages; the report is `reports/2026-09-30-step-12-golden.md`.
- **12.2**: `lib/ingest/chunk.ts` cuts a block at every blank line again, as on `main`, and only the join of a part
  that opens with a list item changes (decision 18). The golden test is green (`moved 0`), the list tests are green,
  and the whole unit suite is green (90 files, 1057 tests). One expectation of `tests/answer-lead.test.ts` changed
  because its old fixture passed through the Major; the reason and the measurement are in
  `reports/2026-09-30-step-12-chunker.md`.
- **12.3**: the two fixtures of decision 15 lost their `---` line, so the paragraph that overflows the passage before
  it cuts them; their passages and their `lead` (52 and 50) are printed in `reports/2026-09-30-step-12-lead.md`. The
  mutant `lead={0}` in `TryItPanel` and in `DocumentPanel` fails the two browser cases (2 failed, 17 passed) and the
  same command without the mutant is green (21 passed).
- **12.4**: `docs/answering.md`, `lib/answer/lead.ts`, `components/chat/PassageBody.tsx`,
  `components/setup/DocumentPanel.tsx` and the comments of two test files say what the overlap of the chunker does: it
  never reaches a passage. The golden fixture was written again with the same command over the same `86b250f` chunker,
  because `docs/answering.md` is one of its 23 files (2 entries changed). The report is
  `reports/2026-09-30-step-12-words.md`.
- **12.5**: the checks of the round in a clean clone of `2a28874`, in
  `reports/2026-09-30-step-12-amendment.md`, with the `## Issues` of the round there and in the section "Ronda 4" of
  the delivery.

Every box of section 12.1 to 12.5 is marked with its report inside the change, and every report names the commit it
validates. Box 12.6 stays unchecked: it is Fable's, the reviewer's and Franc's.

## Close

STATUS: DONE. The five boxes of section 12 are marked with their report and their commit, the Major of the review is
closed and measured (the golden fixture green, the documents of the repository returning the 345 passages of the base,
the fixture of decision 15 red against the mutant and green on the branch), and the round is delivered in the section
"Ronda 4" of `katalis-dev/tasks/entrega-passage-display-polish.md`. The commits of the round, in order: `86654a7` (this
state in RUNNING), `60e42d3` (the golden fixture and its test), `5533ae9` (the red on the branch and the box 12.1),
`b65bb97` (the chunker of decision 18), `1a0d7d4` (the golden check green and the box 12.2), `0fac8c9` (the lead
fixtures without the `---`), `f4bbe36` (the red against the mutant, the green on the branch and the box 12.3),
`d45d38a` (the docs and the comments), `2a28874` (the corrected words and the box 12.4), `cdcfa67` (a trailing space of
a report) and the commit that carries this state, with STATUS in DONE, the box 12.5 and the report of the checks.

## Evidence

- The golden fixture: 23 files, 345 passages written from `86b250f`; the branch returned 377 passages and moved 21
  files before the fix, and returns the 345 once the line break of a list join is read as a space after it
  (`reports/2026-09-30-step-12-golden.md`, `reports/2026-09-30-step-12-chunker.md`).
- The lead fixture of decision 15: 2 passages per language (674/417 and 697/431) with `lead` 52 and 50; the mutant
  `lead={0}` fails the two browser cases (2 failed, 17 passed, 1 flaky of the harness) and the branch passes them (21
  passed) (`reports/2026-09-30-step-12-lead.md`).
- The checks of a clean clone of `2a28874`: `npm run typecheck` exit 0, `npm run lint` exit 0,
  `npx -y -p node@24 node node_modules/vitest/vitest.mjs run` **90 files and 1057 tests passed** in 80.74 s,
  `npm run openspec:validate` 14 passed and 0 failed, `CI=1 npm run test:e2e` **96 passed** in 2.1 min and
  `npm run build` exit 0 (`reports/2026-09-30-step-12-amendment.md`).
- gitleaks on every commit of the round (`--log-opts="HEAD~1..HEAD"`) and on the ten that came before this state
  (`bb79565..HEAD`): `10 commits scanned`, `no leaks found`, and the commit of this state scanned on its own as well;
  `git diff --check 86b250f...HEAD` exit 0.
- The measurement behind the `## Issues`: the branch of `lib/ingest/chunk.ts` that would carry the overlap is entered
  **0 times** over the 23 files of `docs/` and `samples/`, over 676 synthetic shapes of two and three paragraphs and
  over a block of one unbreakable token of 1,500 characters.

## Hard rules respected

- No `.env` file with secrets was opened; no push, no remote, no commit on `main`, no archive; the worktrees
  `community`, `community-ins`, `community-ui`, `community-main`, `community-preview`, `community-2p` and `community-2zi`
  were not touched, and no process of another agent was stopped.
- No test called a real provider: the deterministic providers of the unit suite and the local double of the browser
  suite.
- No personal path in a versioned file (a report writes `<worktree>`, `<clean clone>` or `<scratch>`); UTF-8 with LF;
  `MEMORY.md` is in no commit.
- The build and the E2E ran in a disposable clean clone with no `.env` and no `.env.local`, never in the working tree,
  which has an ignored `.env.local` that was never opened.
- The text of the tasks, of `design.md` and of the specs was not edited; only the boxes of the tasks were marked.
