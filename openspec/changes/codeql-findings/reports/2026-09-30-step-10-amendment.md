# Step 10 · the amendment of the contract: a bounded read, the cut markup and the reports

Contract: `tasks.md`, section 10 (tasks 10.1 to 10.5), and `design.md`, Amendment 1 (decisions 5 to 7). Agent:
deepseek-harness. Date: 2026-09-30. Change: `codeql-findings`, branch `feature/codeql-findings`, verified in the
`<worktree>`.

The review of Codex (`katalis-dev/tasks/revision-codeql-findings.md`) reproduced a Major and two Minors on `748c2d1`:

- **Major 1**: one open file is not enough. The file measured 5 bytes at `handle.stat()`, grew to 20,971,521 bytes
  before `handle.readFile()`, and all of it was read.
- **Minor 1**: HTML cut before its `>` leaves a fragment that looks like a tag (`<p>Horario</p><em sin-cierre` gives
  `Horario\n<em sin-cierre`), and the comment above the removal describes an expression that the code does not run.
- **Minor 2**: the reports name predecessor hashes that are not on the branch or carry `__COMMIT__`.

## The red of 10.1 and 10.2, with the code of `748c2d1` in place

The tests were written first and run against the code of the last commit of the round, `748c2d1`: `parseFile` of that
commit is `handle.stat()` and then `handle.readFile()`, with no bound on the read, and `removeTags` repeats the removal
of the tags without touching a `<` that never closes.

```
$ npx -y -p node@24 node -v
v24.21.0

$ npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/ingest.test.ts --no-cache --reporter=verbose

 RUN  v5.0.2 <worktree>

 ✓ tests/ingest.test.ts > a Word document keeps its text as written > decodes an entity once, whatever the author typed 19ms
 ✓ tests/ingest.test.ts > a Word document keeps its text as written > removes the markup whole and keeps the text that looks like markup 2ms
 × tests/ingest.test.ts > a Word document keeps its text as written > removes the markup that was cut before its `>` 10ms
   → expected 'Horario\n<em sin-cierre' to be 'Horario' // Object.is equality
 ✓ tests/ingest.test.ts > the limits > refuses a file above the byte limit before parsing it 87ms
 ✓ tests/ingest.test.ts > the limits > refuses a file above the page limit before extracting any text 68ms
 ✓ tests/ingest.test.ts > the limits > refuses a file above the byte limit with the size of the open file 2ms
 ✓ tests/ingest.test.ts > the limits > keeps reading a file inside the limit 9ms
 ✓ tests/ingest.test.ts > the limits > reads no path: the bytes come from the open file 2ms
 × tests/ingest.test.ts > the limits > refuses a file that grows after it was measured, with the limit and no parsing 22ms
   → expected 1 to be +0 // Object.is equality
   → expected "convertToHtml" to not be called at all, but actually been called 1 times
   → expected '' to match /crosses the size limit: 946 bytes is …/
 × tests/ingest.test.ts > the limits > stops the read of a file that grows past the limit at the limit plus one byte 7ms
   → expected 5120 to be 1025 // Object.is equality
   → expected 1 to be +0 // Object.is equality
   → expected 'Invalid PDF structure.' to match /crosses the size limit: 1025 bytes is…/
 ✓ tests/ingest.test.ts > the limits > reads no byte of a file that is above the limit when it is measured 3ms

 Test Files  1 failed (1)
      Tests  3 failed | 26 passed (29)
   Duration  17.21s (tests 85%, environment 9%, import 4%, transform 2%, setup 1%)

exit=1
```

The failures, which are the reproduction of the Major and of the Minor 1 inside the suite:

- **10.2, the cut markup**: `docxToMarkdown("<p>Horario</p><em sin-cierre")` gives `Horario\n<em sin-cierre` where the
  scenario demands `Horario`.
- **10.1, the file that grows**: the file measures 5 bytes, the watch writes a whole Word document of 946 bytes after
  `stat` answered, and the code of `748c2d1` reads it through `handle.readFile()` (one call) and hands it to the
  parser, which answers the passage `Abrimos de martes a domingo.` — the refusal is empty because `parseFile` resolved
  instead of refusing. The parser of the DOCX (`mammoth.convertToHtml`) ran once, which is the "nothing of it is
  parsed" of the scenario, broken.
- **10.1, the bound**: with a file of 5,120 bytes and a limit of 1,024, the code read all 5,120 bytes through
  `handle.readFile()` and only then failed inside the parser (`Invalid PDF structure.`), never with the message of the
  limit.

## What the red needed from the test

The watch of the size had to reach the real handle of the library, and the mock of `node:fs/promises` of the step-2
tests does not: `node:fs/promises` is a builtin, Vitest leaves it external for the modules of the application, and a
factory of `vi.mock` never sees the `open` of `lib/ingest/parse.ts` (proved with a throwaway case: the wrapper of
`open` counted no call of the library at all). The watch therefore goes on the prototype of the handle that `open`
returns, the object the library really calls:

- `tests/ingest.test.ts`: the helper `watchHandle(path, grown)` counts every byte that leaves the file, through `read`
  or through `readFile`, and, when `grown` carries bytes, writes them right after `stat` answered. That is the growth
  of the scenario, deterministically, with a real file and its real handle. `FileHandle` is not an export of
  `node:fs/promises` in Node 24 (it is an internal class), so the prototype is taken with
  `Object.getPrototypeOf(await open(path, "r"))`.
- The grown bytes of the case of 10.1 are a whole, valid DOCX built with the fixture of the suite, so a parser that
  ran is impossible to mistake for a refusal: `vi.spyOn(mammoth, "convertToHtml")` names it.
- The case of the file that is already above the limit at `stat` keeps its own test with zero reads of the handle, and
  the three cases report every observation at once (`expect.soft`) instead of only the first failure.
