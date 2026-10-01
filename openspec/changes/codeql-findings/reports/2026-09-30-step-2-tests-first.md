# Step 2 · tests first, and the three fixes

Contract: `tasks.md`, tasks 2.1 to 2.4 and 3.1 to 3.3. Agent: deepseek-harness. Date: 2026-09-30.
Change: `codeql-findings`, branch `feature/codeql-findings`, verified in the `<worktree>`.
Every command of this report ran with `--no-cache`: an earlier run reused a stale transform of `tests/ingest.test.ts`
and reported a false green, and the flag is what makes the run below reproducible.

The four alerts of the contract, each one with its test:

| Task | Test | Alert it closes | On `86b250f` |
|---|---|---|---|
| 2.1 | `tests/ingest.test.ts`, "decodes an entity once, whatever the author typed" | `js/double-escaping` | red |
| 2.2 | `tests/ingest.test.ts`, "removes the markup whole and keeps the text that looks like markup" | `js/incomplete-multi-character-sanitization` | red |
| 2.3 | `tests/ingest.test.ts`, "reads no path: the bytes come from the open file" | `js/file-system-race` | red |
| 2.4 | `tests/admin-session.test.ts`, "matches only the password of the panel, through scrypt and a constant-time comparison" | `js/insufficient-password-hash` | red |

## The red, with the implementation of `86b250f` in place

The three implementation files were put back to `86b250f` (`git stash push -- lib/ingest/parse.ts
lib/admin/session.ts`) and the two test files of this change ran against them:

```
$ npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/ingest.test.ts tests/admin-session.test.ts --no-cache --reporter=verbose

 RUN  v5.0.2 <worktree>

 × tests/admin-session.test.ts > the session of the panel > matches only the password of the panel, through scrypt and a constant-time comparison 7ms
   → expected [] to have a length of 8 but got +0
 × tests/ingest.test.ts > a Word document keeps its text as written > decodes an entity once, whatever the author typed 17ms
   → expected '5 < 6' to be '5 &lt; 6' // Object.is equality
 × tests/ingest.test.ts > a Word document keeps its text as written > removes the markup whole and keeps the text that looks like markup 1ms
   → docxToMarkdown is not a function
 × tests/ingest.test.ts > the limits > reads no path: the bytes come from the open file 3ms
   → expected +0 to be 1 // Object.is equality

 Test Files  2 failed (2)
      Tests  4 failed | 28 passed (32)
   Duration  29.44s (tests 94%, environment 3%, import 2%, setup 1%, transform 1%)

exit=1
```

- 2.1: the first failure is the bug of the proposal seen from the product. The fixture writes the XML of a paragraph
  whose author typed `5 &lt; 6`, so the converter's HTML holds `5 &amp;lt; 6`; the conversion of `86b250f` answers
  `5 < 6`.
- 2.2: `docxToMarkdown` was private, which is the "export the function for the test if it is not exported" of the task.
- 2.3: the counter of the recorded reads of a path is 0 where the case demands 1. The case reads the path once itself
  and then passes the same path to `parseFile`: with the code of `86b250f` (`readFile(path)` after `stat(path)`) the
  counter reaches 2, and with the code of this commit it stays at 1. The sibling case of the refusal collects the size
  of `statSync` and demands it inside the message, which is the "size comes from the open file" of the scenario. This
  is the strongest red available for an alert about a race: the race itself is not a behaviour a test can observe from
  the outside, so the case pins the shape the fix has to have.
- 2.4: the five comparisons of the old table pass (`passwordMatches` over SHA-256), and the counter of `scryptSync`
  proves that neither derivation of the spec ran, while `createHash` was the one that answered.

## The green, with the fixes of this commit

```
$ npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/ingest.test.ts tests/admin-session.test.ts --no-cache --reporter=verbose

 RUN  v5.0.2 <worktree>

 Test Files  2 passed (2)
      Tests  32 passed (32)
   Duration  16.29s (tests 88%, environment 6%, import 3%, setup 2%, transform 2%)

exit=0
```

## What was written

- `tests/fixtures/documents.ts`: a paragraph of a DOCX can now carry the XML of its runs itself (`raw`), which is the
  only way to write a `<w:br/>`, a hyperlink or an entity exactly as Word writes it; the fixture wraps that XML in its
  `<w:p>`.
- `tests/ingest.test.ts`: the two scenarios of `knowledge-search` and the two cases of the limit. The read of a path is
  watched with `vi.mock("node:fs/promises")` and the real functions wrapped, because the namespace of a builtin cannot
  be spied on in place in ESM (`Cannot spy on export "readFile". Module namespace is not configurable`).
- `tests/admin-session.test.ts`: the scenario "The right and the wrong password", with `node:crypto` mocked the same
  way, counting `scryptSync`, `timingSafeEqual` and `createHash`. The test proves the one salt of the process (sixteen
  bytes, the same for every derivation) and the empty `expected` that answers `false` without deriving.
- `lib/ingest/parse.ts`: `removeTags` repeats the removal of the markup until the text no longer changes (bound of ten
  passes), one `replace` with one table decodes `&nbsp;`, `&amp;`, `&lt;`, `&gt;`, `&quot;` and `&#39;` in a single
  pass, and `docxToMarkdown` is exported for the test of the scenario. `parseFile` opens the path once with
  `node:fs/promises`, reads the size with `handle.stat()`, refuses an oversized file before any byte, reads with
  `handle.readFile()` and closes in `finally`.
- `lib/admin/session.ts`: `passwordMatches` derives both values with `scryptSync(value, salt, 32)` under one salt of 16
  bytes drawn when the module loads and compares them with `timingSafeEqual`; an empty `expected` still answers `false`
  without deriving. `createHash` keeps serving the signature of the session cookie, never a password.

The message of the refusal of the size limit did not change, and no route, status, cookie, lock or limit of the
ingestion changed.

## Decisions taken by the implementer

1. The report of step 1 quoted the local path of the worktree in the line `RUN v5.0.2 ...` of the suite; it landed
   rewritten as `<worktree>` in `79b0bdb`, because the rule "no personal path in a versioned file" wins over a literal
   paste, and every later report carries the substitution from the start.
2. `docxToMarkdown` is exported although only the test uses it. The task says so explicitly ("export the function for
   the test if it is not exported"), and the scenario "Markup is removed whole" is written over the HTML of the
   converter, which no other door of the module exposes.
3. The two scenarios of `knowledge-search` are one case and one case, at the level the tasks name: 2.1 asserts the two
   passages of the scenario "An entity is decoded once" and 2.2 the three lines of the scenario "Markup is removed
   whole" plus the absence of the tags of its HTML.
4. The red of 2.3 runs against `86b250f` with the counter of reads of a path at 0 where the case demands 1. The two
   cases that the task also names ("a file above the byte limit is refused, and a spy on `fs/promises` shows that its
   size came from `FileHandle.stat` and that no `readFile` of the path ran") are kept as the two cases of the "limits"
   block: the refusal with the real size of the file, and the whole pass of `parseFile` that records no read of a path.

## Commit of this task

The red above was taken at `69aa289` with the three implementation files of `86b250f` in place, and the green at the
same tests with the fixes of this commit: `93dc0ca` ("Close the four CodeQL alerts of the product with their tests
first").
