---
description: Backend standards for Cited. Next.js route handlers, libSQL, Vercel AI SDK, server-only configuration.
alwaysApply: true
---

# Backend standards

## 1. Stack

- Next.js 16 route handlers under `app/api/`. There is no separate service: the API and the page are the same
  process.
- libSQL (change 2): a SQLite file in local or in Docker, Turso in the cloud, with the same code. Vectors and
  full-text search fused with RRF.
- Vercel AI SDK for the model providers (change 3). The provider is chosen with environment variables, never in code.
- Hand-written SQL migrations under `migrations/`, applied in order and tracked in a `schema_migrations` table.
- Vitest for unit tests, Playwright for the flows that cross the browser.
- `npm run lint` (ESLint), `npm run typecheck` (`tsc --noEmit`) and `npm run build` are mandatory and run in the
  pipeline.

## 2. Configuration and secrets

- Every environment variable is read once in `lib/settings.ts`, validated, and the process fails fast when a required
  value is missing. An empty string is an absent value: the feature it enables is off and the health route says so.
- Keys live only in the environment of the server. They are never written to the database, never sent to the
  browser, never logged and never written to a report.
- `.env.example` carries the names with empty values and a line that explains what each one is for. Local values live
  in `.env`, which is ignored by git.
- `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` and `VOICE_TOOL_SECRET` are required in every deployment. Without
  `ADMIN_PASSWORD`, or with fewer than 16 characters, the panel does not start.

## 3. Route handlers

- A route handler validates its input before it uses it: body, query and headers are parsed with a schema, never read
  from `unknown` with a cast.
- The public answer route is the only endpoint a stranger can call. It carries a per-IP limit, a daily cap of model
  calls, a cap of tokens per answer and a maximum question length of 1000 characters. **Planned** in
  `pluggable-models-and-ask`.
- The administration session is an `httpOnly`, `secure` and `sameSite` cookie, with a limit on access attempts.
- The voice tool route requires its own Bearer secret of the installation; a signed URL is requested from the server
  and expires in 15 minutes.
- Errors return a status and a short message. A stack trace, a key or an internal path never reaches the client.

## 4. Data

- Conversations are stored only in the installation, with a configurable retention of days and a button that deletes
  them. There is zero telemetry to Katalis.
- An uploaded document is validated by its real type, its size (20 MB maximum) and its page count before it is read.
  Nothing that is uploaded is executed.
- A migration is idempotent and safe to run twice. Data of a real installation is never deleted by a test.

## 5. Tests

- Test first: the failing test exists before the code that makes it pass.
- Unit tests are hermetic: no network, no container and no real key, with a fake model and a fake embedding.
- A test that needs the database uses a temporary file per run and deletes it at the end.
- Every change that touches the database reports its state before and after, in the change report.

## 6. Code style

- No comments in the code. Names carry the meaning; the explanation goes in `design.md`.
- No `Co-Authored-By` trailers in commits.
- English everywhere except the Spanish part of `README.md`.
- Only explicit paths are staged: `git add <path>`.

## 7. Definition of done of a backend change

1. `openspec validate --all --strict` passes before any code is written.
2. The test is written first and fails for the right reason.
3. `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` are green, with their output in the report.
4. The manual verification is executed by the agent itself, with `curl.exe` against the local server, and its output
   is pasted in the report.
5. `docs/` is updated with what the change really added.
6. The change closes with its report and its `## Issues` section, and it is archived only with the OK of Franc.
