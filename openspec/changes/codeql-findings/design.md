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
