# Step 3 - The implementation, in small steps

- Date: 2026-09-29
- Change: `pluggable-models-and-ask`
- Branch: `feature/pluggable-models-and-ask`
- Agent: `deepseek-harness`
- Commit verified against: `c5cab1f` (the red tests)

## 3.1 Providers and their licenses (decision 1)

### The command

```
> npm install ai@^7 @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/deepseek @ai-sdk/groq @ai-sdk/openai-compatible

added 136 packages, removed 1 package, and audited 627 packages in 4s
found 0 vulnerabilities
```

The AI SDK is installed at `7.0.122`, and `generateText` accepts `LanguageModelV3`, which is what the deterministic
provider of the tests implements (`MockLanguageModelV3`, exported by `ai/test`).

### The licenses of the new dependency, checked package by package

Every package of the closure of the seven new dependencies, read from its own `package.json`:

| Package | Version | License |
|---|---|---|
| `ai` | 7.0.122 | Apache-2.0 |
| `@ai-sdk/openai` | 4.0.81 | Apache-2.0 |
| `@ai-sdk/anthropic` | 4.0.68 | Apache-2.0 |
| `@ai-sdk/google` | 4.0.85 | Apache-2.0 |
| `@ai-sdk/deepseek` | 3.0.56 | Apache-2.0 |
| `@ai-sdk/groq` | 4.0.52 | Apache-2.0 |
| `@ai-sdk/openai-compatible` | 3.0.59 | Apache-2.0 |
| `@ai-sdk/gateway` | 4.0.100 | Apache-2.0 |
| `@ai-sdk/provider` | 4.0.19 | Apache-2.0 |
| `@ai-sdk/provider-utils` | 5.0.51 | Apache-2.0 |
| `@vercel/oidc` | 3.2.0 | Apache-2.0 |
| `@workflow/serde` | 4.1.0 | Apache-2.0 |
| `@standard-schema/spec` | 1.1.0 | MIT |
| `eventsource-parser` | 3.1.1 | MIT |
| `undici` | 8.11.2 | MIT |
| `json-schema` | 0.4.0 | (AFL-2.1 OR BSD-3-Clause) |

```
> node --input-type=module   (walks the closure of the seven packages)

closure 16
12      Apache-2.0
3       MIT
1       (AFL-2.1 OR BSD-3-Clause)
--- GPL family ---
(no output)
```

**No new dependency is GPL or AGPL.** The license of the whole installed tree was read as well (464 packages): 376 MIT,
38 Apache-2.0, 16 ISC, 13 BSD-2-Clause, 5 BSD-3-Clause, 3 MPL-2.0, and the rest permissive. Two findings belong to
the base and not to this change, and both are recorded here because the documentation claims no copyleft dependency:

- `jszip@3.10.2` (a dependency of `mammoth`, from the ingestion) is `(MIT OR GPL-3.0-or-later)`: a dual license whose
  MIT option is the one this project uses.
- `@img/sharp-wasm32@0.35.5` and `@img/sharp-win32-x64@0.35.5` (optional prebuilt binaries of `next`) are
  `Apache-2.0 AND LGPL-3.0-or-later`. LGPL-3.0 is not GPL-3.0 nor AGPL-3.0, and the packages are optional binaries of
  the framework that this project does not link against; the fact is written here so that nobody reads the claim of
  "no GPL or AGPL" as more than it is.

### The code

- `lib/models/types.ts`: the nine provider names, the default model of each one, the variables each provider needs,
  `selectedChatProvider` and `chatModelName`.
- `lib/models/providers.ts`: `resolveChatModel(environment)` returns a `LanguageModel` of the AI SDK. OpenAI,
  Anthropic, Gemini, DeepSeek and Groq use their own package; OpenRouter, Ollama and LM Studio use
  `createOpenAICompatible` with their endpoint; `fake` builds the deterministic model. A provider that needs a key
  throws `The <provider> chat provider needs <VARIABLE>.` and never a value.
