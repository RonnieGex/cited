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
