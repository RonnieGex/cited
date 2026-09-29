---
description: The panel of Cited: how the owner signs in, what each screen does, the routes, the store and the rules of the logo and the documents.
alwaysApply: false
---

# The panel

The panel is the place where the owner of a fork sees what is configured, describes the business and manages the
documents the assistant answers from, without touching the terminal. It is served by the same application as the
public questions: one process, one store.

```
ADMIN_PASSWORD=una-clave-bastante-larga
ADMIN_SESSION_SECRET=un-secreto-largo
EMBEDDINGS_PROVIDER=fake
CHAT_PROVIDER=fake
npm run dev
```

The panel lives in `/admin`. Without `ADMIN_PASSWORD` or `ADMIN_SESSION_SECRET`, or with an `ADMIN_PASSWORD` shorter
than sixteen characters, it refuses to start with `503` and names the variable or the rule that fails; it never shows
a value of the environment, only whether it is set.

## Pages

| Page | What it does |
|---|---|
| `/admin` | "For the installer": every variable of `.env.example` grouped by purpose, read-only, as `Set` or `Missing`, with one button that makes one small call to the chat model and one to the embeddings and reports what the provider answered. It is the only place of the interface where the name of a variable is written |
| `/admin/ai` | "AI and keys": the two sections "Answers" and "Meaning search". Each one shows the connected provider (name, model, `••••` and the last four characters, the last test and its latency, and whether the value comes from the panel or from the server) or the honest list of providers to connect one, with the key field, the test and the save |
| `/admin/business` | the name, the logo, the primary color, the tone, the language, the forbidden topics and the welcome message in English and in Spanish |
| `/admin/documents` | the upload, the list of every document with its passages, the re-ingestion and the delete |
| `/admin/conversations` | the latest questions with their status and their citations, and the button that deletes them all |

| For the installer | AI and keys |
|---|---|
| ![The read-only screen of whoever installs Cited: every variable of the template as set or missing](images/admin/installer-1440.png) | ![The keys of the AI: the connected provider with its model and the last four characters of its key, and the list of the other providers with one line each](images/admin/ai-keys-connected-1440.png) |

| A key the provider rejects | A provider the server set |
|---|---|
| ![The keys of the AI after a test the provider refused, with the reason in words next to the field](images/admin/ai-keys-rejected-1440.png) | ![The keys of the AI when the server sets the providers: set by the server, read only, with no key field](images/admin/ai-keys-server-1440.png) |

## The keys of the AI

The owner pastes a key in `/admin/ai`, presses "Test" and only then can save it. The key is sealed with
**AES-256-GCM** under `ENCRYPTION_KEY` and written in `provider_settings` as `v1:<nonce>:<ciphertext>:<tag>`; the
browser never sees it again, only its last four characters, the provider, the model and the last test with its latency.
Without a valid `ENCRYPTION_KEY` nothing is stored and the panel says why, in the words of a person and without the
name of a variable. `docs/providers.md` carries the whole rule: the catalogue, the precedence of the server, the
meaning search and the keyword mode, the disclosure of the links and the shape of every route.

The test, the save and the removal require the session and the `Origin` check, and the test and the save share a limit
of twenty tests per hour. A test makes one minimal call with a timeout of ten seconds and answers one of
`rejected_key`, `no_credit`, `rate_limited`, `model_not_found`, `unreachable` or `timeout`: the text of the provider is
never returned to the browser.

## The session

`POST /api/admin/login` takes `{"password": string}` and answers with the cookie `cited_admin`, which holds
`expiry.signature`: the expiry in milliseconds and an HMAC-SHA256 of that expiry signed with `ADMIN_SESSION_SECRET`.
The cookie is `Path=/`, `HttpOnly`, `SameSite=Strict`, twelve hours long, and `Secure` outside `localhost`. The
password is compared in constant time, over the SHA-256 of both sides, so the comparison leaks neither the content
nor the length. `POST /api/admin/logout` clears the cookie.

