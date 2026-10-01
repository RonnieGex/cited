# Step 10 — the checks of Amendment 1 (task 10.5)

- **Date:** 2026-09-30
- **Change:** `passage-display-polish` (`tasks.md`, task 10.5)
- **Branch:** `feature/passage-display-polish`
- **Commit this report was verified against:** `8c99552` (the code of decisions 9 to 12; the tree of `28bd86f` adds
  only the captures and the report of 10.4, no line of the product and no test)
- **Agent:** DeepSeek (implementer)
- **Verdict:** every check passes at the code of the amendment: types, linter, 1055 unit tests, build, audit, secrets,
  14 of 14 specifications and 94 browser cases. The five Majors of the adversarial review are addressed: the heading
  is shown once in the citation panel, `Precios` is one list of five items, Try it and the page of a document paint
  the lead outside the highlighter, the tests that accepted those defects are corrected to the spec, and the two
  captures that 7.2 declared NOT DONE are in `reports/images/`.

## The checks

All of them ran in the disposable clean clone of `28bd86f` (a folder of the temporary directory of the machine,
cloned with `git clone --no-hardlinks --branch feature/passage-display-polish`), whose only environment file is the
`.env.example` of the repository. No `.env.local` of any worktree was opened.

```
<clean clone> > node -v
v24.11.0

<clean clone> > npx -y -p node@24 node -v
v24.21.0

<clean clone> > npm run typecheck
> cited@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
[exit code: 0]

<clean clone> > npm run lint
> cited@0.1.0 lint
> eslint .
[exit code: 0]

<clean clone> > npx -y -p node@24 node node_modules/vitest/vitest.mjs run
 Test Files  89 passed (89)
      Tests  1055 passed (1055)
   Duration  79.27s
[exit code: 0]

<clean clone> > npm run build
   ▲ Next.js 16.3.6 (Turbopack)
 ✓ Compiled successfully in 8.3s
 ✓ Generating static pages using 15 workers (30/30)
build exit=0
elapsed=22s (the whole command, with `.next` removed first)

<clean clone> > npm run audit:high
> npm audit --audit-level=high
found 0 vulnerabilities
[exit code: 0]

<clean clone> > npm run secrets:scan
> gitleaks git --redact --no-banner
569 commits scanned.
scanned ~7556253 bytes (7.56 MB) in 3.22s
no leaks found
[exit code: 0]

<clean clone> > npm run openspec:validate
> openspec validate --all --strict
✓ spec/admin-panel … ✓ spec/voice-agent (14 of 14)
Totals: 14 passed, 0 failed (14 items)
[exit code: 0]
```

`git status --short` of the clone after the battery lists only the files of the battery itself, which are not
versioned.

## The browser suite

```
<clean clone of 8c99552> > $env:CI = "1"; npm run test:e2e

  94 passed (2.0m)
[exit code: 0]
```

Every case ran against the servers of `playwright.config.ts` (ports 3100 and 3210 to 3217), with the deterministic
providers of the unit suite and the local double of the browser suite: no case called a real provider. The suite of
the round before this one was 92 cases; this round adds the two of the page of a document with the highlighted
passage, one per language. The five of `e2e/passage-display.spec.ts` run with `test.use({ reducedMotion: "reduce" })`
and the two walks take their captures with `page.emulateMedia({ reducedMotion: "reduce" })`, so the highlighter of
every capture is finished (task 10.4).

## The red of each fix

| Fix | Red | Where |
|---|---|---|
| the heading once (decision 9) | 2 cases of `tests/chat.test.tsx`, 1 of `tests/setup-ui.test.tsx`, 4 of `e2e/passage-display.spec.ts` | `reports/2026-09-30-step-10-red.md` |
| one list (decision 10) | 1 case of `tests/passage-view.test.tsx`, 1 of `tests/setup-ui.test.tsx`, 1 of `e2e/setup.spec.ts` | the same |
| the lead in the owner's views (decision 11) | 2 cases of `tests/setup-ui.test.tsx`, 1 of `e2e/setup-es.spec.ts` | the same |
| no list without line breaks (decision 12) | 1 case of `tests/passage-view.test.tsx` | the same |

