# Step 3 · the implementation

Contract: `tasks.md`, tasks 3.1, 3.2, 3.3 and 3.4. The four tasks share this report, as the contract asks.
Agent: deepseek-harness. Date: 2026-09-29. Branch: `feature/admin-panel-and-onboarding`.
Every command runs in the `community` worktree, quoted below as `.`; no tracked file carries the absolute path of the
machine, because `tests/personal-paths.test.ts` refuses it.

The four tasks were written in the order of the contract, one commit each, and every commit leaves the suite green
for what it adds.

## 3.1 Session, lockout, guard and CSRF check (decisions 1 to 3)

### The session

`lib/admin/session.ts` holds the whole cookie of decision 1: `cited_admin` with a payload `expiry.hmac`, an
HMAC-SHA256 over the expiry signed with `ADMIN_SESSION_SECRET`, twelve hours of life, and the helpers the routes and
the pages share (`adminConfig`, `passwordMatches`, `sessionToken`, `verifySession`, `sessionCookie`,
`clearedSessionCookie`, `cookieFrom`, `isSecureHost`).

- The password is compared with `crypto.timingSafeEqual` over the SHA-256 of both sides, so the comparison does not
  leak the length of the password either, and an empty `ADMIN_PASSWORD` never matches.
- The signature is compared the same way, over the digests, and an expired or malformed token is refused before any
  comparison.
- The cookie carries `Path=/`, `HttpOnly`, `SameSite=Strict` and `Max-Age=43200`, and `Secure` only outside
  `localhost` (`isSecureHost`), which is what the spec asks and what lets the local run and the end-to-end test work
  over http.

### The lockout

`lib/admin/lockout.ts` counts the failures in the store, in `login_attempts(ip_hash, window_start, count)`, with the
same salted hash of the address that `answering` uses (`hashIp(ip, ADMIN_SESSION_SECRET)`):

- The window opens with the **first** failure and lives fifteen minutes: the fifth failure locks the address and the
  sixth attempt answers `429` with `Retry-After` until the window closes, so the lock lasts the fifteen minutes the
  spec names and not the remainder of a tumbling window.
- A window older than fifteen minutes is ignored and a new one opens with the next failure.
- Every attempt clears the windows that expired, so the table does not grow without bound, and a successful login
  clears the failures of that address.
- The address is stored only as a hash: the test reads the whole table and finds neither address in clear.

### The guard and CSRF

`lib/admin/guard.ts` is the single guard of decision 3. `guardSession` reads the cookie of a page, `guardRequest`
reads the `Cookie` header of a handler and, for `POST`, `PUT`, `PATCH` and `DELETE`, requires the `Origin` header to
be exactly the origin of the request; a mutation without an origin or from another origin is `403`. Every handler
calls it and so does the admin layout.

`lib/admin/respond.ts` turns the guard into the response of the spec: `503` naming the missing variables, `401`
without a session, `403` for the foreign origin, always as JSON with `cache-control: no-store`.

`proxy.ts` answers the page case: `/admin` and everything under it answer `503` with the name of the missing
variable before the route renders, which is the only way a page can carry that status in this version. It reads the
environment at request time and nothing else.

### The two routes of the session

`POST /api/admin/login` answers `503` without a password, `403` from another origin, `415` without JSON, `400`
without a password, `429` with `Retry-After` when the address is locked, `401` to a wrong password (recording the
failure) and `200` with the signed cookie to the right one, clearing the failures of the address.
`POST /api/admin/logout` requires the session and clears the cookie.

### The tests

```
$ npx vitest run tests/admin-session.test.ts tests/admin-guard.test.ts tests/admin-lockout.test.ts

 Test Files  3 passed (3)
      Tests  13 passed (13)

$ git show --stat 18c3e14
 lib/admin/guard.ts              | 51 +++++++++++++
 lib/admin/lockout.ts            | 80 +++++++++++++++++++
 lib/admin/respond.ts            | 56 ++++++++++++
 lib/admin/session.ts            | 118 +++++++++++++++++++++++++
 lib/store/index.ts              | 92 ++++++++++++++++++++---
 app/api/admin/login/route.ts    | 73 +++++++++++++++++
 app/api/admin/logout/route.ts   | 20 +++
 proxy.ts                        | 24 +++
```

## 3.2 Setup status and the provider tests

`lib/admin/setup.ts` reads `.env.example` and groups its variables by purpose using the comments of the file itself:
the block of comments above a variable is the purpose of that variable, and the first sentence of the block is the
title of the group, so `Required` gathers the three required variables while `Model providers`, `Database` or
`Spending limits and abuse protection` gather theirs. The function returns name and whether it is set, and nothing
else: its type carries no value, which is what makes "values never leave the server" structural. `configured` is a
non-empty value after trimming, and the file is read from `.env.example`, never from `.env`.

`lib/admin/providers.ts` makes the one call of the "Test" button: `generateText` with a one-word message for the
chat, `embedQuery("ping")` for the embeddings, both through the resolvers of the application, and both offline when
the environment picks `fake`. Every failure is returned as `redact(...)`, which removes every value of the
environment from the message and masks `sk-...` and `Bearer ...`, so the owner sees the provider error and never a
key.

