# LOOP_STATE · Cited

STATUS: DONE
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

Every box of section 11.1 to 11.3 is marked with its report inside the change, and every report names the commit it
validates. Box 11.4 stays unchecked: it is Fable's, Codex's and Franc's.

## Close

STATUS: DONE. The three boxes of section 11 are marked with their report and their commit, and the round of the
Amendment 2 is delivered in the section "Ronda 3" of `katalis-dev/tasks/entrega-passage-display-polish.md`. The
commits of the round, in order: `274b5cf` (this state in RUNNING), `ec35af0` (the fixture and the two cases),
`13b41f2` (the red against the mutant, the green on the branch, and the box 11.1), `5191f66` (the correction of the
samples of the READMEs and the box 11.2) and the commit that carries this state, with STATUS in DONE and the box
11.3.

## Evidence

- The two cases of decision 15 in the disposable clean clone of `ec35af0`: **2 failed** against the mutant `lead={0}`
  in `TryItPanel` and in `DocumentPanel` (18 passed, 1 did not run, 1.2 min), **1 failed** against a mutant only in
  `DocumentPanel` (4 passed, 44.4 s) and **21 passed** on the branch (1.3 min); the three outputs are in
  `reports/2026-09-30-step-11-red.md`.
- The samples of the READMEs, in a clean clone of `13b41f2`: `npm run search` and `npm run ask` print the excerpt of
  `Precios` in one line, `README.md:172` and `:198` included, because `scripts/search.ts:32` and `scripts/ask.ts:70`
  flatten the whitespace; the store keeps the line break (`reports/2026-09-30-step-11-samples.md`).
- The checks of a clean clone of `5191f66` (the code of `1371333`): `npm run typecheck` 0 errors, `npm run lint`
  0 problems, **89 files and 1055 tests passed** in 78.58 s, `npm run openspec:validate` 14 passed and 0 failed, and
  `CI=1 npm run test:e2e` **96 passed** in 2.1 min (94 of the round before plus the two of decision 15).
- gitleaks on every commit of the round (`--log-opts="HEAD~1..HEAD"`) and on the five together
  (`89aba86..HEAD`): no leak.

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
