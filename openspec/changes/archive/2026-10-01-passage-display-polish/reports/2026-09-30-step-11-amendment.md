# Step 11 — the checks of Amendment 2 (task 11.3)

- **Date:** 2026-09-30
- **Change:** `passage-display-polish` (`tasks.md`, task 11.3)
- **Branch:** `feature/passage-display-polish`
- **Commit this report was verified against:** `5191f66` (the tree that holds the fixture and the two cases of
  `ec35af0` and the correction of 11.2; its product code is the one of `1371333`, because no commit of this round
  touches `lib/`, `app/`, `components/` or `scripts/`)
- **Agent:** DeepSeek (implementer)
- **Verdict:** every check passes at the code of the amendment: types, linter, 1055 unit tests, 14 of 14
  specifications and 96 browser cases, two more than the round before this one. The two cases of decision 15 fail
  against the mutant of the review and pass here.

## The checks

All of them ran in the disposable clean clone of `5191f66` (a folder of the temporary directory of the machine,
cloned with `git clone --no-hardlinks --branch feature/passage-display-polish`), whose only environment file is the
`.env.example` of the repository. No `.env` and no `.env.local` of any worktree was opened.

```text
<clean clone> > node -v
v24.11.0

<clean clone> > npx -y -p node@24 node -v
v24.21.0

<clean clone> > npm run typecheck
> cited@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
typecheck exit=0

<clean clone> > npm run lint
> cited@0.1.0 lint
> eslint .
lint exit=0

<clean clone> > npx -y -p node@24 node node_modules/vitest/vitest.mjs run
 Test Files  89 passed (89)
      Tests  1055 passed (1055)
   Duration  78.58s (tests 79%, environment 12%, import 4%, setup 3%, transform 2%)
vitest exit=0

<clean clone> > npm run openspec:validate
> openspec validate --all --strict

✓ spec/admin-panel … ✓ spec/voice-agent (14 of 14)
Totals: 14 passed, 0 failed (14 items)
openspec exit=0

<clean clone> > git rev-parse HEAD
5191f66547f980e57545ede7ddb8d29ec1acf189

<clean clone> > gitleaks git --redact --no-banner --log-opts="89aba86..HEAD"
9:38PM INF 4 commits scanned.
9:38PM INF scanned ~32968 bytes (32.97 KB) in 224ms
9:38PM INF no leaks found
gitleaks exit=0
```

`gitleaks git --redact --no-banner --log-opts="HEAD~1..HEAD"` ran on `274b5cf`, `ec35af0`, `13b41f2` and `5191f66`
while they were made, and the five commits of the round, this one included, were scanned together after it was made:
no leaks found in any of them.

```text
<worktree> > gitleaks git --redact --no-banner --log-opts="89aba86..HEAD"
9:41PM INF 5 commits scanned.
9:41PM INF scanned ~44510 bytes (44.51 KB) in 269ms
9:41PM INF no leaks found
gitleaks exit=0
```

## The browser suite

```
<clean clone> > $env:CI = "1"; npm run test:e2e

  96 passed (2.1m)
::notice title=🎭 Playwright Run Summary::  96 passed (2.1m)
```

```
<clean clone> > npx playwright test        # the same suite with the list reporter, to name the two new cases

  ok 90 [setup] › e2e\setup.spec.ts:581:5 › the lead of a passage reads outside the highlighter in Try it and on the page of its document (1.5s)
  ok 96 [setup-es] › e2e\setup-es.spec.ts:277:5 › la guía de un pasaje se lee fuera del resaltador en Prueba y en la página de su documento (1.7s)
  96 passed (2.1m)
```

Every case ran against the servers of `playwright.config.ts` (ports 3100 and 3210 to 3217), with the deterministic
providers of the unit suite and the local double of the browser suite: no case called a real provider. The round
before this one was 94 cases; this one adds the two of decision 15, one per language. The ports were free when each
run started and no process of another agent was stopped.

## What this round does not move

The round adds two documents of the browser suite (`e2e/fixtures/`), the two cases that upload them, and the reports
and the boxes of section 11. No line of `lib/`, of `app/`, of `components/` or of `scripts/` changed, so the chunker
of decision 2, the corpus of 1.2 and 5.2, the searches of `tests/search.test.ts` and the samples of the READMEs are
the ones the round before this one measured, and the scenario "Search does not move" holds for the same reason. The
unit suite is 1055 cases before and after this round.

## The `git diff --check` of the round

```
<clean clone> > git diff --check 86b250f...HEAD   # the base of the change (origin/main when the branch was created)
diff-check base exit=0
```

With the `origin/main` of the clone (the local `main` branch of the repository, `8b0c77f`) the same command fails on
one file that this branch never touched:

