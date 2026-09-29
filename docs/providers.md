---
description: Where the keys of the AI live in Cited: the catalogue of the providers and where each one processes the data, the encryption with AES-256-GCM, the rule that the server wins over the panel, the meaning search with keyword mode and the affiliate disclosure.
alwaysApply: false
---

# The keys of the AI

The owner of a small business does not touch a server, a terminal or a file of the environment: the keys are pasted in
the panel, tested before they are saved and stored encrypted in the installation. This document is the technical side
of that promise, and it is also where whoever installs a fork reads what the server can set above the panel.

The change that built it is `provider-keys-in-panel`; its contract lives in
`openspec/changes/provider-keys-in-panel/`.

## The short answer

- **Where the keys go:** in the panel, at `/admin/ai`, in the section "Answers" for the provider that writes the
  answers and in the section "Meaning search" for the embeddings of the search. The only exception is whoever installs
  Cited, who may set a provider in the environment of the server, and who sees that state in `/admin` ("For the
  installer").
- **How they are stored:** encrypted with AES-256-GCM in the table `provider_settings` of the store, under a master key
  of the server (`ENCRYPTION_KEY`). Never in clear, never in a log line, never in a file of the repository.
- **What the panel shows again:** the provider, the model, the last four characters of the key, the moment of the last
  test and its latency. Nothing else: the key and its ciphertext never travel to the browser.
- **When a key is used:** after "Test" answers with the model of the provider; and before that nothing is saved, so a
  typo never becomes a saved key.
- **Who wins:** a value set in the environment of the server wins over the one of the panel, and the panel shows it as
  "Set by the server" without an edit control.

## The catalogue

One honest line for each provider: what it costs and how fast it is, where it processes the data, and whether it
offers meaning search. The names are text: no logo, no "partner" and no "recommended" wording.

| Provider | Cost and speed | Where it processes the data | Meaning search | Default chat model |
|---|---|---|---|---|
| DeepSeek | paid per use, one of the cheapest, answers quickly | China | no | `deepseek-flash` |
| OpenAI | paid per use, fast and the best documented | United States | yes | `gpt-4o-mini` |
| Anthropic | paid per use, careful answers, moderate speed | United States | no | `claude-haiku-4-5-20251001` |
| Google Gemini | free tier and paid plans, very fast | United States | yes | `gemini-3.8-flash` |
| Groq | paid per use, the fastest of the list | United States | no | `openai/gpt-oss-120b` |
| OpenRouter | one key for many models, paid per use | United States, and it forwards to the provider of each model | no | `openai/gpt-4o-mini` |
| Ollama | free, as fast as your own computer | your own computer | yes | `llama3.1` |
| LM Studio | free, as fast as your own computer | your own computer | no | `local-model` |

The meaning search of the panel offers OpenAI, Google Gemini and Ollama, with `text-embedding-3-small`,
`gemini-embedding-001` and `nomic-embed-text`. The catalogue lives in `lib/providers/catalog.ts`, bilingual, and the
default models are the ones of `lib/models/types.ts`.

The panel never calls a provider by itself: the call of a test and the calls of the answers go out from the server,
with the key of the owner. No counter, no beacon and no call to Katalis leaves the installation.

## The encryption

`lib/secrets/index.ts` seals a key with **AES-256-GCM** and the `crypto` module of Node:

- `ENCRYPTION_KEY` is 32 bytes in base64 (`openssl rand -base64 32`).
- Every value gets a **fresh 12-byte nonce**, and the stored string is `v1:<nonce>:<ciphertext>:<tag>`.
- Opening a value verifies the tag, so a tampered row is detected instead of returning a wrong key.
- **Without a valid key nothing is stored**: the route answers that the server needs an encryption key, in the words of
  a person and without the name of a variable, and the value never falls back to plaintext.
- The three answers of the module are separate: `no_key` (the variable is empty), `bad_key` (it is not 32 bytes of
  base64) and `corrupt` (the value does not open with this key).
- The last four characters of the key are stored in clear (`key_last4`) because they are what the panel shows: they are
  a label, not a secret.

Changing `ENCRYPTION_KEY` after a key is saved leaves that key unreadable. The panel says so in words and asks the
owner to connect the provider again; `/api/ask` answers `503` for the same reason.

## The server wins over the panel

`lib/settings/providers.ts` is the only reader of a provider: `resolveChat()` and `resolveEmbeddings()` answer the
provider, the model, the key, the base URL and the source (`server`, `panel` or `none`). The answer pipeline
(`app/api/ask/route.ts`, `scripts/ask.ts`), the ingestion (`app/api/admin/documents/route.ts`, `scripts/ingest.ts`),
the search (`scripts/search.ts`) and the panel read through it.

1. A value set in the environment of the server wins: `CHAT_PROVIDER` with `CHAT_MODEL`, and `EMBEDDINGS_PROVIDER` with
   its base URL, its model and its key. The variables of today keep working unchanged.
2. The value saved in the panel comes next, with its key opened only in the server process.
3. `none` is a state of its own: the answers answer `503` saying that the AI is not connected yet or naming the
   variable that is missing, and the ingestion stops before reading a document.

A provider may be pointed at a compatible endpoint with `OPENAI_BASE_URL`, `ANTHROPIC_BASE_URL`, `GEMINI_BASE_URL`,
`DEEPSEEK_BASE_URL`, `GROQ_BASE_URL`, `OPENROUTER_BASE_URL`, `OLLAMA_BASE_URL` or `LMSTUDIO_BASE_URL`. What the panel
saves keeps the base URL of that moment in `base_url`, so the answers of the pipeline use the same endpoint the test
used.

## The meaning search and the keyword mode

- OpenAI, Gemini and Ollama offer embeddings: the panel proposes the same key and a default embeddings model.
- DeepSeek, Anthropic, Groq and OpenRouter do not: the panel offers a second key (OpenAI or Gemini) or **search by
  words**.
- **Search by words** ranks with FTS5 alone, stores no vector at ingestion and needs no key. The panel says it in
  words, and it is a choice of the owner, not a silent degradation.
- Changing the provider, the model or the mode writes a different signature in `document_index`, so the panel says how
  many passages need re-indexing and offers "Re-index now", which re-embeds every passage that is already in the store
  (the documents are not stored, the passages are).

## The testing of a provider is bounded

`POST /api/admin/providers/test` makes **one minimal call** (a five-token reply for a chat provider, one short text for
an embeddings provider) with a timeout of ten seconds, and answers one of:

| Answer | When |
|---|---|
| `rejected_key` | `401`, `403`, or the `400` with which Gemini refuses a key |
| `no_credit` | `402`, or a `429` that speaks of quota, credit or billing |
| `rate_limited` | `429` without a word about the quota |
| `model_not_found` | `404` |
| `unreachable` | the address does not answer, or it answers something unusable |
| `timeout` | the provider did not answer inside the ten seconds |

The text of the provider is **never** returned: the owner reads a sentence of the interface, and the raw answer of the
provider stays in the server. `PROVIDER_TEST_TIMEOUT_MS` shortens or lengthens the ten seconds, which is what the suite
uses to try a provider that never answers.

The routes of the test, of the save and of the remove require the admin session and the `Origin` check, and the test
and the save share a limit of **twenty tests per hour**; after that they answer `429` with `Retry-After`. The save
repeats the test and stores the key only when the provider answered.

## The disclosure of the links

- Each provider carries a "Get a key" link to its own site. `signupLink()` uses `affiliateUrl` **only when the
  catalogue carries one and `AFFILIATE_LINKS` is not `off`**, and then the interface writes "(paid link)" or "(enlace
  pagado)" next to the link, in the language of the interface and before any click.
