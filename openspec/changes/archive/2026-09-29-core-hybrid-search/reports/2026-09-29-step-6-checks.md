# Step 6 - The checks and the state of the store

- Date: 2026-09-29
- Change: `core-hybrid-search`
- Branch: `feature/core-hybrid-search`
- Agent: `deepseek-harness`
- Commit verified against: `39684fd` plus the working tree of the change (no commit of this execution is made until
  the closing one; the container run reproduces the tree file by file from the list `git ls-files` plus the new files)

## 6.1 The checks

### Windows 11, Node `v24.11.0`, npm `11.6.1`

| Command | Result |
|---|---|
| `npm test` | 9 files passed, 69 tests passed, 11.70 s |
| `npm run typecheck` | exit 0, `✓ Types generated successfully` |
| `npm run lint` | exit 0, no warning and no error |
| `npm run build` | exit 0, Turbopack, 3 static pages |
| `npm run audit:high` | `found 0 vulnerabilities` |
| `npm run secrets:scan` (gitleaks 8.30.1) | 40 commits scanned, `no leaks found` |
| `npx openspec validate --all --strict` | 4 passed, 0 failed |
| `git diff --check` | exit 0 (no whitespace error, no conflict marker) |
| `git ls-files --eol` | no `crlf`, no `mixed`: every tracked file is LF |

```
> npm test
 Test Files  9 passed (9)
      Tests  69 passed (69)
   Duration  11.70s

> npm run typecheck
> next typegen && tsc --noEmit
Generating route types...
✓ Types generated successfully
typecheck exit: 0

> npm run lint
> eslint .
lint exit: 0

> npm run build
▲ Next.js 16.3.6 (Turbopack)
✓ Compiled successfully in 982ms
Route (app)
┌ ○ /
└ ○ /_not-found
build exit: 0

> npm run audit:high
found 0 vulnerabilities
audit exit: 0

> npm run secrets:scan
40 commits scanned.
scanned ~972803 bytes (972.80 KB) in 1.11s
no leaks found
gitleaks exit: 0

> npx openspec validate --all --strict
- Validating...
✓ spec/app-skeleton
✓ change/core-hybrid-search
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 4 passed, 0 failed (4 items)
openspec exit: 0

> git diff --check
diff check exit: 0
```

### `node:24` Linux container, Node `v24.21.0`, npm `11.19.0`

A clean directory built from the tracked files plus the new ones, a real `git init` with the three agent links
materialised as symbolic links, `npm ci`, and then the battery:

```
=== npm ci ===
ci_exit=0
added 496 packages in 3m

=== tracked files ===
192

=== npm test ===
 Test Files  9 passed (9)
      Tests  69 passed (69)
   Duration  35.36s

=== typecheck ===
Generating route types...
✓ Types generated successfully

=== lint ===
> eslint .
(no output: clean)

=== build ===
✓ Generating static pages using 4 workers (3/3)
Route (app)
┌ ○ /
└ ○ /_not-found

=== audit ===
found 0 vulnerabilities
```

`npm ci` ran clean on Linux **after** the lock file was regenerated on Linux (see the note below), which is the check
the pipeline runs on its runner.

## The lock file had to be regenerated, and this is a real finding

`npm ci` on Linux failed with the lock file that `npm install` produced on Windows:

```
npm error `npm ci` can only install packages when your package.json and package-lock.json … are in sync.
npm error Missing: @emnapi/runtime@1.11.3 from lock file
npm error Missing: @emnapi/core@1.11.3 from lock file
```

The three new dependencies pulled in optional platform packages, and the Windows install wrote a lock file without
the entries the Linux install asks for. Regenerating the lock file **on Linux** (`npm install --package-lock-only`,
inside the `node:24` container) produced the file that now works on both: 616 entries, with `@emnapi/runtime`,
`@emnapi/core`, every `@img/sharp-*` platform package and every `@next/swc-*` binary listed. The regenerated file was
then installed on Windows with `npm ci` (exit 0, 609 packages) and the whole Windows suite passed again on top of it.