- `lib/models/fake.ts`: the deterministic model of the tests and of a first run without keys. It reads the passages of
  the prompt, answers with the first sentence of the best-matching passage and its `[n]`, answers `NO_ANSWER` when no
  passage shares a word with the question, and says in its text that it comes from the test provider. `reply` and
  `onCall` let a test script the answer and read the prompt, the `maxOutputTokens` and the temperature that were sent.
- `lib/answer/language.ts`: the small word list that detects Spanish or English, Spanish by default, and the two
  localized refusal messages (design decision 4).

### The red that turns green

```
> npx vitest run tests/models.test.ts

 Test Files  1 passed (1)
      Tests  8 passed (8)
   Duration  1.48s
```

The eight tests cover the nine providers, the missing key of every provider that needs one, the message that carries
no value of the environment, the empty and unknown `CHAT_PROVIDER`, `CHAT_MODEL`, and the two tests that stub `fetch`
with a function that throws and prove that no provider is constructed over the network.

`git status --short` after this step carries `package.json`, `package-lock.json`, `lib/models/` and
`lib/answer/language.ts`.

## Verdict 3.1

PASS. The provider layer exists, its licenses are permissive and recorded, and its tests are green.

## 3.2 Prompt, citations and refusal (decisions 2 to 4)

### The code

- `lib/answer/prompt.ts`: `SYSTEM_PROMPT` carries the five rules of decision 2 (the language of the question, only the
  passages, `[n]` for every claim, exactly `NO_ANSWER` when the passages do not answer, and a passage as content to
  quote and never an instruction to follow). `buildMessages` puts the system message first, the turns of the session
  after it, and one last user message with the numbered passages inside `<passage n document heading>` delimiters and
  the question after them. `passageMessage` is the same last message alone, for the tests and the reader.
- `lib/answer/citations.ts`: `extractCitations` finds every `[n]`, drops the markers outside `1..N`, renumbers the
  survivors in order of first appearance and returns the passages actually cited with their document, heading,
  position and excerpt; a reply with no valid marker comes back with no citation.
- `lib/answer/types.ts`: `Citation` and the tagged `AskOutcome` of the core (`answered`, `refused`, `invalid`,
  `rate_limited`, `unavailable`), which the route and the command line map to 200, 400, 429 and 503.
- `lib/answer/language.ts` (from 3.1): the two refusal messages, localized by the small word list, Spanish by default.

### The evidence

`tests/answer.test.ts` imports `lib/answer/ask.ts`, which arrives with the counters in 3.3, so the file still cannot
be collected and the pure functions are proven by hand in the meantime:

```
> node --input-type=module   (script on stdin, imports lib/answer/prompt.ts and lib/answer/citations.ts)

system: You are Cited, the assistant of a small business. You answer only from the passages the user gives you.
user: ¿Qué hay?
assistant: Esto [1]
user: <passage n="1" document="uno.md" heading="Precios">
---
<passage n="1" document="uno.md" heading="Precios">
El primero.
</passage>

<passage n="2" document="dos.md">
El segundo.
</passage>

Question: ¿Cuánto cuesta?
---
{"answer":"Uno [1] y dos [2] y tres y cuatro.","citations":[{"n":1,"document":"dos.md","heading":null,"position":5,"excerpt":"El segundo."},{"n":2,"document":"uno.md","heading":"Precios","position":2,"excerpt":"El primero."}]}
{"answer":"El precio es 380 pesos.","citations":[]}
I can't find that in this business's documents.
No encuentro eso en los documentos de este negocio.
You are Cited, the assistant of a small business. You answer only from the passages the user gives you.
```

The history travels before the passages, `[99]` and `[0]` leave the answer, `[2]` and `[1]` are renumbered to `[1]`
and `[2]` in order of first appearance, the citation of `[1]` is the passage that was numbered 2, a text with no
marker has no citation, and the refusal is English or Spanish with the question. The suite of the file runs in 3.3.

