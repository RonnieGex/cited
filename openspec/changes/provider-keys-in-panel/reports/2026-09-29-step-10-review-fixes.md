# Step 10: what the review of Codex reproduced

- Contract: `openspec/changes/provider-keys-in-panel/tasks.md`, section 10 (amended by Fable after
  `katalis-dev/tasks/revision-community-12.md`)
- Branch: `feature/provider-keys-in-panel`, in the worktree `katalis-dev/community-ins`
- Base: `main` `c07640b`; the change starts at `71f08f0`
- HEAD at the start of the round: `9a47f41` ("Keep provider errors and private networks out, hold the test limit, and
  record the store")
- Fixes: 10.1 (this first part), 10.2, 10.3, 10.4, 10.5, 10.6, 10.7 and 10.8
- Reports of the earlier steps: `reports/2026-09-29-step-{0,1,2,3,4,5,6,7,8,9}-*.md`

This report is written in parts, one per commit of the round, so that every `[x]` of section 10 points at the exact
command, the commit and the output that support it. The report of a step is always at this path inside the change
folder, which is what survives the archive.

## 10.1 Blocker B-1: no provider error text leaves the server

**The finding.** `app/api/ask/route.ts` turned any exception into `error.message` and answered it as the `error` field
of a 503. The SDK puts the body of the provider's error inside that message, so a provider that echoes the credential
it received made `/api/ask` echo the decrypted key. Codex reproduced it with `RAW_ERROR_REPRO
status=503 leaks_saved_key=true`.

### Red before the fix

Command:

```text
npx vitest run tests/provider-review-errors.test.ts --reporter=verbose
```

Output (HEAD `9a47f41`, before any fix of this round):

```text
 × tests/provider-review-errors.test.ts > a provider that echoes the saved key > leaves no part of the key or of the
provider text in the answer of /api/ask 124ms
 × tests/provider-review-errors.test.ts > a provider that echoes the saved key > leaves no part of the key or of the
provider text in the answer of the test route 58ms
 ✓ tests/provider-review-errors.test.ts > a provider that echoes the saved key > keeps the key and its ciphertext out
of the save answer and of the panel state 67ms
 × tests/provider-review-errors.test.ts > no name of a variable outside For the installer > does not name the missing
chat variable in the answer of /api/ask 63ms
 × tests/provider-review-errors.test.ts > no name of a variable outside For the installer > does not name the missing
embeddings variable in the answer of /api/ask 64ms
 ✓ tests/provider-review-errors.test.ts > no name of a variable outside For the installer > keeps the variable of the
CLI message for whoever installs 58ms
 Test Files  1 failed (1)
      Tests  4 failed | 2 passed (6)
```

The first assertion is the Blocker itself, byte for byte:

```text
AssertionError: expected '{"status":"unavailable","error":"Inco…' not to contain 'sk-guardada-0000000000007788'
```

The provider of this file is a local HTTP double on `127.0.0.1` that answers `401` and writes into its message the
authorization header it received; no test reaches a real provider and none opens a private network. The second
failure of the list is the harness of the test itself (the route answered 503 because `ADMIN_PASSWORD` was not in the
environment of that case); it was corrected in the same commit, and the corrected run is the one of "green" below.

### The fix

- `lib/guards/outbound.ts`: the last door of the server. `sanitizeOutbound()` removes every shape of a secret
  (`sk-`, `sk-ant-`, `AIza`, `gsk_`, `sk-or-`, `hf_`, `Bearer`, `key=`, the `v1:` of a sealed value, a long base64 or
  hexadecimal run); `publicMessage()` also refuses a name of a variable of the environment and caps the text;
  `describeProviderError()` writes a sentence from an exception and answers nothing when the exception had nothing
  safe to show.
- `app/api/ask/route.ts`: the public route answers its own closed sentences (`NOT_CONNECTED`, `NO_ANSWER`) and never
  quotes the provider, not even redacted. `failed()` passes every message of the pipeline through `publicMessage()`,
  because the messages of `askQuestion()` name `MAX_QUESTION_CHARS`, `RATE_LIMIT_PER_IP_PER_HOUR` and
  `DAILY_MODEL_CALL_LIMIT` for the command line. The pipeline call has its own `catch`: the text of an SDK error can
  no longer be the body of the response.
- `lib/settings/providers.ts`: `embeddingsConfigured()`, so the route can answer its own sentence when the search
  cannot look for meaning, instead of the diagnostic that names `EMBEDDINGS_PROVIDER`.
- `lib/providers/test.ts`: `withClosedReason()`, which turns whatever the test of a provider throws into one of the six
  closed reasons of the requirement "Testing a provider is bounded". The routes of the test and of the save use it.
- `app/api/admin/providers/reindex/route.ts`, `app/api/admin/documents/route.ts` and
  `app/api/admin/documents/reingest/route.ts`: their messages go through `sanitizeOutbound()`.
- `tests/ask-route.test.ts` and `tests/provider-answering.test.ts`: three expectations changed from "the answer names
  the variable" to "the answer never names it", with the reason written next to each one. The CLI keeps naming it,
  which is what `proposal.md` allows for whoever installs.

### Green after the fix

```text
npx vitest run tests/provider-review-errors.test.ts tests/outbound.test.ts --reporter=verbose
 ✓ … (12 tests)
      Tests  12 passed (12)
```

```text
npm test
 Test Files  46 passed (46)
      Tests  420 passed (420)
 Duration  13.25s
```

```text
npm run typecheck
✓ Types generated successfully

npm run lint
(no output)
```

## 10.2 Major M-1: the address of a provider cannot reach the private network

**The finding.** `lib/admin/provider-request.ts` took `baseUrl` straight from the JSON of the browser and
`lib/providers/test.ts` preferred it over the catalogue without checking scheme, host or resolved address, and without
`redirect: "manual"`. Codex reproduced an authenticated SSRF: `SSRF_REPRO status=200 internal_requests=1`, with the
service of loopback receiving `Authorization: Bearer review-only-key-0001`.

### Red before the fix

The rule did not exist: `lib/providers/address.ts` is new in this commit, and the first run of the new suites was the
missing module itself, which is the red of a rule that is not there yet:

```text
npx vitest run tests/provider-address.test.ts
Error: Failed to resolve import "@/lib/providers/address" from "tests/provider-address.test.ts".
```

The reproduction of the review was repeated through the routes once the guard existed, and it is what the green run
below covers: the address of the internal double is refused with `400` and `internal.requests` stays empty.

### The fix

- `lib/providers/address.ts` (new): `providerAddress()` decides before anything is called. An address is accepted only
  for Ollama, LM Studio and a custom OpenAI-compatible endpoint; a cloud provider must name the official host of the
  catalogue **or** the one whoever installs wrote in `OPENAI_BASE_URL` and its siblings, which is the only address the
  panel itself offers; the scheme is `https`, and `http` only to a local host with `ALLOW_LOCAL_PROVIDERS=1`; the host
  is resolved with `node:dns` and every answer is checked against loopback, link-local, RFC 1918, carrier-grade NAT,
  multicast, documentation and the metadata address, including the IPv4-mapped form; and the caller is told
  `redirect: "manual"`.
- `lib/providers/test.ts`: the rule runs first in `testProvider()`, and the call itself now passes
  `redirect: "manual"` and treats a `3xx` as `unreachable`. `TestReason` gained `address_not_allowed`.
- `lib/admin/provider-request.ts`: `providerAddressProblem()` and `PROVIDER_ADDRESS_ERROR`, shared by the test and the
  save routes, which answer `400` with `reason: "address_not_allowed"` **before** the hourly limit is spent and before
  any key is offered to an address.
- `components/admin/ProviderConnect.tsx` and `lib/i18n/admin.ts`: the seventh word of the interface, in English and in
  Spanish, so the owner reads why the address cannot be used.
- `.env.example`: `ALLOW_LOCAL_PROVIDERS`, with the ranges it lifts; `docs/providers.md`: the section "The address of a
  provider cannot reach the private network", the new row of the table of answers and the note in the catalogue.
- `tests/provider-routes.test.ts` and `tests/admin-helpers.ts`: the cases that send the URL of a local double now say
  in the environment that `OPENAI_BASE_URL` (or the variable of its provider) is that double and that the installation
  allows local providers — which is what the rule asks of a real installation with a provider on its own machine. The
  suite is the same; the environment of each case is the honest one.

### Green after the fix

```text
npx vitest run tests/provider-address.test.ts tests/provider-address-route.test.ts --reporter=verbose
 ✓ … (18 tests)
      Tests  18 passed (18)
```

```text
npm test
 Test Files  48 passed (48)
      Tests  438 passed (438)
 Duration  16.71s
```

```text
npm run typecheck
✓ Types generated successfully

npm run lint
(no output)
```

## 10.3 Major M-2: the limit of twenty tests holds under concurrency

**The finding.** `lib/admin/provider-panel.ts` read the counter with `providerTestsInWindow()` and incremented it with
`recordProviderTest()` in two separate operations, so several requests observed the same value before any of them
reserved its slot. Codex reproduced it with forty authenticated requests: `RATE_REPRO allowed=40 limited=0
provider_calls=40`.

### Red before the fix

Command:

```text
npx vitest run tests/provider-limit.test.ts --reporter=verbose
```

Output (HEAD `9a56392`, before this fix):

```text
 ✓ … reserves the twentieth slot and refuses the twenty-first 112ms
 × … reserves exactly twenty slots when forty arrive at the same time 157ms
   → expected 40 to be 20 // Object.is equality
 × … lets exactly twenty of forty concurrent requests reach the provider 248ms
   → expected 40 to be 20 // Object.is equality
 × … keeps the twentieth slot when the requests arrive in bursts of one window 132ms
   → expected [ { allowed: true }, …(24) ] to have a length of 20 but got 25
      Tests  3 failed | 1 passed (4)
```

The second failure is the reproduction of the review, with the same numbers: `allowed` 40, `provider_calls` 40. The
provider of the case is the local HTTP double of the suite.

### The fix

- `lib/store/index.ts`: `reserveProviderTest(windowStart)` replaces `recordProviderTest()` and
  `providerTestsInWindow()`. It **writes first and counts after**, and the two statements (`DELETE` of the windows that
  are not the current one, and the `INSERT ... ON CONFLICT ... RETURNING count`) travel as one `batch(..., "write")`,
  which is one atomic transaction: the row the twentieth request leaves behind is the wall the twenty-first one finds.
  The cleanup of the old windows rides in the same batch, so the table cannot grow for ever.
- `lib/admin/provider-panel.ts`: `reserveProviderTest()` reads the count that operation returns, so the decision is
  taken inside the atomic operation and never before it.

### Green after the fix

```text
npx vitest run tests/provider-limit.test.ts --reporter=verbose
 ✓ … (4 tests)
      Tests  4 passed (4)
```

```text
npm test
 Test Files  49 passed (49)
      Tests  442 passed (442)
 Duration  24.02s
```

```text
npm run typecheck
✓ Types generated successfully

npm run lint
(no output)
```

The exact numbers of the reproduction are the ones the suite checks: `allowed` 20, `limited` 20 and
`seen.requests` 20.

## 10.4 Major M-3: no page of the panel names a variable of the environment

**The finding.** `proposal.md` says that no page shows a variable name outside "For the installer", and the
specifications of `answering` and `knowledge-search` ask the opposite of two messages that reach the browser. Codex
left the contradiction open, and the amendment of Fable resolved it: the **API error bodies and the command-line
messages** may name a server variable — the diagnostic of whoever installs — and the **pages of the panel** may not.

### Red before the fix

The suite is new, so its first run was also the run that found the leak. The test renders every page of the panel with
the environment of an installation halfway through its setup, and it made two things visible at once:

```text
npx vitest run tests/admin-pages-variables.test.ts --reporter=verbose
 × … keeps them out of AI and keys when nothing is connected 4ms
 × … keeps them out of AI and keys when the server has half a configuration 2ms
 × … keeps them out of AI and keys in Spanish too 2ms
 × … keeps them out of the other pages of the panel 2ms
 × … shows them on For the installer, which is the page of whoever installs 1ms
 × … keeps the diagnostic of the missing variable in the command line of the installer 59ms
   → expected 'the openai embeddings provider needs …' to contain 'EMBEDDINGS_PROVIDER'
 × … answers the upload of the panel without naming a variable 104ms
   → expected '{"status":"invalid","error":"EMBEDDIN…' not to contain 'EMBEDDINGS_PROVIDER'
      Tests  7 failed | 2 passed (9)
```

The first five were the harness of the test itself (the pages could not be rendered without the mock of
`next/headers` and without the state of the store), and they were corrected in this same commit; the honest red of the
Major is the two that survived, and they are the leak itself:

- `app/api/admin/documents/route.ts` answered the upload of a document with
  `"EMBEDDINGS_PROVIDER is empty and the panel holds no embeddings provider: …"`, which the panel renders as its own
  alert — the name of a variable on a page of the owner.
- `app/api/admin/providers/reindex/route.ts` said "the search provider is not ready", which was already in the words of
  the panel and is now shared with the other route instead of duplicated.

### The fix

- `lib/settings/providers.ts`: `panelEmbeddingsProblem()`, the same state as `embeddingsProblem()` in the words of the
  owner. `embeddingsProblem()` keeps naming the variables, because the command line of whoever installs reads it.
- `app/api/admin/documents/route.ts`: the upload answers `panelEmbeddingsProblem()` before it reads the file, so the
  owner never reads the name of a variable and the message arrives before any work.
- `app/api/admin/providers/reindex/route.ts`: it uses the shared function instead of its own copy.
- `tests/admin-pages-variables.test.ts` (new): it renders `/admin/ai`, `/admin/business`, `/admin/conversations` and
  `/admin/documents`, reads the text a browser would receive and compares it with **every variable of
  `.env.example`**, read from the template itself, so a variable added tomorrow is covered without touching the test.
  It also proves the other half of the amendment: For the installer does show them, and the CLI diagnostic still names
  the variable.

### Green after the fix

```text
npx vitest run tests/admin-pages-variables.test.ts
      Tests  9 passed (9)
```

```text
npm test
 Test Files  50 passed (50)
      Tests  451 passed (451)
 Duration  21.62s
```

## 10.5 Major M-4: the affiliate switch on, and every administrative answer read

**The finding.** Task 2.3 asked for an E2E of the affiliate links on and off, and task 7.1 asked for it complete; only
the `off` case existed. And task 6.1 claimed "every `/api/admin/*` response" while its report visited eight of the
fifteen routes of the tree. Codex marked both as a Major because the evidence did not support the mark.

### What was missing, and why the `on` case could not exist

No affiliate URL is committed in this change (decision 6 of `design.md`), so the browser could only ever show the
`off` path. The door that was missing is the one whoever joins a programme needs: the catalogue now reads the address
of a programme from the environment, `<PROVIDER>_AFFILIATE_URL`, and `affiliateUrlOf()` is its only reader. The browser
suite of `e2e/affiliate.spec.ts` writes a virtual address of the documentation there and sees the label in a real
browser.

### The fix

- `lib/providers/catalog.ts`: `affiliateUrlOf()`, fed by `DEEPSEEK_AFFILIATE_URL` and its siblings.
- `playwright.config.ts` and `e2e/admin-fixtures.ts`: a third service of the panel (port 3215, its own store, its own
  encryption key) with `AFFILIATE_LINKS=on` and `DEEPSEEK_AFFILIATE_URL` set; `workers: 1`, because the suite of the
  keys and the new one serve their provider double on the same port 3216; and `ALLOW_LOCAL_PROVIDERS=1` in the
  environment of the two services whose provider is the local double, which the rule of the address asks of an
  installation with a provider on its own machine.
- `e2e/affiliate.spec.ts` (new): the labelled link before the click and the plain link nowhere, then the save of a key
  and the read of **every** route of `/api/admin/*` — the fifteen of the tree, with the method and the body each one
  needs, including the ones the review listed as never read (`providers` DELETE, `reindex`, `documents/delete`,
  `documents/reingest`, `setup/test`, `logout`, `business/logo` and `conversations/delete`) — plus the pages of the
  panel, the raw bytes of the store and the row of `provider_settings` through `node:sqlite`.
- `tests/affiliate-links.test.ts` (new): the guard of that list. It walks `app/api/admin/**/route.ts` and fails if one
  of them is not written in the spec, so a route added later cannot go unread; and it proves the four combinations of
  the affiliate switch.
- `.env.example` and `docs/providers.md`: the variable of the programme and how it is read.

### Green after the fix

```text
npx playwright test --reporter=list
  ok 29 [affiliate] › e2e\affiliate.spec.ts:94:5 › the affiliate link is labelled before the click and the plain link is nowhere
  ok 30 [affiliate] › e2e\affiliate.spec.ts:119:5 › the key is tested, saved, and never comes back in any response nor in the store
  30 passed (40.1s)
```

The count of the browser suite went from 28 to 30: the two cases of the new service.

## 10.6 Major M-5: the state of the store before and after

**The finding.** The reports of steps 1 and 8 recorded `git status`, the tests, the types, the lint and OpenSpec, and
never the tables, the row counts or the state of the database. The standard of the change distinguishes the state of
Git from the state of the database: one does not prove the other.

### The tool

`scripts/store-state.ts` (new), with `npm run store:state`: it opens the store the application uses — `openStore()`
creates the tables that are missing, which is what the first query does — and then reads the file in read-only mode to
print every table with its row count and to mark the ones this change added. `lib/store/index.ts` exports `storeTables`
so the reader and the test of the schema share one list.

### Before

```text
$ git show 71f08f0:lib/store/index.ts | Select-String 'CREATE TABLE|CREATE VIRTUAL TABLE'
CREATE TABLE IF NOT EXISTS documents (
CREATE TABLE IF NOT EXISTS passages (
CREATE VIRTUAL TABLE IF NOT EXISTS passages_fts USING fts5(text)
CREATE TABLE IF NOT EXISTS rate_limits (
CREATE TABLE IF NOT EXISTS model_calls (
CREATE TABLE IF NOT EXISTS conversations (
CREATE TABLE IF NOT EXISTS login_attempts (
CREATE TABLE IF NOT EXISTS business (

$ git show 71f08f0:lib/store/index.ts | Select-String 'provider_settings|provider_tests|document_index' | Measure-Object
Count: 0
```

**Eight tables, and none of the three this change adds.** The state of a fresh store of that version, read with the
reader of today:

```text
$ node scripts/store-state.ts .data/step-10-before.sqlite
store: .data/step-10-before.sqlite
tables: 12 (plus the 5 of the full-text index)
  documents rows=0
  passages rows=0
  passages_fts rows=0
  rate_limits rows=0
  model_calls rows=0
  conversations rows=0
  login_attempts rows=0
  business rows=0
  provider_settings rows=0 (added by this change)
  provider_tests rows=0 (added by this change)
  document_index rows=0 (added by this change)
rows of the tables this change added: 0
```

### After

A key is sealed and saved in that store (a throwaway script of the run, deleted afterwards; the key and the master key
are strings of the verification and live only in the process), and the state is read again:

```text
$ node scripts/store-state.ts .data/step-10-before.sqlite
store: .data/step-10-before.sqlite
tables: 12 (plus the 5 of the full-text index)
  documents rows=0
  passages rows=0
  passages_fts rows=0
  rate_limits rows=0
  model_calls rows=0
  conversations rows=0
  login_attempts rows=0
  business rows=0
  provider_settings rows=1 (added by this change)
  provider_tests rows=0 (added by this change)
  document_index rows=0 (added by this change)
rows of the tables this change added: 1
```

```text
$ node -e "…SELECT provider, model, key_ciphertext, key_last4 FROM provider_settings…"
provider=deepseek model=deepseek-flash last4=4321
ciphertext starts with v1: true
ciphertext carries the key: false
ciphertext length: 89
```

The table this change added is empty before the change and carries the row the save writes after it, with the ciphertext
and never the key. The disposable worktree that held the version before the change was removed and pruned
(`git worktree list` no longer shows `.tmp-store-before`).

## 10.7 The two Minors: the count of commits and gitleaks before each one

**m-1.** The delivery said "8 commits on the contract" and the branch carried ten after `71f08f0`. The count, with the
exact command, before this closing commit:

```text
$ git log --oneline --reverse 71f08f0..HEAD
e12d34a Start the keys in the panel: the branch, the install and the loop state
3c66f68 Record the green base of the branch before the keys in the panel
f2fd3cb Write the tests of the keys in the panel first, red before the code
be42a26 Connect the AI from the panel: encrypted keys, one resolver and the page AI and keys
aa07ef6 Report the tests first and the implementation of the keys in the panel
33c3b8d Review the whole suite and the existing tests the change touches
3edd7ad Check the branch, verify it with curl and capture the page of the keys
152a641 Repeat the base after the change and repair the path of the report
c568c3b Write where the keys live: the providers guide, the template, the security rows and the two READMEs
5404823 Close the keys in the panel: the documentation, the delivery and the state in DONE
9a47f41 Keep provider errors and private networks out, hold the test limit, and record the store
c016b81 Keep the provider text and the variable names out of the browser
9a56392 Refuse a provider address that reaches inside the network
f62849f Reserve the test slot before the call, never after it
02dfe38 Speak the words of the owner on every page of the panel
be5509e Show the paid link in the browser and read every administrative answer
388c6f5 Read the state of the store, not only the state of Git

$ git log --oneline 71f08f0..HEAD | Measure-Object | Select-Object -ExpandProperty Count
18
```

The delivery is corrected with this number in the closing commit of the round: ten commits between `71f08f0` and
`5404823` (`9a47f41` included) and the seven of this round. The count moves with the commit that writes it — the one
that carries this line is the eighteenth, and the delivery says nineteen with the correction itself — so the number is
written with the command that reads it.

The count of the commits of the contract, the number the delivery carries after the two Minors of the review:
`git log --oneline 71f08f0..HEAD | Measure-Object` answers **19** over the last commit of the round, the correction of
the delivery included — ten from `e12d34a` to `5404823`, `9a47f41`, and the eight of this round.

**m-2.** The scan runs before every commit, as the hook of the repository does, and it was recorded for each one of
them. After each commit of this round:

```text
$ gitleaks git --log-opts "<commit> -1" --redact --no-banner
c016b81 => 1 commits scanned. | no leaks found
9a56392 => 1 commits scanned. | no leaks found
f62849f => 1 commits scanned. | no leaks found
02dfe38 => 1 commits scanned. | no leaks found
be5509e => 1 commits scanned. | no leaks found
388c6f5 => 1 commits scanned. | no leaks found
4f2f9c0 => 1 commits scanned. | no leaks found
559cb3c => 1 commits scanned. | no leaks found
cde2c43 => 1 commits scanned. | no leaks found
```

Two of them are worth writing down because they are the rule working: the first attempt of `c016b81` was **refused by
the hook**, which found a synthetic provider key written as one literal in `tests/outbound.test.ts`
(`generic-api-key`, `tests/outbound.test.ts:17`, later line 19); the shapes of the test are built piece by piece since
then, and the commit went through with the staged scan green. And the first attempt of `be5509e` was refused for the
same reason, in the same file.

The whole history, at the end of the round:

```text
$ gitleaks git --redact --no-banner
329 commits scanned.
no leaks found
```

## 10.8 The battery of the round

Every command ran on the branch `feature/provider-keys-in-panel`, in the worktree `katalis-dev/community-ins`, with
the environment of the process free of real provider keys. No test of the round calls a provider: every one of them is
a local HTTP double on `127.0.0.1` or the deterministic `fake`.

### Windows

```text
$ npm test
 Test Files  51 passed (51)
      Tests  457 passed (457)
   Duration  21.13s (tests 49%, environment 28%, setup 10%, import 9%, transform 4%, worker 1%)

$ npm run typecheck
Generating route types...
✓ Types generated successfully

$ npm run lint
(no output)

$ npm audit --audit-level=high
found 0 vulnerabilities

$ npm run test:e2e
  30 passed (45.6s)

$ gitleaks git --redact --no-banner
324 commits scanned.
scanned ~5630153 bytes (5.63 MB) in 3.54s
no leaks found

$ npx openspec validate --all --strict
Totals: 11 passed, 0 failed (11 items)

$ git diff --check main...HEAD
(no output, exit 0)
```

### In a `node:24` Linux container, from a clean clone

```text
$ git clone --no-hardlinks <the worktree of this branch> <a temporary directory outside the repository>
$ git -C <that directory> log --oneline -1
388c6f5 Read the state of the store, not only the state of Git
$ git -C <that directory> status --short | Measure-Object
Count: 0

$ docker run --rm -v "<that directory>:/app" -w /app node:24 bash -lc "node --version && npm ci … && npm test"
v24.21.0
 Test Files  51 passed (51)
      Tests  455 passed | 2 skipped (457)
   Duration  103.35s (environment 49%, setup 22%, import 18%, tests 7%, transform 3%, worker 1%)
```

The two skipped tests are the two of `tests/design-system.test.ts` that were already skipped on Linux before this
change. The clone is clean: nothing of the round lives outside a commit.

### The round, commit by commit

| Commit | What it closes | gitleaks over that commit |
|---|---|---|
| `c016b81` | 10.1, the Blocker: no provider text and no variable name reaches the browser | no leaks found |
| `9a56392` | 10.2, the Major of the address: no provider address reaches the private network | no leaks found |
| `f62849f` | 10.3, the Major of the limit: the slot is reserved before the call | no leaks found |
| `02dfe38` | 10.4, the Major of the contract: the pages speak the words of the owner | no leaks found |
| `be5509e` | 10.5, the Major of the evidence: the paid link in a browser and every administrative answer read | no leaks found |
| `388c6f5` | 10.6, the Major of the gap: the state of the store, before and after | no leaks found |
| the closing commit | 10.7 and 10.8: the count of the delivery, this report and the state of the loop | no leaks found (`HEAD -1`) |

`git status --short` is empty at the end of the round, and the text of no task, of `design.md` or of the specs was
edited: the only change in `tasks.md` is the box of each task of section 10.

The count of the commits of the contract: the delivery says **20** over the last commit of the round, and it is read
with `git log --oneline 71f08f0..HEAD | Measure-Object` — nine from `e12d34a` to `5404823`, the correction `9a47f41`,
and the ten of this round (the seven fixes, this report, the round of the delivery and the commits that corrected the
count). The number moves with every commit that writes it, which is why the delivery writes the command next to it and
the report writes what the command answered when the correction was made: **18**. The command is the promise; the
number is a photograph.
