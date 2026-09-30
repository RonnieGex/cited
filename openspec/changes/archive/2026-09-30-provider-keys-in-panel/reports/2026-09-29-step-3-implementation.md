# Step 3: the implementation, decision by decision

- Date: 2026-09-29
- Change: `provider-keys-in-panel`
- Branch: `feature/provider-keys-in-panel`
- Agent: deepseek-harness
- Commit verified: `be42a26` (the implementation, on top of the tests of `f2fd3cb`)
- Tasks: 3.1, 3.2, 3.3, 3.4
- Before writing code: the guides of `node_modules/next/dist/docs/` named by `AGENTS.md`, read for this version:
  `01-app/01-getting-started/15-route-handlers.md` (the Web `Request`/`Response` handlers, no caching of `POST` and
  `DELETE`, the `RouteContext` helper) and `01-app/01-getting-started/07-mutating-data.md` (server functions are
  reachable by a direct `POST`, so every handler checks the session and the origin itself). The routes of this change
  follow the pattern the repository already uses and the guide confirms: a `route.ts` that exports the HTTP methods and
  nothing else, which is why the parsers of the bodies live in `lib/admin/provider-request.ts` and not in the route
  file.

## 3.1: `lib/secrets/`, the table and the resolver, and the pipeline and the ingestion through it

Decisions 1 to 3 of `design.md`.

- `lib/secrets/index.ts`: AES-256-GCM with `node:crypto`, a fresh 12-byte nonce per value, 32 bytes of base64 in
  `ENCRYPTION_KEY`, the value `v1:<nonce>:<ciphertext>:<tag>`. `no_key`, `bad_key` and `corrupt` are separate answers
  and nothing falls back to plaintext.
- `lib/store/index.ts`: the table `provider_settings` of decision 2, with its ten columns and its `CHECK` over `kind`,
  plus `provider_tests` for the limit of the hour and `document_index` for the signature of the embeddings that made
  the vectors of each document. `replaceDocument()` writes an empty blob when the embedding is empty, which is what
  keyword mode needs.
- `lib/settings/providers.ts`: `resolveChat()` and `resolveEmbeddings()` return the provider, the model, the key, the
  base URL and the source (`server`, `panel` or `none`), with the server winning. `chatProblem()` and
  `embeddingsProblem()` are the messages, and they name a variable or say "connect your AI in the panel", never a
  value. `embeddingsSignature()` names what the store was indexed with, without the key.
- `lib/models/providers.ts`: `chatModelFrom()` builds the model from explicit credentials and `serverChatCredentials()`
  reads the environment once; `resolveChatModel()` keeps working for the read-only check of the installer.
- `lib/embeddings/providers.ts`: `embeddingsFrom()` turns a resolution into a provider, answers `null` for keyword mode
  and stops with the message of `embeddingsProblem()` when the configuration is missing or unreadable.
- `lib/settings/indexing.ts`: `reindexStore()` and `reindexDocument()` re-embed the passages that are already in the
  store and write the signature.
- The pipeline and the ingestion read only through the resolver: `app/api/ask/route.ts`,
  `app/api/admin/documents/route.ts`, `app/api/admin/documents/reingest/route.ts`, `scripts/ask.ts`,
  `scripts/ingest.ts` and `scripts/search.ts`. `lib/search/index.ts` and `lib/ingest/index.ts` take
  `EmbeddingProvider | null`, and `null` is keyword mode: FTS5 alone, no vector, no provider call.

## 3.2: the routes of test, save and remove, and the rule of the embeddings

Decisions 4 and 5.

- `app/api/admin/providers/test/route.ts`, `save/route.ts` and `route.ts` (`GET` and `DELETE`), and
  `reindex/route.ts`. All of them go through `guardRequest()`, which requires the session and, for every mutation, the
  same origin; the test and the save share the counter of `reserveProviderTest()`: twenty per hour, `429` with
  `Retry-After` after that.
