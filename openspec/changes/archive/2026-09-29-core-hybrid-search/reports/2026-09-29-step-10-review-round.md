# Step 10 - Review round

- Date: 2026-09-29
- Change: `core-hybrid-search`
- Branch: `feature/core-hybrid-search`
- Agent: `deepseek-harness`
- Contract: section 10 of `tasks.md`, written by Fable after `katalis-dev/tasks/revision-community-02.md`
- Base of the round: `26b6d52` (the requirement of the token and section 10)
- Commits of the round: `e033c8b`, `ee7f411`, `dc81a18`, `5eaed5f`, `ce205c5`, `17a2989`, `2435664`, `c66d71a`

The three Majors of the review were reproduced first and corrected tests first, in small commits. The text of no task and
no line of the spec delta was edited. No `.env` file was opened (only the tracked template with empty values), there was
no push and no archive, and no test or command called a real provider or Turso.

## 10.1 Major 1: the page limit before the text

**Red test, commit `ee7f411`.** `tests/ingest.test.ts` › the limits › *refuses a file above the page limit before
extracting any text* installs `vi.spyOn(PDFParse.prototype, "getText")`, ingests a three-page PDF with `maxPages: 2`,
and asserts that the extraction was never called; then it parses a two-page PDF inside the limit and asserts one call,
so the spy cannot pass by never being installed.

```
> npx vitest run tests/ingest.test.ts

 ❯ tests/ingest.test.ts (11 tests | 1 failed) 3397ms
   ❯ the limits (2)
     × refuses a file above the page limit before extracting any text 28ms

 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
   Start at  22:46:47
   Duration  7.09s (tests 49%, environment 30%, import 13%, setup 5%, transform 3%)

⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/ingest.test.ts > the limits > refuses a file above the page limit before extracting any text
AssertionError: expected "getText" to not be called at all, but actually been called 1 times
Received:
  1st getText call:
    Array []
Number of calls: 1
 ❯ tests/ingest.test.ts:137:27

exit code 1
```

That is the Major of the review reproduced by the test itself: `PDFParse#getText()` was called before the page count
was compared.

**Fix, commit `dc81a18`.** `parsePdf` now asks `PDFParse#getInfo()` for the page count first (`InfoResult.total`, which
loads the document without extracting any text), throws the page-limit error when it crosses the maximum, and only then
calls `getText()`. `parseFile` passes `limits.maxPages` to `parseBuffer`, so the old check after the extraction is gone
and the decision lives in the one place that can act before the text exists.

```
> npx vitest run tests/ingest.test.ts

 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  22:47:08
   Duration  7.18s (tests 49%, environment 28%, import 13%, setup 7%, transform 3%)

exit code 0
```

`docs/search.md` said the PDF above 500 pages is refused before its text is extracted; with this fix the sentence is
true, and the documentation commit `17a2989` states that the count decides, not the extracted text.

## 10.2 Major 2: the token of a remote store

**Red tests, commit `5eaed5f`.** New `tests/store-remote.test.ts` doubles the libSQL client with
`vi.mock("@libsql/client", …)`, which records the configuration of every client the store creates and needs no network.
Three cases: a remote URL with an empty token must stop before a client exists, a remote URL with a token must create
the client with that URL and that token as `authToken`, and a local `file:` URL must receive no token.

```
> npx vitest run tests/store-remote.test.ts

 Test Files  1 failed (1)
      Tests  2 failed | 1 passed (3)
   Start at  22:47:59
   Duration  2.31s (environment 81%, setup 13%, transform 3%, tests 1%, import 1%, worker 1%)

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/store-remote.test.ts > a remote libSQL database > stops before creating a client when its token is empty
AssertionError: expected '' to match /TURSO_AUTH_TOKEN/
- Expected:
/TURSO_AUTH_TOKEN/
+ Received:
""
 ❯ tests/store-remote.test.ts:54:21

 FAIL  tests/store-remote.test.ts > a remote libSQL database > creates the client with the url and the token
AssertionError: expected [ Array(1) ] to deeply equal [ { …(2) } ]
- Expected
+ Received
  [
    {
-     "authToken": "token-de-prueba",
      "url": "libsql://example.turso.io",
    },
  ]
 ❯ tests/store-remote.test.ts:64:22

exit code 1
```

