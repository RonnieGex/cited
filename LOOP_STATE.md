# LOOP_STATE · Cited

STATUS: RUNNING
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

- **12.1**: `scripts/chunk-golden.mts` writes `tests/fixtures/chunker-golden.json` from the chunker of `86b250f` over
  every Markdown and text file of `samples/` and `docs/`, and `tests/chunk-golden.test.ts` requires the chunker of the
  branch to return the same passages once the `\n` of a list join is read as a space, naming the file and the position
  of the first difference.
- **12.2**: `lib/ingest/chunk.ts` cuts a block at every blank line again, as on `main`, and only the join of a list item
  changes (decision 18).
- **12.3**: the two fixtures of decision 15 lose their `---` line, so the paragraph that overflows the passage before it
  is what cuts them; their passages and their `lead` are printed in the report.
- **12.4**: `docs/answering.md` and the comments of `lib/answer/lead.ts` and `components/chat/PassageBody.tsx` say what
  the overlap of the chunker does.
- **12.5**: the checks of the round in a clean clone, with their output in a report that names the commit of the code
  each one verified, and the `## Issues` of the round there and in the section "Ronda 4" of the delivery.

Every box of section 12.1 to 12.5 is marked with its report inside the change, and every report names the commit it
validates. Box 12.6 stays unchecked: it is Fable's, the reviewer's and Franc's.

## Close

Pending: the round closes when 12.1 to 12.5 are marked with their report and their commit.

## Evidence

- Pending of the round.

## Hard rules respected

- No `.env` file with secrets was opened; no push, no remote, no commit on `main`, no archive; the worktrees
  `community`, `community-ins`, `community-ui`, `community-main`, `community-preview`, `community-2p` and `community-2zi`
  were not touched, and no process of another agent was stopped.
- No test called a real provider: the deterministic providers of the unit suite and the local double of the browser
  suite.
- No personal path in a versioned file (a report writes `<worktree>`, `<clean clone>` or `<scratch>`); UTF-8 with LF;
  `MEMORY.md` is in no commit.
- The build and the E2E run in a disposable clean clone, never in the working tree, which has an ignored `.env.local`
  that was never opened.
- The text of the tasks, of `design.md` and of the specs is not edited; only the boxes of the tasks are marked.