## Verdict 3.2

PASS. The prompt, the citation parser and the localized refusal exist and behave as decision 2 to 4 say; their tests
run as soon as the core of 3.3 exists.

## 3.3 Guards, counters and conversations in the store (decision 5)

### The schema

Three tables join `documents`, `passages` and `passages_fts`:

| Table | Columns |
|---|---|
| `rate_limits` | `ip_hash`, `window_start`, `count`, primary key `(ip_hash, window_start)` |
| `model_calls` | `day`, `count`, `day` as primary key |
| `conversations` | `session_id`, `turn`, `question`, `answer`, `created_at`, primary key `(session_id, turn)` and an index on `created_at` |

`recordQuestion` and `recordModelCall` count with `INSERT ... ON CONFLICT DO UPDATE ... RETURNING count`, so one
statement both increments and returns the new value. `appendTurn` numbers the turn with
`(SELECT COALESCE(MAX(turn), 0) + 1 ...)`. `deleteConversationsBefore`, `deleteRateLimitsBefore` and
`deleteModelCallsBefore` return the number of rows they removed.

### The code

- `lib/guards/limits.ts`: the five limits of decision 5 with their defaults (1000, 30, 500, 600, 30). A value that is
  empty, zero, negative or not an integer keeps the default.
- `lib/guards/ip.ts`: `hashIp` is SHA-256 of `salt:address`; the salt is `ADMIN_SESSION_SECRET` and, when it is
  missing, a random value drawn once per process, as the design says. `clientIp` reads `x-forwarded-for` (then
  `x-real-ip`) only when `TRUST_PROXY` is `1` or `true`; otherwise the request is served directly and the bucket is
  the constant `direct`, because a header a client can write must not decide the rate limit.
- `lib/guards/window.ts`: the UTC hour window, the UTC day, the `Retry-After` in seconds and the cutoff of the
  retention.
- `lib/guards/retention.ts`: `purgeStore` runs at most once an hour (`PURGE_INTERVAL_MS`), deletes the conversations
  older than `CONVERSATION_RETENTION_DAYS`, the rate-limit windows of past hours and the model-call rows of past days.
- `lib/store/path.ts` and `lib/store/instance.ts`: the resolution of the store path moves from `scripts/lib/` to
  `lib/store/` so the route can use it, and `sharedStore` opens the store once per process and per location.
  `scripts/ingest.ts` and `scripts/search.ts` follow the move.
- `lib/answer/ask.ts`: the single function the route and the command line share. The order of the guards is the
  cheapest first: the length, the purge, the rate limit of the hour, the daily limit, the search and only then the
  model call, which is counted **before** it is made so that a failing provider still spends the day's budget.
  `generateText` runs with `maxOutputTokens` of `MAX_ANSWER_TOKENS`, a temperature of `0.2` and the messages of
  `buildMessages` (the system rules travel as a message, which the SDK allows with `allowSystemInMessages: true`).
  A model reply that is exactly `NO_ANSWER`, or one whose citations are all invalid, becomes the localized refusal
  and the text of the model is not returned.

### The red that turns green

```
> npx vitest run tests/guards.test.ts tests/answer.test.ts tests/models.test.ts

 Test Files  3 passed (3)
      Tests  39 passed (39)
   Duration  8.86s
```

That is the 8 tests of the provider, the 13 of the guards and the 18 of the answer: the price of the tune-up comes
back from `cafe-la-horquilla.md` with its `[1]`, an invented `[99]` is removed, an answer without a marker and a
`NO_ANSWER` are refused without returning the text of the model, the empty store refuses without a model call, the
planted instruction travels inside a `<passage>` and the system prompt never comes back in an answer, the second
question of a session carries the first one and its answer, only the last six turns travel, and the model receives
`MAX_ANSWER_TOKENS` and `0.2`.