The red run of the review is the same JSON the reviewer pasted: the client was created with the URL only, no token, and
nothing stopped an empty token. The token literal of the tests is a placeholder, not a credential, and no value of the
environment is printed.

**Fix, commit `ce205c5`.** `openStore(path, options)` resolves the URL, and for a remote protocol (`libsql:`, `http:`,
`https:`, `ws:`, `wss:`) reads `TURSO_AUTH_TOKEN` from the environment (the caller may pass one, as tests and the
embedding provider already do). An empty token throws before the client is created, with a message that names the
variable and carries no URL and no value; the token travels to `createClient` as `authToken`. A local `file:` URL keeps
the previous path and receives no token.

```
> npx vitest run tests/store-remote.test.ts tests/store.test.ts

 Test Files  2 passed (2)
      Tests  11 passed (11)
   Start at  22:48:21
   Duration  4.06s (environment 50%, tests 38%, setup 7%, import 2%, transform 2%)

exit code 0
```

**Documentation, commit `17a2989`.** `.env.example` keeps `TURSO_AUTH_TOKEN=` empty and its comment now says when it is
required (a remote `libsql://`, `https://` or `wss://` URL; a local file needs none); `docs/search.md` section 1 states
that the token travels to the client as `authToken` and that an empty value stops the run before any query with a
message that names the variable and never a value.

## 10.3 Major 3: the two rankings isolated, proved by mutation

The reviewer was right about the corpus: the old meaning-only question `¿puedo mover mi cita a otro día?` shares the
exact tokens `mover` and `cita` with the cancellation passage, so FTS5 ranked it first, and the old keyword-only
assertion (`horario.md` appears somewhere in the results of `taller`) was satisfied by the vector ranking alone, which
returns every passage of this small corpus inside the top 50. New tests, commit `2435664`:

- *ranks a keyword-only match that the vector ranking does not rank first* uses `mantenimiento`, a rare exact term of
  one passage. It asserts the keyword ranking itself returns that passage first, that the vector ranking does not
  return it first, that the hybrid search returns it first with `limit: 1`, and that with the keyword branch of the
  store silenced the match is lost.
- *ranks a meaning-only match with no shared term and an empty keyword ranking* uses
  `¿Aceptan reprogramaciones gratuitas avisando anticipadamente?`, which shares no token with the corpus. It asserts
  the keyword ranking is empty, that the hybrid search returns the cancellation passage first with the score of a
  single ranking (`1/61`), and that with the vector branch silenced the result is empty.

The isolation of the tests lives in those assertions; the mutation runs below are the proof that a regression of either
branch is caught.

**Run 1, the real search.**

```
> npx vitest run tests/search.test.ts

 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  22:50:11
   Duration  6.25s (tests 74%, environment 17%, import 5%, setup 3%, transform 2%)

exit code 0
```

**Run 2, the vector branch disabled.** Temporary mutation, never committed: `lib/search/index.ts:31` replaced by
`const vector: never[] = [];`, reverted afterwards with `git checkout -- lib/search/index.ts`.

```
> npx vitest run tests/search.test.ts

 ❯ tests/search.test.ts (10 tests | 1 failed) 4469ms
   ❯ hybrid search (5)
     × ranks a meaning-only match with no shared term and an empty keyword ranking 5ms

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  22:54:59
   Duration  7.05s (tests 65%, environment 20%, import 10%, setup 3%, transform 2%)

⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/search.test.ts > hybrid search > ranks a meaning-only match with no shared term and an empty keyword ranking
AssertionError: expected undefined to be 'politicas.md' // Object.is equality
- Expected:
"politicas.md"
+ Received:
undefined
 ❯ tests/search.test.ts:176:23

exit code 1
```

