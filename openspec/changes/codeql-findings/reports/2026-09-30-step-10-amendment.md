# Step 10 · the amendment of the contract: a bounded read, the cut markup and the reports

Contract: `tasks.md`, section 10 (tasks 10.1 to 10.5), and `design.md`, Amendment 1 (decisions 5 to 7). Agent:
deepseek-harness. Date: 2026-09-30. Change: `codeql-findings`, branch `feature/codeql-findings`, verified in the
`<worktree>`.

The review of Codex (`katalis-dev/tasks/revision-codeql-findings.md`) reproduced a Major and two Minors on `748c2d1`:

- **Major 1**: one open file is not enough. The file measured 5 bytes at `handle.stat()`, grew to 20,971,521 bytes
  before `handle.readFile()`, and all of it was read.
- **Minor 1**: HTML cut before its `>` leaves a fragment that looks like a tag (`<p>Horario</p><em sin-cierre` gives
  `Horario\n<em sin-cierre`), and the comment above the removal describes an expression that the code does not run.
- **Minor 2**: the reports name predecessor hashes that are not on the branch, or leave a placeholder where the commit
  that adds the report should be named.

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

## The green, with the fixes of `91c4946`

Task 10.3 landed in `91c4946` ("Read the bytes of the ingestion with a bound and drop markup cut before its `>`"), and
the same command answers green against the code of that commit:

```
$ npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/ingest.test.ts --no-cache --reporter=verbose

 RUN  v5.0.2 <worktree>

 Test Files  1 passed (1)
      Tests  29 passed (29)
   Duration  16.09s (tests 89%, environment 5%, import 3%, transform 2%, setup 1%)

exit=0
```

What the fix does, decision by decision:

- **Decision 5, one bounded read.** `parseFile` keeps refusing before any byte when `handle.stat()` is above
  `limits.maxBytes`. Otherwise it allocates `limits.maxBytes + 1` bytes and reads into them from the same handle with
  `handle.read`, in a loop, with an explicit position and until the file ends or the buffer is full. It never calls
  `handle.readFile()`. When more than `limits.maxBytes` bytes came back, the file grew while it was read: it refuses
  with the message of the limit, naming the bytes it read, and `parseBuffer` never runs. The parser receives exactly
  `buffer.subarray(0, bytesRead)`.
- **Decision 6, markup cut before its `>`.** `removeTags` repeats the removal until the text no longer changes and then
  takes every raw `<` that is left together with everything after it on its line. The comment above the removal now
  says what the expression does: one pass takes `<<b>i>` down to `i>`.
- **Decision 7, the evidence.** The reports of steps 1 to 9 are corrected in the section below.

The message of the refusal of the size limit does not change its shape: `<path> crosses the size limit: <n> bytes is
above the maximum of <max>.`, where `<n>` is the size of the open file when it was measured and the bytes that were
read when the file grew. No route, status, cookie, lock or limit of the ingestion changed, and the type detection, the
page limit and the rest of the conversion stay as they were.

## The reports of steps 1 to 9 (10.4, decision 7)

Every hash of every report of the change was checked against the branch: a token of seven to forty hexadecimal
characters that `git cat-file -t` answers as a commit has to be reachable from `HEAD`.

```powershell
foreach ($report in Get-ChildItem openspec/changes/codeql-findings/reports/*.md) {
  foreach ($match in [regex]::Matches((Get-Content $report.FullName -Raw), '\b[0-9a-f]{7,40}\b')) {
    if ((git cat-file -t $match.Value 2>$null) -eq "commit") {
      git merge-base --is-ancestor $match.Value HEAD
      if ($LASTEXITCODE -ne 0) { "outside the branch: $($report.Name) $($match.Value)" }
    }
  }
}
```

The scan found five hashes outside the branch and two placeholders, all of them in the reports of steps 1 to 9, and
left them corrected:

| Report | It said | It says now | What the name is |
|---|---|---|---|
| step 1 | `at this commit` | `69aa289` | the tree the base ran against |
| step 2 | `verified in the <worktree>`, `93dc0ca`, `the code of this commit` | `15f1fe3` | the fixes whose green the report took |
| step 4 | `93dc0ca`, a placeholder for the commit that adds the report | `15f1fe3`, `a19f0c3` | the code the review ran against, and the commit that carries the report |
| step 5 | `93dc0ca`, `0e586d1` | `15f1fe3`, `a19f0c3` | the code the checks ran against, and the commit that carries the report |
| step 6 | `fa14df1` | `8516e8c` | the commit that carries the report |
| step 7 | a placeholder for the commit that adds the report | `8516e8c` | the commit that carries the report |
| step 8 | (unchanged) | `a19f0c3` and `8516e8c` | already on the branch |
| step 9.2 | (unchanged) | `748c2d1` | the head the pipeline verified |

The names of the table were read from the history of the branch (`git log --oneline`): `79b0bdb` carries 1.1,
`15f1fe3` carries 2.1 to 3.3, `a19f0c3` carries 4.1 and 5.1, `8516e8c` carries 6.1, 7.1 and 8.1, and `748c2d1` carries
9.1. A report names the commit of the code it verified and never the commit that adds the report itself, which is read
from the history. The second run of the scan printed nothing, and the reports carry no placeholder and no hash outside
the branch.
