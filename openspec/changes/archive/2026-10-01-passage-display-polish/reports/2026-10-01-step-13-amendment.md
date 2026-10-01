# Step 13 — the checks of Amendment 4 (task 13.4)

- **Date:** 2026-10-01 (the round opened on 2026-09-30; these checks ran in the first minutes of the next day, machine
  clock)
- **Change:** `passage-display-polish` (`tasks.md`, task 13.4; `design.md`, Amendment 4, decisions 22 to 24)
- **Branch:** `feature/passage-display-polish`; base `86b250f`; `main` (`e52e527`) is already merged into the branch at
  `54c61eb`
- **Commit this report was verified against:** `c93c1ff` ("Take the trailing space out of the report of the cut"), the
  tip of the branch when the clean clone was made: the frozen corpus and its test (`18c49c1`), the cut of decision 22
  (`5fe6fa5`) and the reports of 13.1 to 13.3 with their boxes (`dd4aa4c`, `f7c8ac9`, `c93c1ff`)
- **Clean clone:** `<clean clone>` — `git clone --branch feature/passage-display-polish --single-branch <worktree>
  <clean clone>`; it holds no `.env` and no `.env.local` (the only `.env*` file of the clone is `.env.example`), and no
  `.env` file was opened in this round
- **Node:** local `v24.11.0`; the unit suite ran with the required `npx -y -p node@24` → `v24.21.0`
- **Agent:** DeepSeek (implementer)
- **Verdict:** every check is green on `c93c1ff`: types, linter, **1067 unit tests in 90 files**, `openspec validate`
  **14 of 14**, build, **96 browser tests** with no flaky, no whitespace error and no secret in any commit of the round.

## Results

| Check | Command | Real result |
|---|---|---|
| Dependencies | `npm ci` | exit 0, `added 693 packages`, `found 0 vulnerabilities` (the `EBADENGINE` warning of `w3c-xmlserializer` and Node `v24.11.0` that the fourth review already recorded) |
| Types | `npm run typecheck` (`next typegen && tsc --noEmit`) | exit 0, `Types generated successfully` |
| Linter | `npm run lint` (`eslint .`) | exit 0, no output |
| Unit suite | `npx -y -p node@24 node node_modules/vitest/vitest.mjs run` | exit 0, **90 files, 1067 tests, 80.96 s**, Node `v24.21.0` |
| Unit suite, the literal command of the task | `npm test` (`vitest run`) | exit 0, **1067 tests**, 37.55 s, Node `v24.11.0` |
| Specifications | `npm run openspec:validate` (`openspec validate --all --strict`) | exit 0, `Totals: 14 passed, 0 failed (14 items)` |
| Build | `npm run build` | exit 0, `Compiled successfully` |
| Browser suite | `CI=1 npm run test:e2e -- --reporter=list` | exit 0, **96 passed (2.5m)**, no flaky and no retry |
| Whitespace of the round | `git diff --check 86b250f...HEAD` | exit 0, no output |
| Secrets, commit by commit | `gitleaks git --redact --no-banner --log-opts="HEAD~1..HEAD"` on each of the 6 commits | `1 commits scanned`, `no leaks found` in all six |
| Secrets of the round | `gitleaks git --redact --no-banner --log-opts="1a08b0f..HEAD"` | `6 commits scanned`, `no leaks found` |
| The check of decision 23, red | `npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/chunk-golden.test.ts` on the chunker of `54c61eb` | **1 failed, 1 passed**: `openspec/…/2026-09-29-step-9-docs.md, passage 2` |
| The check of decision 23, green | the same on `5fe6fa5` | **2 passed** (30 files, 385 passages) |
| The cut of decision 22 against the base | scratch comparison of the two chunkers over the 30 frozen files | `{"files":30,"same":30,"differ":0}` |
| The cut of decision 22, fuzzed | scratch fuzz of 5,000 documents, seed `20260930` | before: 312 moved (all with a list); after: **0 moved**, 0 without a list in both runs |
| The check reads no live file | a line appended to the live `docs/security.md` and to the live `…2026-09-29-step-9-docs.md` | `Tests 2 passed (2)` with both files edited; both restored, `git status` empty |

## Ports and processes