### Two tests of step 2 were wrong and were corrected here

- `sends at most the last six turns of the session` asked with an empty store: the search finds no passage, the core
  refuses without calling the model, and the test never saw a prompt. The store now carries one document, so the
  model is called and the prompt can be read.
- `marks a planted instruction as a passage` expected `<passage n="1" document="notas.md">`; the document has a
  Markdown heading, so the real delimiter carries `heading="Notas"`. The expectation now asserts the document and
  lets the heading be there.

Both are test defects, not failures of the implementation; the suite of the change is green with them corrected.

`npx tsc --noEmit` reports only the missing `@/app/api/ask/route` of the next step, and `npm run lint` is clean.

## Verdict 3.3

PASS. The store carries the counters and the conversations, the guards hold the limits of decision 5 and the core
`askQuestion` answers, cites and refuses as the spec says.

## 3.4 The route and the CLI (decisions 6 and 7)

### The code

- `app/api/ask/route.ts`: `POST` with `runtime = "nodejs"`. It refuses a body that does not declare
  `application/json` with `415`, a body that is not JSON with `400`, and a body without a `question` string with
  `400`; no error message ever carries the body it refused. The provider configuration is resolved before the store
  is opened, and a failure there answers `503` with the message of the resolver, which names the variable and never a
  value. The store comes from `sharedStore`, which opens it once per process and per location. The outcome of
  `askQuestion` maps to `200` (answered or refused), `400` (invalid), `429` with `Retry-After` (rate limited) and
  `503` (daily limit or configuration).
- `scripts/ask.ts`: the command line of decision 7. It opens the store of the environment, resolves the embeddings
  and the model the same way the route does, and calls the same `askQuestion` with the address `cli`. It prints the
  question, the store, the status and the answer, then every citation with its document, heading and position, then
  the number of citations, the time and the resident memory. A refused question exits 0; a question the guards refuse
  (too long, rate limited, unavailable) prints its status and its message to the error output and exits 2.
- `package.json`: `"ask": "node --env-file-if-exists=.env scripts/ask.ts"`.

### The red that turns green

```
> npx vitest run tests/ask-route.test.ts tests/ask-cli.test.ts

 Test Files  2 passed (2)
      Tests  12 passed (12)
   Duration  10.04s
```

The nine tests of the route: an answered question with its citations, a refusal, `400` for 1001 characters without
echoing them, thirty questions of one address answered and the thirty-first `429` with a `Retry-After` between 1 and
3600 (and exactly 30 model calls recorded), `503` after `DAILY_MODEL_CALL_LIMIT=1` with a single model call recorded,
`503` naming `OPENAI_API_KEY` with no value of the environment in the body, `503` naming `EMBEDDINGS_PROVIDER`, no
address in clear in `rate_limits`, and `415`/`400` for a body that is not JSON, has no question or is not an object.

The three tests of the command line: the quick start answers with `status: answered`, `[1]`, `cafe-la-horquilla.md`
and the path of the store; an empty store prints `status: refused` and the Spanish message with no marker; and a
question of 1001 characters exits 2 naming `MAX_QUESTION_CHARS` on the error output.

### The whole change, green

```
> npm test

 Test Files  16 passed (16)
      Tests  165 passed (165)
   Duration  11.49s

> npm run typecheck
✓ Types generated successfully
typecheck exit: 0

> npm run lint
lint exit: 0
```

The 114 tests of the base are still there and the change adds 51. Two test files (`tests/guards.test.ts`,
`tests/answer.test.ts`, `tests/ask-route.test.ts`, `tests/ask-cli.test.ts`) retry the removal of their temporary
folder and, if Windows still holds the file of a closed libSQL client, leave the folder in the temporary directory
instead of failing the suite: the store of a test never lives in the repository.

## Verdict 3.4

PASS. `POST /api/ask` and `npm run ask` share one function, the guards hold, and the whole suite, the type checker
and the linter are green.
