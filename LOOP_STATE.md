# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: passage-display-polish (OpenSpec), Amendment 2, section 11 (tasks 11.1 to 11.3)
BRANCH: feature/passage-display-polish
BASE: 86b250f (main when the change started)
HEAD AT THE START OF THE ROUND: 89aba86 ("Amend the contract of passage-display-polish a second time: a fixture with a lead")
AGENT: DeepSeek (implementer), contract by Fable, review by Codex
DATE: 2026-09-30

## Objective

Execute tasks 11.1 to 11.3 of `openspec/changes/passage-display-polish/tasks.md` and nothing else: the fixture with a
lead of decision 15 (a browser case in English and in Spanish, red against the mutant `lead={0}` in `TryItPanel` and
in `DocumentPanel` of `1371333` and green on the branch), the correction of the reports and of the delivery that
declared NOT DONE for the samples of the READMEs (decision 16), and the checks of the round with their report naming
the commit they verified. Steps 0 to 10 are marked and stay untouched; 11.4 (the push, the third review and the
acceptance) is not mine. Small commits, gitleaks on every commit, no push, no remote, no archive, no commit on `main`,
no edit of the text of the tasks, of `design.md` or of the specs. The build and the E2E run in a disposable clean
clone, never opening a `.env.local`. The E2E uses the ports 3100 and 3210 to 3217, and waits while another agent holds
them.

## Progress

- **11.1**: the fixture `e2e/fixtures/returns-and-warranty.md` (English) and `e2e/fixtures/devoluciones-y-garantia.md`
  (Spanish), one section the chunker cuts into two passages, the second one opening with the sentence that closes the
  first; the case in `e2e/setup.spec.ts` and in `e2e/setup-es.spec.ts` uploads it, asks Try it the question the local
  double answers from that second passage, and asserts the lead node with the repeated words and the highlighter
  starting at the first own word, in Try it and on the page of the document.
- **11.2**: the samples of the READMEs are what `npm run search` and `npm run ask` print; the report of step 10 and the
  delivery of round 2 are corrected where they declared them NOT DONE (decision 16).
- **11.3**: the checks of the round in a clean clone, with their output in a report that names the commit of the code
  each one verified, and the `## Issues` of the round there and in the section "Ronda 3" of the delivery.

## Hard rules respected

- No `.env` file with secrets was opened; no push, no remote, no commit on `main`, no archive; the worktrees
  `community`, `community-ins`, `community-ui`, `community-main`, `community-preview` and `community-2zi` were not
  touched, and no process of another agent was stopped.
- No test called a real provider: the deterministic providers of the unit suite and the local double of the browser
  suite.
- No personal path in a versioned file (a report writes `<worktree>`, `<clean clone>` or `<scratch>`); UTF-8 with LF;
  `MEMORY.md` is in no commit.
- The build and the E2E run in a disposable clean clone, never in the working tree, which has an ignored `.env.local`
  that was never opened.
- The text of the tasks, of `design.md` and of the specs is not edited; only the boxes of the tasks are marked.