`GET /api/admin/setup` returns the groups; `POST /api/admin/setup/test` takes `{"target": "chat" | "embeddings"}`
and returns `{status, target, detail}` with `200` for a successful call and for a provider error (it is a report, not
a failure of the request) and `400` for an unknown target.

```
$ npx vitest run tests/admin-setup.test.ts

 Test Files  1 passed (1)
      Tests  4 passed (4)

$ git show --stat 911c7c5
 app/api/admin/setup/route.ts      | 17 +++
 app/api/admin/setup/test/route.ts | 33 +++++
 lib/admin/providers.ts            | 87 +++++++++++++
 lib/admin/setup.ts                | 92 +++++++++++++
```

## 3.3 Business settings, logo and the prompt rules (decisions 4 and 5)

### The owned module

`lib/settings/business.ts` is the module decision 9 gives to this change, with the exact interface: `Lang`, the
`Business` type of the design (`name`, `hasLogo`, `primaryColor`, `tone`, `language`, `forbiddenTopics`, `welcome`,
`updatedAt`), and `readBusiness(): Promise<Business | null>`. It reads the single row of the store through
`sharedStore`, and it answers `null` — never an exception — when there is nothing stored **or when the table is
missing**, which the test proves by mocking the store so that it throws.

The row lives in the table of the design, `business(id, name, logo_mime, logo_bytes, primary_color, tone, language,
forbidden_topics, welcome_en, welcome_es, updated_at)`, one row with `id = 1`. `saveBusiness` and
`saveBusinessLogo` are the writes the panel needs, on top of the three names of the interface.

### The logo

`lib/admin/logo.ts` decides by the bytes and never by the name: the PNG signature, the JPEG signature and `RIFF....
WEBP`, with a ceiling of `512 KB`. An SVG, a text file renamed to `.png` and a file above the ceiling are refused
with a message that names the reason, and a refusal never touches what is stored.

`POST /api/admin/business/logo` takes the `multipart/form-data` of the form, and `GET /api/brand/logo` serves what
is stored with its MIME type and `public, max-age=300, must-revalidate`, **without** the admin session, which is what
the public page of the other lane needs. The route is owned by this change and its interface is the one of the
design: a `GET` that returns the bytes, its type and its cache header, or `404` when there is no logo yet.

### The prompt

`lib/answer/prompt.ts` adds the rules of decision 5 with `businessRules(business)`: the tone of the business, the
language the owner chose (`Answer in English` / `Answer in Spanish`, which wins over the language of the question
because it is the choice of the owner) and the forbidden topics, with the instruction to answer exactly `NO_ANSWER`
when the question asks about one of them — which `answering` already turns into a refusal. `buildMessages` takes the
business as an optional field, so the existing callers and tests keep the prompt of the base, and
`lib/answer/ask.ts` reads the business of the store once per question and passes it.

The test does not read the string of the prompt: it asks a real question through `askQuestion` with the recording
fake model and asserts that the system message the model received carries the tone, the topic and the language.

### The routes

`GET /api/admin/business` returns the stored business or `null`; `PUT /api/admin/business` validates the shape
(name with content, `#rrggbb` or null, `en` or `es`, an array of topics, two welcomes) and answers `400` with the
shape it expects when the body does not carry it.

```
$ npx vitest run tests/admin-business.test.ts tests/admin-business-missing.test.ts

 Test Files  2 passed (2)
      Tests  9 passed (9)

$ git show --stat 93147f4
 app/api/admin/business/logo/route.ts |  41 +++++
 app/api/admin/business/route.ts      | 104 +++++++++++++
 app/api/brand/logo/route.ts          |  22 +++
 lib/admin/logo.ts                    |  47 +++++
 lib/answer/ask.ts                    |   3 +-
 lib/answer/prompt.ts                 |  40 ++++-
 lib/settings/business.ts             | 127 ++++++++++++++++
 tests/admin-business.test.ts         |   8 +-
```

## 3.4 Documents and conversations (decision 6), the interface in both languages (decision 7)

### Documents

`lib/admin/documents.ts` writes the uploaded file to a temporary path, ingests it with `ingestPaths` — the same
function `npm run ingest` runs, with its type and size checks — and removes the folder in a `finally`, so nothing of
the document stays on disk after the ingestion, as decision 6 asks. The failures of the ingestion are reported with
the name of the file inside the message, because the full temporary path of the machine is nobody's business in a
browser. `reingestDocument` recomputes the embedding of every passage the store keeps, through the same
`replaceDocument` path, and keeps the heading, the position and the hash of the document.

`GET /api/admin/documents` lists every document with its passage count (`countPassages` of the store);
`POST /api/admin/documents` ingests one file and returns the report and the list; `POST
/api/admin/documents/delete` removes a document and its passages; `POST /api/admin/documents/reingest` answers `404`
for a document that is not in the store.

### Conversations