**Run 3, the keyword branch disabled.** Temporary mutation, never committed: `lib/search/index.ts:30` replaced by
`const keyword: never[] = [];`, reverted afterwards.

```
> npx vitest run tests/search.test.ts

 ❯ tests/search.test.ts (10 tests | 1 failed) 4511ms
   ❯ hybrid search (5)
     × ranks a keyword-only match that the vector ranking does not rank first 7ms

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  22:55:15
   Duration  6.23s (tests 74%, environment 16%, import 6%, setup 3%, transform 2%)

⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/search.test.ts > hybrid search > ranks a keyword-only match that the vector ranking does not rank first
AssertionError: expected 3 to be 4 // Object.is equality
- Expected
+ Received
- 4
+ 3
 ❯ tests/search.test.ts:154:35

exit code 1
```

The mutation matrix is one test per branch: disabling the vector ranking loses only the meaning-only case, disabling the
keyword ranking loses only the keyword-only case, and both pass with the real search. The passage numbers of the runs
are the ones of the test corpus of `tests/search.test.ts`: 3 is `horario.md` (the passage with `mantenimiento`), 4 is
the `Pagos` heading of `pagos.md` (the vector favourite of that question) and 2 is the `Cambios y cancelaciones`
passage of `politicas.md`.

**Corrected reports, commit `c66d71a`.** The two claims that contradicted the real corpus are corrected in place, with
a note that names the review and this report:

- `reports/2026-09-29-step-3-tests-first.md`: the two rows of the scenario table now carry the test names and the real
  demand, and the note records that the old meaning-only question shared `mover` and `cita`.
- `reports/2026-09-29-step-4-implementation.md`: the two bullets of 4.5 now say which question isolates each ranking
  and that the old question shared the exact tokens of the passage.

## 10.4 The battery

Windows 11, Node `v24.11.0`, on the clean tree of `c66d71a`:

```
> npm test

 Test Files  10 passed (10)
      Tests  72 passed (72)
   Start at  22:51:00
   Duration  8.42s (environment 54%, tests 29%, setup 10%, import 4%, transform 3%, worker 1%)

exit 0

> npm run typecheck

> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully

exit 0

> npm run lint

> eslint .

exit 0

> npm audit --audit-level=high

found 0 vulnerabilities

exit 0

> npm run secrets:scan

10:51PM INF 62 commits scanned.
10:51PM INF scanned ~1175806 bytes (1.18 MB) in 674ms
10:51PM INF no leaks found

exit 0

> npx openspec validate --all --strict

- Validating...
✓ spec/app-skeleton
✓ change/core-hybrid-search
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 4 passed, 0 failed (4 items)

exit 0

> git diff --check main...HEAD

(no output)

exit 0

> git status
On branch feature/core-hybrid-search
nothing to commit, working tree clean
```

The nine files of the previous battery are ten now because of `tests/store-remote.test.ts`, and the 69 tests are 72
because of its three cases; the new one is hermetic, with the libSQL client doubled in the module and no network.

Linux x64, image `node@sha256:64af3819f9275802414d7cdc38c27e9d82bd564dec4d4da87d008255d36c63b4`, Node `v24.21.0`, on a
native clone of `c66d71a` outside the repository:

```
> docker run --rm -v <clone>:/work -w /work node:24 npm ci

added 496 packages, and audited 497 packages in 2m

170 packages are looking for funding
found 0 vulnerabilities

exit 0

> docker run --rm --network none -v <clone>:/work -w /work node:24 sh -c "node --version && npm test"

v24.21.0

 Test Files  10 passed (10)
      Tests  72 passed (72)
   Start at  04:53:58
   Duration  14.04s (environment 67%, setup 18%, import 10%, tests 2%, transform 1%, worker 1%)

exit 0
```

The suite ran with `--network none`, as the whole battery of this change does.

## Verdict

PASS. The three Majors are corrected with tests that fail before the fix and mutation runs that fail with the branch
disabled; every `[x]` of section 10 rests on this report. `main` stays at `2e1e580`, the tree is clean at the closing
commit, and nothing was pushed and nothing was archived.