Five failed attempts from one known address within fifteen minutes lock that address for fifteen minutes: the sixth
attempt answers `429` with `Retry-After`, even when it carries the right password. The address is known only when
`TRUST_PROXY` declares how many proxies sit in front and the forwarding chain carries the address that many places
from the right; without a known address no attempt is counted, so nobody can lock the owner out, and every failed
attempt takes at least one second before it answers. The failures live in the store, in
`login_attempts(ip_hash, window_start, count)`, with the same salted hash of the address the public questions use, so
no address is kept in clear. A successful login clears the failures of that address, and an expired window is
forgotten with the next attempt.

Every route under `/api/admin/` requires the session and answers `401` without it. Every mutation also requires the
`Origin` header to be the address the request arrived at, which is what keeps another site from driving the panel
with the cookie of the owner.

## The routes

| Route | Method | What it does |
|---|---|---|
| `/api/admin/login` | `POST` | the password, the cookie and the lockout |
| `/api/admin/logout` | `POST` | clears the cookie |
| `/api/admin/setup` | `GET` | the variables of the template grouped by purpose, as set or missing |
| `/api/admin/setup/test` | `POST` | `{"target": "chat" \| "embeddings"}`: one small call to what the server set, and the provider error with every key removed |
| `/api/admin/providers` | `GET`, `DELETE` | the state of the keys of the panel, and the removal of the value of one kind |
| `/api/admin/providers/test` | `POST` | `{"kind", "provider", "key"?, "model"?, "baseUrl"?}`: one minimal call, ten seconds at most, and one word for its result |
| `/api/admin/providers/save` | `POST` | the same body, with the test repeated: it seals the key and saves it, or saves the search by words |
| `/api/admin/providers/reindex` | `POST` | the embedding of every passage, computed again with the provider in force |
| `/api/admin/business` | `GET`, `PUT` | the business of the store |
| `/api/admin/business/logo` | `POST` | the `multipart/form-data` of the logo |
| `/api/brand/logo` | `GET` | the stored logo with its type and a cache header, **without** the session: the public questions read it |
| `/api/admin/documents` | `GET`, `POST` | the list and the upload of one document |
| `/api/admin/documents/delete` | `POST` | `{"name": string}`: the document and its passages |
| `/api/admin/documents/reingest` | `POST` | `{"name": string}`: the embedding of every passage, computed again |
| `/api/admin/conversations` | `GET` | the latest questions with their status and their citations |
| `/api/admin/conversations/delete` | `POST` | every conversation, and the counters of spend stay |

## The business

The business is one row of the table `business`: `name`, `logo_mime`, `logo_bytes`, `primary_color`, `tone`,
`language`, `forbidden_topics`, `welcome_en`, `welcome_es` and `updated_at`. The panel reads it and writes it
through `lib/settings/business.ts`, whose `readBusiness()` answers `null` when there is nothing stored or when the
table is missing, and never throws for either reason.

- **The language** is `en` by default and takes one of two values, `en` or `es`.
- **The welcome message** exists in both languages, because the public questions may open in either one.
- **The forbidden topics** are one per line, and a question about one of them is refused: the prompt tells the model
  to answer exactly `NO_ANSWER`, which `answering` turns into the refusal of the business.
- **The tone** and the language of the business go into the prompt of every answer as rules, next to the five rules
  of the base.
- **The logo** is checked by its bytes and never by its name: PNG, JPEG or WebP, 512 KB at most. An SVG, a text file
  renamed to `.png` and a file above the ceiling are refused, and a refusal leaves the stored logo untouched.

## The documents

The upload takes one file through `multipart/form-data`, writes it to a temporary path, ingests it with
`lib/ingest` — the same function `npm run ingest` runs, with the same type and size checks — and removes the
temporary folder in a `finally`, so no document stays on disk after the ingestion. The list shows every document
with the number of passages the store keeps for it.