```
<clean clone> > git diff --check origin/main...HEAD
openspec/specs/project-readme/spec.md:191: new blank line at EOF.
diff-check exit=2

<clean clone> > git rev-parse 86b250f:openspec/specs/project-readme/spec.md HEAD:openspec/specs/project-readme/spec.md 8b0c77f:openspec/specs/project-readme/spec.md
98f01d766caff5f8095fd4fe1903ee413824ad0e 98f01d766caff5f8095fd4fe1903ee413824ad0e 724dfe04c23b8788e566f992ad2a7a49d305044d

<clean clone> > git log -1 --format=%h%x20%s HEAD -- openspec/specs/project-readme/spec.md
3234212 Archive readme-real-orb: Franc accepted it on pull request 3

<clean clone> > git merge-base --is-ancestor 8b0c77f 86b250f
is-ancestor exit=0 (0 means the clone's origin/main is behind the base)
```

The blob of that specification is the same at the base of the change (`86b250f`) and at HEAD (`98f01d7`), the last
commit that wrote it is `3234212` (the archive of `readme-real-orb`, on `main`), and the local `main` of the
repository is an ancestor of the base. The Minor of
`katalis-dev/tasks/revision-passage-display-polish-b.md` ("`git diff --check origin/main...HEAD` falls on a new blank
line at the end of `openspec/specs/project-readme/spec.md:191`") is an artefact of that stale `main`: the twenty lines
of the file, the blank line at its end included, are changes of `main` between `8b0c77f` and `86b250f` that the
three-dot diff of a clone whose `origin/main` is that old commit attributes to this branch. Against the base of the
change the check is clean, and this round adds no whitespace error of its own (the five trailing spaces of the pasted
Playwright output of `reports/2026-09-30-step-11-red.md` were removed before its commit). Decision 17 still asks the
archive step (11.4) to leave no new blank line at the end of a spec.

## Issues of the round

### BROKEN

None. The two cases of decision 15 fail against the mutant of the review (`lead={0}` in `TryItPanel` and in
`DocumentPanel`; `reports/2026-09-30-step-11-red.md`) and pass on the branch, the samples of the READMEs are what the
commands print (`reports/2026-09-30-step-11-samples.md`), and every check of this report is green at `5191f66`.

### RISK

- **The lead of a real passage is always zero, and the fixture brings its own.** I measured it while building the
  fixture: the `carry` of `chunk.ts` is read only by the `if` that opens `add()` when `current` is empty, and `add()`
  never returns with an empty `current`, so no passage after the first of a section starts with the end of the one
  before it, whatever the length of the section. The lead of the whole corpus is 0 (`npm run ask` prints
  `[1] cafe-la-horquilla.md [Precios] position 2 lead 0`), and so is the lead of a section long enough to be cut in
  two. The fixture of decision 15 gives the two views a real lead because its text says the same sentence at the
  boundary of its two passages, not because the chunker repeats it. Making the chunker carry the overlap for real
  would change the text of every passage after the first of a section, the corpus of `reports/2026-09-30-step-1-corpus.md`
  and `reports/2026-09-30-step-5-checks.md`, the searches of `tests/search.test.ts` and the scenario "Search does not
  move", so it is out of section 11: it needs a contract of its own from Fable, with a re-ingest of the stores.
- **The fixture is one more document of the walk.** Both walks upload it near their end, and its words are unique in
  the store, so no question and no suggestion of the cases before it changes. A later case that counts the documents
  of the panel has to count one more.
- **The address `?highlight=` of the page of a document still has no link.** It is the decision of the round before
  this one: Try it shows the passage beside the answer, and the case of the page uses the address. Unchanged here.
- **An existing installation reads its old lists as paragraphs.** Decision 12 rejects the split of a body without line
  breaks; unchanged here.

### NOT DONE

- **The steps 11.4 (the push, the third review of Codex and the acceptance of Franc) are not of this delivery**, and
  9.4 stays open with them.
- **The correction of decision 16 does not touch the documentation.** Nothing was fixed in `README.md`,
  `README.es.md`, `docs/answering.md` or `docs/images/readme-graphics.json`, because the samples already are what the
  commands print; the report of step 10 and the delivery of round 2 are the texts that were corrected.

### UNKNOWN

- **The behaviour with a real provider.** Neither a test nor a manual check called one: the unit suite uses the
  deterministic providers and its own local HTTP double, the browser suite its local double, and the walk of the panel
  the double of the port 3216.
- **The appearance in a browser that is not Chromium.** Every browser case runs in the `Desktop Chrome` device of
  Playwright.
- **The real `origin/main` of GitHub.** I did not reach any remote from this round: the check above uses the base of
  the change (`86b250f`) and the `origin/main` of the clone. If the remote `main` moved past the base with changes of
  its own, the three-dot check would still compare from `86b250f` and stay clean.
