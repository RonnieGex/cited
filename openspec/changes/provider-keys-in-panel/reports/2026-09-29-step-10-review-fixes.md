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