The re-ingestion computes the embedding of every passage of a document again from the text the store keeps and
replaces the document through the same path, so the heading, the position and the hash do not move.

## The conversations

The panel lists the latest questions with their session, their status (`Answered` or `Refused`, from the answer the
store kept) and the numbers of the passages the answer cited. The button that deletes all of them empties the
`conversations` table and touches neither the counter of the model calls of the day nor the rate limits, so the
history of spend of the owner survives the cleanup.

## The two languages of the interface

The panel opens in **English**, whatever the browser asks for: nothing reads `Accept-Language`, so the first screen
is always the same. A switch in the header offers `English | Español`, English first, and stores the choice in the
cookie `cited-lang` (`path=/`, `sameSite=lax`, one year), which the public questions share. The choice is applied to
the `lang` attribute of the document, so the page is in the language it says it is.

Every string of the panel lives in `lib/i18n/admin.ts`, in English and in Spanish, with the same keys. The switch and
the reading of the cookie live in `lib/i18n/language.ts` and `components/i18n/LanguageSwitch.tsx`, the two modules
that `public-page-and-widget` owns.

## The store

The change adds these tables to the store of `docs/search.md`:

- `business(id, name, logo_mime, logo_bytes, primary_color, tone, language, forbidden_topics, welcome_en,
  welcome_es, updated_at)`, one row with `id = 1`.
- `login_attempts(ip_hash, window_start, count)`, one row per address and window of fifteen minutes, with the salted
  hash of the address and never the address.
- `provider_settings(kind, provider, model, key_ciphertext, key_last4, base_url, mode, tested_at, test_latency_ms,
  updated_at)`, one row per kind of provider, with the key of the owner encrypted and never in clear.
- `provider_tests(window_start, count)`, the counter of the twenty tests of an hour.
- `document_index(document_id, signature, indexed_at)`, the signature of the embeddings that made the vectors of a
  document, which is what the warning of re-indexing compares.

The logo is stored in the row, in the column `logo_bytes`, and served from memory by `/api/brand/logo`: no file of
the upload survives on disk.

## The tests

| File | What it holds |
|---|---|
| `tests/admin-session.test.ts` | the token, the constant-time comparisons and the flags of the cookie |
| `tests/admin-lockout.test.ts` | the five failures, the fifteen minutes and the four hundred and twenty nine |
| `tests/admin-guard.test.ts` | the guard of a page, of a handler and of a mutation of another origin |
| `tests/admin-routes.test.ts` | the twelve routes, the `503` of the missing variable and the eleven `401` |
| `tests/admin-setup.test.ts` | the grouping of the template and the promise that no value travels |
| `tests/admin-business.test.ts` | the business, the logo by its bytes and the three rules of the prompt |
| `tests/admin-business-missing.test.ts` | `readBusiness()` without the table |
| `tests/admin-documents.test.ts` | the upload, the list, the delete, the re-ingestion and the counters of spend |
| `tests/admin-ui.test.tsx` | the two languages and the five components of the panel |
| `tests/admin-i18n.test.tsx` | the stand-in of the shared switch |
| `tests/secrets.test.ts` | the encryption of a key: the round trip, the tampered value, the missing key and the wrong key |
| `tests/provider-settings.test.ts` | the resolver of the provider: the server first, the panel next and `none` |
| `tests/provider-routes.test.ts` | the four routes of the keys against a local double of every provider |
| `tests/provider-ui.test.tsx` | the two states of `/admin/ai`, the honest lines, the affiliate link and the re-index |
| `e2e/admin.spec.ts` | the six flows of the panel in a browser, each with its axe check |
| `e2e/providers.spec.ts` | the flows of the keys in a browser, against a double the spec serves itself |

No test of this change calls a real provider: the deterministic `fake` of `lib/models/fake.ts` and
`lib/embeddings/fake.ts` runs the suite and the browser flows.
