# Step 10.2 · The fixes of decisions 14 to 16 and the ports of decision 17

Task of `tasks.md`: "The fixes of decisions 14 to 16 and the ports of decision 17".

Commit that carries the fixes: `75fab1e` ("Fix the amendment: a provider that cannot answer, the bytes of a file, the
undo of the sample and the ports"). This report validates that commit and lands in the one that marks the box.

## Decision 14 · Green means usable

- `lib/admin/setup-checklist.ts`: a provider the server sets is verified only when `chatProblem()` returns nothing (its
  key is present and its provider is known); when it cannot answer, the first step is `attention` and not `progress`,
  because there is nothing the owner can do from the lane. The judgement is the same one the public page makes when it
  says the assistant is not ready.
- `components/setup/AttentionNotice.tsx` is new: the words of the owner for that state and the link to "For the
  installer" (`/admin/settings`), the only screen of the panel that names a variable of the server (decision 11).
- `app/admin/page.tsx` renders it over the first step when that step needs attention.
- `lib/i18n/admin.ts` carries the sentence in both languages, and it names no variable.

## Decision 15 · A file is what its bytes say

- `lib/ingest/parse.ts`: `detectType()` reads the content, not the extension. A PDF and a DOCX are decided by their
  signature (`%PDF-`, `PK\x03\x04`); a file is text only when its bytes decode as UTF-8, carry no NUL byte and start
  with no known binary signature (PNG, JPEG, GIF, ZIP, PDF, gzip, bzip2, xz, 7z, rar, BMP, TIFF, RIFF, MP3, wOFF, wOF2,
  the old Office container, ELF, MZ); text that claims to be a picture or a program is still refused, so the accepted
  types stay PDF, DOCX, Markdown and plain text. It takes the whole buffer and no longer a head of eight bytes.
- `lib/admin/documents.ts`: `readUploadField()` reads the size the browser sent and refuses a file above 20 MB before
  its bytes are read into memory, and `safeName()` reduces a name with `..`, a slash, a backslash or a control
  character to its base name before it is stored or shown.
- `app/api/admin/documents/route.ts`: `filesOf()` asks `readUploadField()` for every entry, and a file that crossed the
  limit answers the same shape as a file the ingestion refused, so the panel says it in the words of the owner.

## Decision 16 · Undo leaves nothing of the sample

- `app/api/admin/samples/route.ts` gains `DELETE`: one request removes the documents the sample added and, when the
  business still carries the name the sample wrote (`Café La Horquilla`), clears it back to empty. A name the owner
  typed after the sample is kept, and the answer says `name_cleared` so the panel and the tests read the decision.
- `components/setup/InfoPanel.tsx`: the undo is that one request. Removing the documents one by one is what left the
  name of the example behind (the Major M-3 of `katalis-dev/tasks/revision-community-13.md`).
- `sampleNames()` was only the list the old loop walked; the component no longer takes it, and the two screens that
  passed it (`app/admin/page.tsx`, `app/admin/information/page.tsx`) no longer do.

## Decision 17 · The ports

- `playwright.config.ts` says the fixed set in one comment over the projects: 3100 and 3210 to 3217, with what answers
  on each one.
- `docs/testing.md` is new: the two suites, their commands and the table of the ports with the reason of each one. The
  README has no section on tests, and this is the document decision 17 names.
- `docs/development-guide.md` carries the same set in its ports table and in the row of `npm run test:e2e`, which is
  where this repository documents commands and ports.

## The green run of the amended tree

Windows, Node 24.21.0, in the worktree `<worktree>`:

```
npx -y -p node@24 node -v
npx -y -p node@24 node node_modules/vitest/vitest.mjs run
v24.21.0

 Test Files  84 passed (84)
      Tests  992 passed (992)
   Duration  55.73s
```

The five files of the amendment alone, before and after (the red run is the one of task 10.1):

```
 Test Files  5 failed (5)          →   Test Files  5 passed (5)
      Tests  14 failed | 55 passed (69)  →   Tests  94 passed (94)
```

```
npx -y -p node@24 node node_modules/typescript/bin/tsc --noEmit
(no output, exit 0)

npx -y -p node@24 node node_modules/eslint/bin/eslint.js .
(no output, exit 0)
```

The checks of task 5.1 over the whole amended branch, with the two runs of Windows and the Linux container, are the
evidence of task 10.3.