- **No affiliate URL is committed in this change**: the field is empty for every provider and every link is the plain
  one. The mechanism is what will carry the link of ElevenLabs for the voice when Franc joins a programme.
- `AFFILIATE_LINKS=off` is the single option that turns every affiliate link into its plain link, for whoever forks
  the project.
- `HOSTED_OFFER_URL` is the address of the hosted version of Katalis and shows the offer under the list; an empty value
  hides it. Reselling keys or raw access is not what that offer is: it is the app with the AI included.
- Under the list, the owner who prefers not to manage keys finds that offer, which is the honest alternative to a fork
  that does not want to run a provider.

## The routes of the panel

| Route | Method | What it does |
|---|---|---|
| `/api/admin/providers` | `GET` | the state of both kinds: source, provider, model, last four characters, last test and its latency, whether the server has an encryption key and how many passages need re-indexing. Never a key and never a ciphertext |
| `/api/admin/providers` | `DELETE` | `{"kind": "chat" \| "embeddings"}`: removes the value of the panel |
| `/api/admin/providers/test` | `POST` | `{"kind", "provider", "key"?, "model"?, "baseUrl"?}`: one minimal call and one word for its result |
| `/api/admin/providers/save` | `POST` | the same body: it repeats the test, seals the key and saves it; `{"kind": "embeddings", "mode": "keyword"}` saves the search by words without a call |
| `/api/admin/providers/reindex` | `POST` | re-embeds every passage of the store with the provider in force and writes its signature |

## The store

Three tables join the store of `docs/search.md`:

- `provider_settings(kind, provider, model, key_ciphertext, key_last4, base_url, mode, tested_at, test_latency_ms,
  updated_at)`, one row per kind (`chat` or `embeddings`), with the `CHECK` that keeps a third kind out until the voice
  key of a later change arrives.
- `provider_tests(window_start, count)`, the counter of the twenty tests of an hour.
- `document_index(document_id, signature, indexed_at)`, the signature of the embeddings that made the vectors of each
  document, which is what the warning of re-indexing compares.

## The tests

| File | What it holds |
|---|---|
| `tests/secrets.test.ts` | the round trip, the fresh nonce, the tampered value, the missing key, the wrong key and the last four characters |
| `tests/provider-settings.test.ts` | the resolver: the server first, the panel next, `none`, the key of the server that is missing and the key of the panel that cannot be read |
| `tests/provider-double.ts` | the local HTTP double of every provider: the one thing a test calls |
| `tests/provider-routes.test.ts` | every scenario of `specs/provider-settings/spec.md`, with `200`, `401`, `402`, `insufficient_quota`, `404`, `429` and a provider that never answers |
| `tests/provider-search.test.ts` | the keyword mode, the ingestion that stops naming what is missing and the re-indexing of a change of embeddings |
| `tests/provider-answering.test.ts` | `/api/ask` with the provider of the panel, the `503` of nothing configured and the `503` that names the variable of the server |
| `tests/provider-ui.test.tsx` | the two states of the panel, the honest lines, the affiliate link and its switch, the hosted offer, the key field with its toggle and the re-index |
| `e2e/providers.spec.ts` | the browser flows of `/admin/ai` against a double the spec serves itself |

No test and no browser flow of this change calls a real provider: every provider is the double of
`tests/provider-double.ts` or the deterministic `fake` of `lib/models/fake.ts` and `lib/embeddings/fake.ts`.
