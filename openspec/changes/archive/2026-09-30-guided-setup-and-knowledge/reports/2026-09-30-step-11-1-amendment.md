# Step 11.1 · The second amendment: one rule for step 1, a ZIP is not a DOCX, a clean tree

Task of `tasks.md`: "Red, then green: step 1 with an unreadable panel key is 'needs attention' in both languages
(decision 20); a ZIP renamed `.docx` is 'type not supported' (decision 21); the E2E leaves `git status` clean in its
clone (decision 22)".

Commits that carry the cases: `4163b79` ("Bring the tests of the second amendment first: the unreadable key, the ZIP and
the captures") and `b20c7b9` ("Bring the ZIP64 case of the type of a file first: the document of Word in a 64-bit
directory"). Commits that carry the fixes: `3a58b2a` ("Fix the second amendment: one rule for step 1, a ZIP is not a
DOCX and a clean tree after the suite") and `cb10c81` ("Read the ZIP64 directory as well: the document of Word is inside
it"). This report validates those four commits and lands in the one that marks the box.

## Decision 20 · One rule for step 1

The Major M-7 of `katalis-dev/tasks/revision-community-13b.md`: a provider saved in the panel whose test had passed and
whose key could no longer be opened answered `keyState: "unreadable"` and `chatProblem() !== null`, and
`setupChecklist()` still said `verified`, because the branch of the panel only asked whether `tested_at` existed.

- `lib/admin/setup-checklist.ts`: step 1 is verified only when `chatProblem()` returns nothing for the resolved
  provider, and a provider of the panel also passed its last test. A provider that cannot answer — the server without
  its key, the key of the panel that can no longer be read, a row of the panel without a key — needs attention, whether
  or not a test was stored; the step stays in progress only while the provider can answer and its last test is still
  missing. The strict reading of the decision landed after this report, in `7ddce38` (red) and `af14a9b` (green), and
  section 4 of `reports/2026-09-30-step-11-2-checks.md` carries it.
- `lib/i18n/admin.ts`: `stepKeyBody` and `stepKeyAction` in both languages. The sentence is the one of the decision:
  "The saved key can no longer be read. Connect your AI again." / "La llave guardada ya no se puede leer. Conecta tu IA
  otra vez."
- `components/setup/AttentionNotice.tsx`: a `source` of `panel` shows those words and the button that reopens step 1
  (`/admin?step=ai`); a `source` of `server` keeps the sentence of decision 14 and the link to `/admin/settings`.
- `app/admin/page.tsx`: the notice reads which one it is from the state of the panel it already had (`provider.chat`).

The cases: `tests/setup-checklist.test.ts` — a provider sealed with one encryption key and resolved with another is
`attention` with a test and also without one, and the existing case of the verified step now seals its key with the key
of the environment; `tests/setup-ui.test.tsx` — the notice of the panel in both languages, its button and the absence
of the installer link.

## Decision 21 · A ZIP is not a DOCX

A valid ZIP renamed `.docx` was classified as a DOCX by its `PK\x03\x04` head and the owner read the generic failure of
Mammoth (the Minor m-4 of the review).

- `lib/ingest/zip.ts` is new: it walks the central directory of the archive and answers the names of its entries. The
  directory of the original format is 16 and 32 bits wide; a writer that chooses the ZIP64 extension leaves `0xffff`
  and `0xffffffff` there and writes the real counts in the record the locator points at, so the reader follows it. An
  archive it cannot read answers no names, and a file it cannot prove is not a DOCX.
- `lib/ingest/parse.ts`: a `PK\x03\x04` file is a DOCX only when `holdsWordDocument()` finds `word/document.xml`. Any
  other ZIP falls to the refusal of the accepted types, which carries the list the decision asks for and which
  `uploadReason()` classifies as "type not supported".

The ZIP64 case was found while checking the new reader: Mammoth reads a DOCX written with the 64-bit directory, so
refusing it would have been a false negative of the accepted type. It went red first (`b20c7b9`) and green with
`cb10c81`.

The cases: `tests/ingest.test.ts` — a ZIP renamed `.docx` with no document of Word, a ZIP whose only similar entry is
`copia/word/document.xml`, a real DOCX, a DOCX in a ZIP64 directory, and a ZIP64 archive that is not a DOCX;
`tests/fixtures/documents.ts` gains `buildZip()` and `asZip64()`. The browser case
`e2e/setup.spec.ts > a ZIP renamed to a Word name is refused as a type` was written first as well.

## Decision 22 · The browser suite leaves the tree clean

A green run rewrote four tracked PNGs under `docs/images/admin/` and left its clone dirty (the Minor m-5 of the review).

- `e2e/setup.spec.ts`: the captures of the walk go to `test-results/captures/admin`, which `.gitignore` excludes and
  Playwright empties at the start of every run. No tracked image is written by the suite.
- `docs/testing.md`: the browser suite says where its captures land and that the images under `docs/images/` are
  re-rendered on purpose by their own scripts.
- `tests/setup-captures.test.ts` is new: the folder of the captures is one `.gitignore` excludes, no spec builds a path
  into the docs, and every screenshot of the walk is built from that folder.

## The red runs

Windows, Node 24.21.0, in the worktree `<worktree>`, with the cases of `4163b79` and the product before `3a58b2a`:

```
npx -y -p node@24 node -v
npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/setup-checklist.test.ts tests/setup-ui.test.tsx tests/ingest.test.ts tests/setup-captures.test.ts --reporter=verbose
v24.21.0

 Test Files  4 failed (4)
      Tests  5 failed | 68 passed (73)
   Duration  58.30s
```

The five, with the reason each one gives:

- `does not verify a panel provider whose saved key can no longer be read`: `expected 'verified' not to be 'verified'` —
  the branch of the panel only asked for `tested_at`.
- `tells the owner of an unreadable key to connect the AI again, in both languages`: `It looks like undefined was
  passed instead of a matcher` — `stepKeyBody` did not exist yet.
- `refuses a ZIP renamed `.docx` that holds no document of Word`: expected the refusal of the accepted types and got
  `Could not find main document part. Are you sure this is a valid .docx file?`.
- `refuses a ZIP whose entry only ends like the document of a DOCX`: the same.
- `land in a folder the repository ignores`: `expected [ 'test-results', '.data' ] to include 'docs'`.

With the cases of `b20c7b9` and the product before `cb10c81`:

```
npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/ingest.test.ts
 Test Files  1 failed (1)
      Tests  1 failed | 19 passed (20)
   Duration  15.66s
```

- `reads a DOCX whose writer chose the ZIP64 directory`: the file was refused as
  `... is not an accepted type: the content is not PDF, DOCX, Markdown or plain text.`

## The green runs

The same four files at `3a58b2a`:

```
 Test Files  4 passed (4)
      Tests  73 passed (73)
   Duration  56.98s
```

`tests/ingest.test.ts` at `cb10c81`:

```
 Test Files  1 passed (1)
      Tests  20 passed (20)
   Duration  29.29s
```

The whole suite at `cb10c81`, which is the tree this report validates:

```
 Test Files  85 passed (85)
      Tests  1003 passed (1003)
   Duration  58.91s
```

`next typegen` and `tsc --noEmit`: no output, exit 0. `eslint .`: no output, exit 0. No test called a real provider:
the panel cases hold a sealed secret of the suite and the browser case of the ZIP uploads bytes to the route.

## Why the browser case has no red run of its own

`npm run build:e2e` builds with `next build`, which type checks the whole tree — `tsconfig.json` includes `**/*.ts` and
`**/*.tsx` — so at `4163b79` the build stops before Playwright can start: the case of the notice uses a prop and two
strings that do not exist until `3a58b2a`. The red run that proves the defect is the unit one above, which reads the
same functions the browser drives: the ZIP case fails in `tests/ingest.test.ts` at the commit of the cases and passes at
the commit of the fix, and the browser case of `e2e/setup.spec.ts` walks the same route. The whole browser suite green
in a clean clone, with a clean `git status` at the end, is the evidence of task 11.2.
