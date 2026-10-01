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
left them corrected. The hashes of the rewritten history are not copied here: a report carries no hash that is not on
the branch, this one included.

| Report | It said | It says now | What the name is |
|---|---|---|---|
| step 1 | `at this commit` | `69aa289` | the tree the base ran against |
| step 2 | no commit in its head, a hash of the rewritten history, and `the code of this commit` | `15f1fe3` | the fixes whose green the report took |
| step 4 | a hash of the rewritten history, and a placeholder for the commit that adds the report | `15f1fe3`, `a19f0c3` | the code the review ran against, and the commit that carries the report |
| step 5 | a hash of the rewritten history, and another one | `15f1fe3`, `a19f0c3` | the code the checks ran against, and the commit that carries the report |
| step 6 | a hash of the rewritten history | `8516e8c` | the commit that carries the report |
| step 7 | a placeholder for the commit that adds the report | `8516e8c` | the commit that carries the report |
| step 8 | (unchanged) | `a19f0c3` and `8516e8c` | already on the branch |
| step 9.2 | (unchanged) | `748c2d1` | the head the pipeline verified |

The names of the table were read from the history of the branch (`git log --oneline`): `79b0bdb` carries 1.1,
`15f1fe3` carries 2.1 to 3.3, `a19f0c3` carries 4.1 and 5.1, `8516e8c` carries 6.1, 7.1 and 8.1, and `748c2d1` carries
9.1. A report names the commit of the code it verified and never the commit that adds the report itself, which is read
from the history. The second run of the scan printed nothing, and the reports carry no placeholder and no hash outside
the branch.

The same check over every versioned file of the repository (637 tokens of seven to forty hexadecimal characters, 435 of
them commits) finds exactly one hash outside the branch: `b9cedbd`, in
`openspec/changes/archive/2026-09-29-elevenlabs-voice-agent/reports/2026-09-29-step-0-branch.md`. It is the archived
report of another change, it is not one of the reports of steps 1 to 9 that task 10.4 names, and it was not touched.

## The checks of the round (10.5)

`node -v` is v24.11.0 on this machine, below the `>=24.15.0` that `package.json` declares and the reason of the
`EBADENGINE` warning the review already recorded. The suite, the build and the browser suite ran with the Node 24 that
`npx -y -p node@24` provides, v24.21.0, inside the declared range. `npm run typecheck`, `npm run lint`,
`npm run secrets:scan`, `npm run openspec:validate` and `npm run audit:high` ran with the npm of the machine under Node
24.11.0, which is that warning and not a failure: all five answered what the table says. The build and the browser suite
ran in a clean disposable clone under `katalis-dev/community-codeql-amend-e2e`, which carries no `.env` at all and no
commit of its own, never in the `<worktree>`, whose ignored `.env.local` was never opened.

| Command | Where | Result |
|---|---|---|
| `npm run typecheck` | `<worktree>` | 0 errors |
| `npm run lint` | `<worktree>` | 0 problems |
| `npx -y -p node@24 node node_modules/vitest/vitest.mjs run` | `<worktree>` | 85 files, 1028 passed, 76.97 s |
| `npm run build` | clean clone | compiled in 6.1 s, 30 of 30 static pages |
| `npm run audit:high` | `<worktree>` | 0 vulnerabilities |
| `npm run secrets:scan` | `<worktree>` | 564 commits, no leaks |
| `npm run openspec:validate` | `<worktree>` | 14 of 14, 0 failed |
| `CI=1 npm run test:e2e` | clean clone | 87 passed, 2.4 min, one worker |

The outputs:

```
$ npm run typecheck

> cited@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully

$ npm run lint

> cited@0.1.0 lint
> eslint .

$ npm run audit:high

> cited@0.1.0 audit:high
> npm audit --audit-level=high

found 0 vulnerabilities

$ npm run secrets:scan

> cited@0.1.0 secrets:scan
> gitleaks git --redact --no-banner

7:33PM INF 564 commits scanned.
7:33PM INF scanned ~7579615 bytes (7.58 MB) in 3.74s
7:33PM INF no leaks found

$ npm run openspec:validate

> cited@0.1.0 openspec:validate
> openspec validate --all --strict

✓ spec/admin-panel
✓ spec/answering
✓ spec/app-skeleton
✓ change/codeql-findings
✓ spec/design-system
✓ spec/knowledge-search
✓ spec/owner-setup
✓ spec/product-identity
✓ spec/project-readme
✓ spec/provider-settings
✓ spec/public-chat
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
✓ spec/voice-agent
Totals: 14 passed, 0 failed (14 items)

$ npx -y -p node@24 node node_modules/vitest/vitest.mjs run

 RUN  v5.0.2 <worktree>

 Test Files  85 passed (85)
      Tests  1028 passed (1028)
   Duration  76.97s (tests 77%, environment 13%, import 4%, setup 4%, transform 2%)

exit=0
```