- `lib/providers/test.ts` makes one minimal call with `fetch`, with `AbortSignal.timeout()` — ten seconds by default
  and `PROVIDER_TEST_TIMEOUT_MS` to shorten it in a test — and answers one of `rejected_key`, `no_credit`,
  `rate_limited`, `model_not_found`, `unreachable` or `timeout`. The status of the provider is translated and its text
  is never returned: a 402 or a 429 that mentions the quota is `no_credit`, and a 400 of Gemini that says the key is
  invalid is `rejected_key`.
- The save repeats the test, seals the key with `sealSecret()` and stores only the ciphertext and the last four
  characters. Without a usable `ENCRYPTION_KEY` it answers `503` with the words of a person and no name of a variable,
  and it does not call the provider.
- Keyword mode is saved without a key and without a call, and the page says how many passages need re-indexing with the
  button that re-indexes them now.

## 3.3: the catalogue and the links

Decisions 6 and 7.

- `lib/providers/catalog.ts` is bilingual: for every provider its name, one line on cost and speed, where it processes
  the data, whether it offers meaning search, its default chat and embeddings models, the base URL, the signup link and
  the affiliate field. The field is **empty for every provider in this change**: no affiliate URL is committed until
  Franc joins a programme.
- `signupLink()` uses the affiliate URL only when the catalogue carries one and `AFFILIATE_LINKS` is not `off`, and
  the page writes "(paid link)" / "(enlace pagado)" next to the link before any click. `hostedOfferOf()` reads
  `HOSTED_OFFER_URL`, and an empty value hides the offer.
- No logo and no "partner" or "recommended" wording: the provider names are text.
- The per-provider base URL can be pointed at a compatible endpoint from the environment (`OPENAI_BASE_URL`,
  `ANTHROPIC_BASE_URL`, `GEMINI_BASE_URL`, `DEEPSEEK_BASE_URL`, `GROQ_BASE_URL`, `OPENROUTER_BASE_URL`,
  `OLLAMA_BASE_URL`, `LMSTUDIO_BASE_URL`). It is how an installation behind a gateway works, and it is what lets the
  browser suite of step 7 test the panel against a local double without touching the catalogue.

## 3.4: the page "AI and keys" and "For the installer"

Decision 8.

- `app/admin/ai/page.tsx` with `components/admin/ProviderState.tsx`, `ProviderConnect.tsx` and `ProviderConnected.tsx`:
  two sections, "Answers" and "Meaning search", each with the connected provider — name, model, `••••` and the last
  four characters, the last test with its latency and its source — or the list to connect one. The key field is a
  password field with a show toggle, "Test" answers in words inline and never in a modal, and the save is only
  possible after a passing test. A value set by the server shows "Set by the server", explains why and carries no edit
  control.
- The old setup page is now "For the installer": the same groups of variables, read-only, and the only place of the
  interface where a variable name is written. `components/admin/AdminNav.tsx` gains the link to `/admin/ai`.
- English first and Spanish complete, including every error and empty state, in `lib/i18n/admin.ts` and
  `lib/i18n/public.ts`.
- The scenario "Nothing configured anywhere" of `specs/answering/spec.md` reaches the public page: `app/page.tsx`
  asks the resolver and, when no chat provider is connected, shows "This assistant is not ready yet" with the way to
  the panel instead of a question box that cannot answer.

## Tests and checks

```
$ npx vitest run tests/secrets.test.ts tests/provider-settings.test.ts tests/provider-search.test.ts \
    tests/provider-routes.test.ts tests/provider-answering.test.ts tests/provider-ui.test.tsx
 Test Files  6 passed (6)
      Tests  59 passed (59)
   Duration  8.82s (tests 70%, import 10%, setup 8%, environment 7%, transform 4%)

$ npm test
 Test Files  44 passed (44)
      Tests  408 passed (408)
   Duration  17.51s

$ npm run lint
> eslint .
(no output, exit 0)

$ npm run typecheck
> next typegen && tsc --noEmit
✔ Types generated successfully
exit 0
```

## Verdict

The four tasks of the implementation are complete, with the tests that were red now green and the whole suite at 408
tests. The commits are `f2fd3cb` (the tests first) and `be42a26` (the implementation). Tasks 3.1, 3.2, 3.3 and 3.4 are
done.
