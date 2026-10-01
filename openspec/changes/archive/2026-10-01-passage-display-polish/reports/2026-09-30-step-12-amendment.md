# Step 12 — the checks of the round (task 12.5)

- **Date:** 2026-09-30
- **Change:** `passage-display-polish` (`tasks.md`, task 12.5; `design.md`, decisions 18 to 21)
- **Branch:** `feature/passage-display-polish`
- **Commit this report was verified against:** `2a28874` (the code of the round; the commits after it, `cdcfa67` and the
  one of this report, touch only the text of the reports, the box of the task and `LOOP_STATE.md`)
- **Agent:** DeepSeek (implementer)
- **Verdict:** the five checks of the task are green in a disposable clean clone of `2a28874`: types, linter, **90 files
  and 1057 unit tests**, 14 of 14 specifications and **96 browser tests**. The three failing states of the round are
  recorded in their own reports: the golden test red on `c2f5d2a` (task 12.1), the browser cases red against the mutant
  `lead={0}` (task 12.3) and the case of the tests of the change that the fix of the chunker corrected, with its
  measurement (task 12.2).

## The commands and their real output

All of them in `<clean clone>`, a `git clone --no-hardlinks --branch feature/passage-display-polish <worktree>` whose
only checkout is `2a28874`; it holds no `.env` and no `.env.local` (`env file present: False / False`).

```text
<clean clone> > node -v
v24.11.0
<clean clone> > npx -y -p node@24 node -v
v24.21.0

<clean clone> > npm ci
found 0 vulnerabilities
npm ci exit=0

<clean clone> > npm run typecheck
> next typegen && tsc --noEmit
✓ Types generated successfully
typecheck exit=0

<clean clone> > npm run lint
> eslint .
lint exit=0

<clean clone> > npx -y -p node@24 node node_modules/vitest/vitest.mjs run

 Test Files  90 passed (90)
      Tests  1057 passed (1057)
   Start at  23:13:18
   Duration  80.74s (tests 74%, environment 15%, import 5%, setup 4%, transform 2%)
vitest exit=0

<clean clone> > npm run openspec:validate
✓ spec/product-identity
…
Totals: 14 passed, 0 failed (14 items)
openspec exit=0

<clean clone> > CI=1 npm run test:e2e -- --reporter=list
…
  ok 90 [setup] › e2e\setup.spec.ts:581:5 › the lead of a passage reads outside the highlighter in Try it and on the page of its document (1.4s)
  ok 91 [setup] › e2e\setup.spec.ts:738:7 › the chat set by the server › step 1 asks for the search and the sample waits for it, in both languages (2.8s)
  ok 92 [setup-es] › e2e\setup-es.spec.ts:123:5 › la primera visita en español muestra el saludo y los cuatro pasos (2.1s)
  ok 93 [setup-es] › e2e\setup-es.spec.ts:143:5 › de cero a una respuesta, en español, cronometrado (2.5s)
  ok 94 [setup-es] › e2e\setup-es.spec.ts:241:5 › la página del documento resalta el pasaje que abrió una cita (1.9s)
  ok 95 [setup-es] › e2e\setup-es.spec.ts:260:5 › el paso de publicar en español cierra la configuración (2.6s)
  ok 96 [setup-es] › e2e\setup-es.spec.ts:277:5 › la guía de un pasaje se lee fuera del resaltador en Prueba y en la página de su documento (1.7s)

  96 passed (2.1m)
e2e exit=0

<clean clone> > npm run build
…
ƒ  (Dynamic)  server-rendered on demand
build exit=0
```

`CI=1` is what keeps Playwright from reusing a server of another agent in the fixed ports, and the count of the browser
suite is the 94 of the round before plus the 2 of decision 15. The production `npm run build` is not one of the five
checks of the task; it is here because the round writes code and it exits 0 as well. The ports 3100 and 3210 to 3217
were free before the run and after it (`3100 free … 3217 free`). The clone starts the provider double of the walk at the
port 3216 and the deterministic providers everywhere else, so no test called a real provider.

## The rest of the checks of the round

| Check | Command | Result |
|---|---|---|
| Whitespace against the base | `git diff --check 86b250f...HEAD` | exit 0, no output (a trailing space in a report of this round was taken out in `cdcfa67`) |
| gitleaks of every commit | `gitleaks git --redact --no-banner --log-opts="HEAD~1..HEAD"` | `no leaks found` in each of the eleven commits of the round, this one included |
| gitleaks of the round | `gitleaks git --redact --no-banner --log-opts="bb79565..HEAD"` | `10 commits scanned`, `no leaks found` before this report; the commit that carries it is the eleventh and was scanned on its own (gitleaks 8.30.1) |
| The golden check against the base | `npx -y -p node@24 node scripts/chunk-golden.mts …` and `tests/chunk-golden.test.ts` | 23 files, 345 passages, `moved 0`: the chunker of the branch returns what `86b250f` returns once the `\n` of a list join is read as a space (report of step 12.2) |
| The mutant of the review | `CI=1 npx playwright test e2e/setup.spec.ts e2e/setup-es.spec.ts --project=setup --project=setup-es` with `lead={0}` | 2 failed (the two cases of decision 15), 17 passed (report of step 12.3) |
| The same command on the branch | the same, without the mutant | 21 passed (report of step 12.3) |

## The commits of the round