The clean clone, at the head of the branch. Its tree differs from the tree of this report only in the documents of the
change, so the code the checks verified is the code of `e48a658`:

```
$ node -v
v24.21.0

$ git log --oneline -1
e48a658 Name the verified commit in the reports of the round and drop the placeholders

$ npm run build

✓ Compiled successfully in 6.1s
✓ Generating static pages using 15 workers (30/30) in 525ms

exit=0

$ CI=1 npm run test:e2e

[WebServer] .env not found. Continuing without it.
Running 87 tests using 1 worker
  87 passed (2.4m)

exit=0
```

The clone answered `git status --short` empty after the walk, and no process of another worktree was started or
stopped: the ports 3100 and 3210 to 3217 were checked free before the run and the servers of the suite are its own.

## Issues

**BROKEN** — none. The Major 1 of the review is closed: `parseFile` reads at most `limits.maxBytes + 1` bytes from the
open handle, refuses with the bytes it read when the file grew, and never hands them to the parser; the test reproduces
the race deterministically with a real file and the real handle. The Minor 1 is closed with the removal of markup cut
before its `>`, and the Minor 2 with the corrected reports of steps 1 to 9.

**RISK**

- The bounded read allocates `limits.maxBytes + 1` bytes per file (`Buffer.allocUnsafe`), 20 MB and one byte with the
  limits of the product, whatever the size of the document. It is what decision 5 asks for literally; the uninitialized
  tail never leaves the function (`buffer.subarray(0, bytesRead)` is what the parser receives), and a file inside the
  limit does not pay for zeroing 20 MB. A smaller allocation that grows would need another decision of the contract.
- The rule of the cut markup takes a raw `<` with everything after it on its line. In the HTML of the converter that is
  right, because a `<` typed by an author arrives as `&lt;`; with hand-written HTML where a tag opens on one line and
  closes on the next, the rest of the line is lost. Decision 6 and the scenario ask for exactly this.
- Windows runs the checks under Node 24.11.0, below the `>=24.15.0` of `package.json`, and npm prints `EBADENGINE` for
  `jsdom` and its dependencies. The suite, the build and the browser suite of this round ran under Node 24.21.0, inside
  the declared range; the machine keeps its own Node for everything else.
- The `handle.read` loop trusts the bound and the explicit position, not the size that `stat` answered: a file that
  shrinks while it is read is parsed with the bytes that are really there, which is the same text the old
  `handle.readFile()` returned. No test pins the shrinking case.
- The scan of the whole repository finds one hash outside the branch, `b9cedbd`, in an archived report of the
  `elevenlabs-voice-agent` change (`openspec/changes/archive/2026-09-29-elevenlabs-voice-agent/`). It is outside the
  reports that task 10.4 names and outside this change, so it was left as it is; whoever owns that change decides.

**NOT DONE**

- CodeQL itself did not run locally: the CLI is not installed and no GitHub credential was used. That the four alerts
  are no longer reported is checked by the pipeline of the pull request, which task 10.6 asks Fable to push.
- Tasks 10.6 (push, second review of Codex, acceptance of Franc) and 9.4 are not part of this round.

**UNKNOWN**

- The current count of CodeQL alerts of the repository in GitHub, for the same reason. What is verified locally is the
  shape of the code the alerts point at: the bounded read of one handle (10.1), the removal of the tags and of the cut
  markup (10.2) and, from the round before, the scrypt of the password.

**Decisions taken by the implementer**

1. The watch of the size goes on the prototype of the real `FileHandle`, not on a mock of `node:fs/promises`: a builtin
   is external for the modules of the application, and a factory of `vi.mock` never sees the `open` of
   `lib/ingest/parse.ts` (proved with a throwaway case, removed before the commit). `FileHandle` is not an export of
   `node:fs/promises` in Node 24, so the prototype is taken from the handle that `open` returns.
2. The grown bytes of the first case of 10.1 are a whole DOCX of the fixture, and `mammoth.convertToHtml` is watched:
   "never calls the parser" cannot be shown by the message of a refusal alone, and a document that parses would be
   visible as an answer instead.
3. A second case grows the file past the limit and one byte (5,120 bytes against a limit of 1,024). A file that grows to
   exactly `maxBytes + 1` reads the same with and without the bound, so that case is what makes the "at most" of the
   scenario observable.
4. `expect.soft` in the three cases of the limit, so a red shows every observation of the race at once instead of only
   the first failure.
5. The reports of steps 1 to 9 are corrected in place, and the decisions of this round live in this report and in the
   delivery. The text of `tasks.md` (beyond its checkboxes), of `design.md` and of the specs is not touched: the round
   forbids it, so the section "Decisions taken by the implementer" of `design.md` keeps the five decisions of the first
   round.