Without this fix the pipeline of the branch would have been red on its first run.

## Dependency review: no GPL and no AGPL

Every one of the 615 packages of the locked tree was read for its license:

| License | Packages |
|---|---|
| MIT | 397 |
| Apache-2.0 | 31 |
| ISC | 20 |
| BSD-2-Clause | 13 |
| MPL-2.0 | 5 |
| BSD-3-Clause | 5 |
| BlueOak-1.0.0 | 4 |
| MIT-0, CC0-1.0, 0BSD, BSD, Python-2.0, CC-BY-4.0, `(MIT AND Zlib)` | 1 each |
| `Apache-2.0 AND LGPL-3.0-or-later (AND MIT)` | 14 optional platform packages of `sharp` |
| `(MIT OR GPL-3.0-or-later)` | 1: `jszip` |
| unreadable on this platform (their entry in the lock file carries the license) | 128 |

- **No GPL and no AGPL in the tree.** The only package that names the GPL is `jszip`, dual-licensed
  `(MIT OR GPL-3.0-or-later)`, and the project takes it under **MIT**.
- The 14 packages that carry `LGPL-3.0-or-later` are the optional platform binaries of `libvips` behind `sharp`,
  which arrives with `next`; they are **LGPL, not GPL or AGPL**, and they are not a dependency this change added. They
  are recorded here because the finding is real and belongs to the maintainers of the launch change: a product that
  redistributes a container image with `sharp` inside must ship the LGPL notice and the offer of the library's source.
- The three dependencies this change added are `@libsql/client` (MIT), `mammoth` (BSD-2-Clause) and `pdf-parse`
  (Apache-2.0), and the parser licenses are also written in `docs/search.md`.

## 6.2 The state of the store before and after the tests

**Before the tests: the store does not exist.** This is the same proof as task 1.2, taken again at this commit:

```
> git ls-files | Select-String -Pattern '\.(sqlite|sqlite3|db|db3|sql|mdb)$'
(no output)

> Get-ChildItem -Recurse -File -Force -Include *.sqlite,*.sqlite3,*.db |
    Where-Object { $_.FullName -notmatch 'node_modules' }
(no output)

> Test-Path .data
False
```

**After the whole suite: still no store file anywhere in the working tree.** Every test of this change creates its
database with `mkdtempSync` under the temporary folder of the operating system and deletes it in `afterAll`:

```
> npx vitest run
 Test Files  9 passed (9)
      Tests  69 passed (69)

> Get-ChildItem -Recurse -File -Force -Include *.sqlite,*.sqlite3,*.db |
    Where-Object { $_.FullName -notmatch 'node_modules' }
(no output)

> Test-Path .data
False

> git status --short | Select-String -Pattern 'sqlite|\.data'
(no output)
```

## Counts of documents and passages in the test files

The suite asserts the counts inside each test; these are the numbers it demands:

| Test | Documents | Passages |
|---|---|---|
| `tests/store.test.ts` › stores a document by name and replaces it | 1 | 2 before and 2 after the second ingestion |
| `tests/store.test.ts` › keeps the keyword index in step | 1 | `countIndexed()` equals `countPassages()` |
| `tests/store.test.ts` › deletes the passages and the index rows | 0 after the delete | 0 after the delete |
| `tests/ingest.test.ts` › re-ingestion | 1 | the same number after the first and the second run |
| `tests/ingest.test.ts` › a broken file | 1 (`notas.md`) | 0 for `roto.pdf`, more than 0 for `notas.md` |
| `tests/ingest.test.ts` › the limits | 0 | 0 |
| `tests/search.test.ts` › the whole corpus | 3 | 6 |
| `npm run ingest -- samples/` (manual, step 7) | 4 | 11 |

The store file of the manual run of step 7 lived in the temporary folder of the machine and was deleted at the end of
the step, so it is not in the tree either.

## Verdict

PASS. Every check of task 6.1 is green on Windows and on `node:24` Linux, the store does not exist before the change
and no test leaves one behind, and the dependency review finds no GPL and no AGPL.