```text
2a28874 Record the corrected words about the overlap and mark 12.4
f4bbe36 Record the lead fixture without the --- line red against the mutant and green on the branch
d45d38a Say what the overlap of the chunker does in the docs and in the comments
0fac8c9 Cut the lead fixtures with the overflow of a paragraph and not with a --- line
1a0d7d4 Record the golden check green on the chunker of decision 18 and mark 12.2
b65bb97 Cut a block of the chunker at every blank line again, as on main
5533ae9 Record the golden fixture red against the branch and mark 12.1
60e42d3 Write the golden fixture of the chunker from 86b250f and the test that requires it
86654a7 Open the round of Amendment 3 with the state of the loop in RUNNING
```

plus `cdcfa67` (a trailing space in the report of 12.2) and the commit of this report, which marks 12.5 and closes
`LOOP_STATE.md`. Every box of section 12 sits in the same commit as its report, and every report names the commit it
verified.

## Issues

### BROKEN

None. The Major of `katalis-dev/tasks/revision-passage-display-polish-c.md` is closed and measured: `lib/ingest/chunk.ts`
cuts a block at every blank line again, the golden fixture written from `86b250f` is green, the documents of the
repository return the 345 passages of the base, the only raw difference with `main` is the line break of a list join
(17 files, all of them with a list), and the fixture of decision 15 fails the browser cases against the mutant
`lead={0}` and passes without it.

### RISK

- **The contract describes an overlap the code does not have, and one sentence of it could not be written as asked.**
  Decision 20 says the fixture "produces a `lead` greater than 0 … through a paragraph long enough to overflow the
  passage before it (the case in which the chunker carries its overlap)", and decision 21 asks the docs to say that
  "the overlap is carried only when the next block overflows the passage". The branch of `add()` that would carry it is
  never entered: it needs `current` empty and `carry` not, and `add()` always ends with text in `current` for a
  non-empty block. Measured with the chunker instrumented: **0 times** over the 23 files of `docs/` and `samples/`, over
  676 synthetic shapes of two and three paragraphs and over a block of one unbreakable token of 1,500 characters. So the
  fixture of decision 20 gets its `lead` from the sentence the document repeats at the boundary, which is what decision
  15 asks for and what the report of step 12.3 prints; `docs/answering.md` and the comments of the code say the measured
  thing and not the sentence of decision 21. Writing that sentence would have put a new false statement in the product
  documentation, which is the defect the review found. Making the overlap real is a change of its own: it moves the
  stored text of almost every passage after the first of a section, and with it the golden fixture, the corpus of
  reports 1.2 and 5.2 and the baseline of the scenario "Search does not move". Decision 21 says "No behaviour changes
  for this", so this round does not touch it.
- **The delta `answering` keeps the same false parenthesis.** `openspec/changes/passage-display-polish/specs/answering/
  spec.md` says "the overlap the chunker carries when a block overflows a passage" (Fable's correction in `bb79565`).
  The spec is not mine to edit; the normative half of the requirement (`lead` is the longest prefix of the excerpt, at
  most 120 characters and followed by whitespace, that is a suffix of the passage before it) is true, is what the code
  does and is what the tests of the change require.
- **`docs/search.md:68` keeps a false figure.** "about 800 characters with 120 of overlap" describes an overlap that
  never reaches a passage. It was already false in `main`, it is outside the texts decision 21 names, and this round
  does not touch it.
- **The `lead` of a real document is zero.** Pre-existing and confirmed again here: the function that decision 11 paints
  is empty in production until a document repeats its own words at the boundary of two passages, as the fixture and the
  unit tests do on purpose. Same judgment as the round 3: it needs its own change.
- **`design.md` keeps a section the implementer did not fill.** "Decisions taken by the implementer" says the implementer
  writes there every decision a later round leaves open; the instruction of this round forbids editing `design.md`, so
  the decision above lives in this report and in the section "Ronda 4" of the delivery.
- **Two test files of the change changed their comments, and one case of `tests/answer-lead.test.ts` its fixture.** The
  case used to pass because of the Major: without the cut at the blank line its two paragraphs were one block, the block
  was cut inside the run of the word `consulta`, and `leadLength` found 116 characters of repeated words where the
  chunker had cut a sentence. With decision 18 the fixture repeats the sentence in the text of the document, as the
  fixture of decision 20 does, and the assertion is stronger (`toBe(leaded.length)` instead of `toBeGreaterThan(0)`).
  The reason is in the report of step 12.2, with the measurement of the old behavior.
- **The browser suite keeps its `flaky` of `CI=1`.** In the run with the mutant, `setup.spec.ts:157` reports `flaky`:
  the retry repeats the first walk of the file with the store already full. It is the harness the review already
  documented, it does not appear in the run without the mutant, and no test of this round depends on it.

### NOT DONE

- **12.6 is not mine**: the push, the independent review of `katalis-dev/tasks/revision-passage-display-polish-d.md`
  and the acceptance of Franc. 9.4 stays open with it.
- **The archive of the change.** No spec was archived and no blank line at the end of a spec was touched (decision 17 is
  the step of whoever archives).
- **`docs/search.md:68`**, as above: false before this change and outside the texts of decision 21.

### UNKNOWN

- **A real provider and a browser other than Chromium.** No run of this round touched one: the unit suite uses its
  deterministic providers, the browser suite its local double and the walk its double at the port 3216; every browser
  run is `Desktop Chrome`.
- **The real `origin/main`.** The round reached no remote. The `git diff --check` compares against the base of the
  change (`86b250f`), which is an ancestor of the branch, so the three-point diff is exact for this repository; if the
  remote `main` moved past the base with work of its own, the comparison still starts there.
- **The archive of the change against the spec files.** `openspec archive` was not run in this round; the Minor 2 of the
  review (a new blank line at the end of the five specs) is a property of that command, recorded for whoever archives.
