## Context

CodeQL runs on every push and pull request since the repository became public. Its first run on `main` (`3985131`)
reported nine alerts; the five in scripts and tests were dismissed with their reasons, and the four below are the ones
this change closes. The alerts are listed on GitHub under Security → Code scanning, numbers 1, 2, 4 and 5.

## Decisions

1. **Tags first, entities after, in one pass each.** `docxToMarkdown` keeps its line rules (`</p>`, `</h1-6>`, `</li>`,
   `</tr>`, `</div>` and `<br>` become line breaks, `<li>` becomes `- `). The removal of every other tag repeats until
   the text no longer changes, with a bound of ten passes. Then one `replace` with one regular expression decodes
   `&nbsp;`, `&amp;`, `&lt;`, `&gt;`, `&quot;` and `&#39;` through a lookup table, so the output of one decoding is
   never decoded again. Numeric entities other than `&#39;` stay as they are today (mammoth does not write them).
2. **One open file.** `parseFile` opens the path with `fs/promises.open(path, "r")`, reads the size with
   `handle.stat()`, refuses a file above `limits.maxBytes` before reading any byte, reads the bytes with
   `handle.readFile()`, and closes the handle in `finally`. The message of the refusal does not change.
3. **scrypt for the password.** `passwordMatches(expected, given)` derives both strings with `scryptSync(value, salt,
   32)` from `node:crypto` with its default cost (N = 16384, r = 8, p = 1), under one `salt` of 16 bytes from
   `randomBytes(16)` drawn once when the module loads, and compares the derivations with `timingSafeEqual`. An empty
   `expected` still answers `false` without deriving. Two derivations cost about 100 ms per attempt, under the one
   second that every failed attempt already waits.
4. **No other behaviour changes.** The panel's routes, statuses, cookies, locks and messages stay as they are; the
   types and limits of the ingestion stay as they are.

## Decisions taken by the implementer

(The implementer writes here every decision the contract left open, and copies it to the `## Issues` of the report.)

1. The report of step 1 quoted the local path of the worktree in the line `RUN v5.0.2 ...` of the suite; it landed
   rewritten as `<worktree>` in `79b0bdb`, because the rule "no personal path in a versioned file" wins over a literal
   paste, and every later report carries the substitution from the start.
2. `docxToMarkdown` is exported although only the test uses it. Task 2.2 asks for it ("export the function for the test
   if it is not exported"), and the scenario "Markup is removed whole" is written over the HTML of the converter, which
   no other door of the module exposes.
3. The two scenarios of `knowledge-search` are one case and one case, at the level the tasks name: 2.1 asserts the two
   passages of the scenario "An entity is decoded once" and 2.2 the three lines of the scenario "Markup is removed
   whole" plus the absence of the tags of its HTML.
4. The red of 2.3 runs against `86b250f` with the counter of reads of a path at 0 where the case demands 1. The
   file-system race itself is not a behaviour a test can observe from the outside, so the case pins the shape the fix
   has to have: no read of a path, and the size of the refusal taken from the file that was measured.
5. The browser suite of step 7 ran twice: the first run, in a clean clone that carried a test `.env`, answered 4 failed
   and 22 did not run, because that file wins over the environment `playwright.config.ts` passes to every server of the
   suite (`CHAT_PROVIDER=fake` made the panels answer "Test provider, no network" where the specs demand "Not connected
   yet"). With a clone that carries no `.env`, the same 87 tests pass. The suite was not touched: the task never edits
   what it verifies.

## Amendment 1 (Fable, after `katalis-dev/tasks/revision-codeql-findings.md`: FAIL, Major 1 and two Minors)

Codex reproduced that one open file is not enough: the file measured 5 bytes at `handle.stat()`, grew to
20,971,521 bytes before `handle.readFile()`, and all of it was read. The decisions below replace decision 2 and complete
decision 1.

5. **A bounded read.** `parseFile` still refuses before reading any byte when `handle.stat()` is above
   `limits.maxBytes`. Otherwise it reads from the same handle at most `limits.maxBytes + 1` bytes (with
   `handle.read` into a buffer of that size, in a loop until the end of the file or the bound), never
   `handle.readFile()`. When it got more than `limits.maxBytes` bytes, the file grew while it was read: it refuses with
   the message of the limit, naming the bytes it read (`<path> crosses the size limit: <n> bytes is above the maximum
   of <max>.`), and the parser never sees them. The parser receives exactly the bytes read.
6. **Markup cut before its `>`.** In the converter's HTML a raw `<` only opens markup (a `<` an author typed arrives
   as `&lt;`). After the repeated removal, a raw `<` that is left is markup cut before its `>`: it is removed with
   everything after it on its line. The comment above the removal says what the expression does (one pass takes
   `<<b>i>` down to `i>`).
7. **Evidence names the code it verified.** A report names the commit of the code it verified; it never carries
   `__COMMIT__` or a hash that is not on the branch. The commit that adds a report is read from the history.