The ports 3100 and 3210 to 3217 were checked before the browser suite: all nine were free. No process of another agent
was stopped and no other worktree was touched. The suite served its own doubles; no test called a real provider (the
unit suite uses its deterministic providers and its local HTTP double, the browser suite its local double on port 3216).

## What the round closes

- **Major 1 of the fourth review.** `cut()` takes the last space **or line break** before the cut (decision 22), so a
  passage cut at a list join is cut where `86b250f` cuts it: the 4 files of the corpus that differed are identical, and
  an independent fuzz of 5,000 documents goes from 312 moved documents to 0, with no document without a list ever
  moving.
- **Major 2 of the fourth review.** The golden check reads only the frozen corpus of decision 23 (30 files, 385
  passages written once from the chunker of `86b250f`), never a live file of `docs/`, of `samples/` or of the archive,
  so editing a document cannot break it; and the branch already carries `main` (`e52e527`) at `54c61eb`, whose tree
  passes the whole suite (1067 of 1067 here).
- **Minor 3 of the fourth review.** The check names the first passage whose text differs, position by position, even
  when the number of passages differs (decision 24): with the chunker of `c2f5d2a` it names `docs/admin.md, passage 1`
  where the old check named `passage 30` (`min` of the two counts).

## Issues

### BROKEN

None. The two Majors of `katalis-dev/tasks/revision-passage-display-polish-d.md` are closed and measured: the frozen
corpus is red on the chunker of `54c61eb` and green on `5fe6fa5`, the corpus is identical to `86b250f` in its 30 files,
the fuzz moves from 312 to 0 documents, the check reads no live document, and the five checks of the round are green on
`c93c1ff`.

### RISK

- **The frozen corpus does not follow the live documents.** The price of decision 23: the golden check compares the
  branch chunker against the passages of the copies frozen at `86b250f`, so a later edit of a live `docs/` file is not
  seen by it (the second case still ties the fixture to the 30 frozen files, so corpus and fixture cannot drift from
  each other). This is the trade the contract chose over a fixture that any document edit breaks.
- **Minor 4 of the fourth review is still open for whoever archives.** `openspec archive -y` leaves a new blank line at
  the end of the five specs (decision 17); this round did not archive and did not touch the specs.
- **Minor 5 of the fourth review is still open.** The delta `answering` (which the archive copies to the permanent
  spec), the Context of `design.md` and its decisions 20 and 21 still describe an overlap of the chunker that never
  reaches a passage, and `docs/search.md:68` still says "800 characters with 120 of overlap". The texts of the contract
  and of the specs are not the implementer's to edit; `docs/answering.md` and the comments of the code say what was
  measured (task 12.4).
- **The lead of a real document is still 0.** The overlap of the chunker only reaches a passage when the next block is
  too long to fit beside it, which no document of the repository does; the fixtures of decision 15 earn their lead from
  the sentence the document repeats at the border. Making it real needs its own change.
- **NIT 6 of the fourth review survives.** A list marker left at the end of a passage by the cut of `86b250f` is
  written as its own line (`… mech.\n-`); 8 passages of `openspec/`, none of `docs/` or `samples/`. Read as a space it
  is identical to `main`, which is what the check compares.
- **The `CI=1` flakiness of `setup.spec.ts:157` did not appear in this run.** The browser suite passed 96 of 96 with no
  flaky and no retry; the flaky the fourth review saw came with a failing case of the same serial walk.

### NOT DONE

- **13.5 is not this round:** Fable pushes, an independent review
  (`katalis-dev/tasks/revision-passage-display-polish-e.md`) and Franc accepts. 9.4 stays open with them.
- **The archive of the change** (decision 17) and the wording of the delta `answering` (Minor 5) are not the
  implementer's; the round made no commit on `main`, no push and no remote.
- **`docs/search.md:68`** keeps its false figure, as before this change.

### UNKNOWN

- **A real provider and a browser other than Chromium.** No run of this round touched either: the unit suite uses its
  deterministic providers and its local double, the browser suite its own double, and every browser test runs in
  `Desktop Chrome`.
- **`origin/main` beyond `e52e527`.** The round worked with the `main` already merged into the branch; if the remote
  `main` moved after `e52e527`, the next merge has to re-run what the fourth review measured.