The unit suite at the code of `f1ca9df` was 8 failed and 1047 passed in three files; at the code of the amendment it
is 1055 passed. No case was deleted, skipped or relaxed.

## What this round does not move

No line of the ingest, of the embeddings or of the keyword index changed: the chunker of decision 2, the corpus of
1.2 and 5.2 and the searches of `tests/search.test.ts` are the ones the round before this one measured, so the
scenario "Search does not move" holds at `8c99552` for the same reason it held at `0c83ae7`. The amendment changes
the view of a passage, the address of the page of a document and one sentence of `docs/search.md`.

## Issues of the round

### BROKEN

None. The five Majors of `katalis-dev/tasks/revision-passage-display-polish.md` are closed at `8c99552`: the two
Broken of the view (the lead inside the highlighter of Try it and of the page of a document, and the heading twice
with the list split in two) are fixed and pinned by tests that fail without the fix; the Major of the tests that
accepted the defects is corrected to the spec, `tests/chat.test.tsx:116` included; and the two captures of 7.2 are in
`reports/images/`, taken again with the four views in both languages and both widths.

### RISK

- **The address `?highlight=` of the page of a document has no link yet.** Decision 11 asks the page to start the
  highlighter after the lead "for the highlighted passage", and the page reads which one from the address; no view
  writes that address today, because Try it shows the passage beside the answer and not the whole document. It is the
  decision of the implementer of this round (the contract section "Decisions taken by the implementer" stays empty
  because this round may not edit `design.md`). A later round should either link the citation of Try it to that page
  or drop the address.
- **An existing installation reads its old lists as paragraphs.** Decision 12 rejects the split of a body without
  line breaks, so the passages a store kept flattened with ` - ` read as one paragraph until their file is uploaded
  again. It is the behaviour the contract asks for, and `docs/search.md` says so; it is a change an owner will see.
- **The lead that lands on a list item is clamped by the line with its marker.** `leadOfBody` measures the first line
  of the body, which still carries the `- ` of the item, while the item paints without it. The chunker makes that
  shape only when a passage begins inside a list, and no case of the corpus reaches it; the clamp is the one decision
  13 accepted, and this round does not change it.
- **The leads of the real corpus are all zero.** No document of `samples/` has a section long enough to be split, so
  the browser proves the lead of the public panel and of the widget with the routed answer of
  `e2e/passage-display.spec.ts`, and the lead of Try it and of the page of a document in the unit suite, where the
  fixture is a passage the chunker builds. A browser case of a real lead would need a document of the walk longer
  than one passage.

### NOT DONE

- **The steps 10.6 (the push, the second review of Codex and the acceptance of Franc) are not of this delivery.**

### UNKNOWN

- **The behaviour with a real provider.** Neither a test nor a manual check called one: the unit suite uses the
  deterministic providers, the browser suite its local double, and the walk of the panel the double of the port 3216.
- **The appearance in a browser that is not Chromium.** Every browser case runs in the `Desktop Chrome` device of
  Playwright.

### Corrected by Amendment 2

- **The sample outputs of the READMEs (decision 16, 2026-09-30).** This report declared them NOT DONE, because they
  read `Precios - Espresso: 35 pesos. - Café de olla…` while the store holds the line break of decision 2. The
  commands print exactly that: `npm run search` and `npm run ask` flatten every run of whitespace of the excerpt with
  `.replace(/\s+/g, " ")` before printing it (`scripts/search.ts:32`, `scripts/ask.ts:70`), so the samples of the
  READMEs, of `docs/answering.md` and of `docs/images/readme-graphics.json` are the output of the commands and there
  is nothing to fix in them. The declaration is withdrawn; the three real outputs are in
  `reports/2026-09-30-step-11-samples.md`.