`lib/admin/conversations.ts` lists the latest turns of the store with the question, the status and the citations:
the status is `refused` when the answer is one of the refusals of `answering` and `answered` otherwise, and the
citations are the numbers the answer carries. `GET /api/admin/conversations` returns them newest first;
`POST /api/admin/conversations/delete` empties the table and returns how many turns it removed, and it touches
neither `model_calls` nor `rate_limits`: the test asserts that the counter of the day is still one after the delete.

### The interface in both languages

`lib/i18n/admin.ts` holds every string the panel shows, in English and in Spanish, with the same keys. The panel
opens in English whatever `Accept-Language` says, because nothing reads that header: the language comes from the
cookie `cited-lang` through `resolveLang(cookie, "en")`, and the root layout puts it on `<html lang>` so the
document language of every page of the panel follows the choice.

`components/i18n/LanguageSwitch.tsx` and `lib/i18n/language.ts` are the **stand-in** of decision 9: the same
interface the other lane owns (`LANG_COOKIE`, `resolveLang`, a switch that renders `English | Español` in that order
as two buttons with `aria-pressed`, writes the cookie with `path=/`, `samesite=lax` and one year, and reloads), with
the head the decision asks for in the first line of both files. The tests of the panel **mock** both modules, as the
task asks, and one test of its own checks the interface of the stand-in: the head, the two buttons in order, the
aria state and the cookie of the choice.

The pages are server components (`app/admin/layout.tsx`, `page.tsx`, `business/page.tsx`, `documents/page.tsx`,
`conversations/page.tsx`) and the mutations live in the client components of `components/admin/`, all of them with
the kit of `brand-and-design-system` and without a style overridden at the point of use.

```
$ npx vitest run tests/admin-documents.test.ts tests/admin-routes.test.ts tests/admin-ui.test.tsx tests/admin-i18n.test.tsx

 Test Files  4 passed (4)
      Tests  32 passed (32)

$ git show --stat 6b72279
 app/admin/business/page.tsx              |  20 ++
 app/admin/conversations/page.tsx         |  23 ++
 app/admin/documents/page.tsx             |  22 ++
 app/admin/layout.tsx                     |  50 +++++
 app/admin/page.tsx                       |  45 ++++
 app/api/admin/conversations/delete/...   |  21 ++
 app/api/admin/conversations/route.ts     |  19 ++
 app/api/admin/documents/delete/route.ts  |  31 +++
 app/api/admin/documents/reingest/...     |  39 +++
 app/api/admin/documents/route.ts         |  79 ++++++
 app/layout.tsx                           |  11 +-
 components/admin/*.tsx                   | 7 files
 components/i18n/LanguageSwitch.tsx       |  47 +++
 lib/admin/conversations.ts               |  37 +++
 lib/admin/documents.ts                   | 130 ++++++++++
 lib/i18n/admin.ts                        | 268 ++++++++++++++++++
 lib/i18n/language.ts                     |   8 +
 tests/...                                | 3 files
```

### The whole battery of this step

```
$ npx vitest run tests/admin-session.test.ts ... tests/admin-i18n.test.tsx

 Test Files  10 passed (10)
      Tests  55 passed (55)

$ npm test

 Test Files  27 passed (27)
      Tests  246 passed (246)
   Duration  10.95s

$ npm run typecheck
Generating route types...
✓ Types generated successfully
exit=0

$ npm run lint
exit=0
```

## What changed in the tests while implementing, and why

The tests were written before the code (step 2) and four of their own bounds were wrong. They are recorded here
because a report never says that something was right when it was not:

1. `tests/admin-guard.test.ts`: the "expired session" case signed a token thirteen hours in the **future**, whose
   expiry is twenty-five hours away and which is therefore valid. It now signs a token thirteen hours in the past.
2. `tests/admin-business.test.ts`: the four calls to the public logo route passed a `Request` the handler does not
   take; the handler of `GET /api/brand/logo` needs no request, and the calls are now `brandLogo()`.
3. `tests/admin-documents.test.ts`: the check "the ingestion of the command line is the only path" looked for
   `ingestPaths` inside the route file, which imports `lib/admin/documents.ts` instead; it now reads the three files
   and asserts the chain `route -> ingestUpload -> ingestPaths`. The same file seeded the rate limit with
   `new Date().toISOString()` where the window key is `hourWindowStart(now)`, so the counter it read was zero.
4. `tests/admin-i18n.test.ts` became `tests/admin-i18n.test.tsx`: it now renders the stand-in of the switch with
   React and asserts what a reader sees (two buttons in the order `English | Español`, `aria-pressed`, and the
   cookie the choice writes) instead of looking for the literal string `English | Español` in the source of a
   component that renders the two words as two buttons.

## Commits of this task

- `18c3e14` the session, the lockout, the guard, the two routes of the session and the proxy (3.1).
- `911c7c5` the setup status and the provider tests (3.2).
- `93147f4` the business, the logo, the brand route and the prompt rules (3.3).
- `6b72279` the documents, the conversations and the interface in both languages (3.4).
