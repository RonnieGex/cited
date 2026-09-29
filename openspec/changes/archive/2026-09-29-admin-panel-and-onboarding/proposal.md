## Why

The promise of Cited is that an owner forks it, sets a few variables, and puts their business on it without touching
code. Today that takes the terminal: `npm run ingest` and `.env` by hand. This change gives the owner a protected panel
to see what is configured, describe the business, and upload the documents. It is change 4 of the plan
(`admin-and-public-ui`), split in two so the panel and the public page can be built in parallel; the public page is
`public-page-and-widget`.

## What Changes

- **`/admin`, protected by `ADMIN_PASSWORD`.** Without the variable the panel refuses to start and says which variable
  is missing. A login form sets a signed, `httpOnly`, `secure`, `sameSite=strict` session cookie
  (`ADMIN_SESSION_SECRET`); five failed attempts per IP in fifteen minutes lock the login for fifteen minutes.
- **Setup status**: every variable of `.env.example` grouped by purpose, shown as set or missing, never its value, with
  a "Test" button for the chat model and the embeddings that makes one tiny real call and reports success or the
  provider's error without echoing a key.
- **Business information** stored in the store: name, logo (PNG, JPEG or WebP up to 512 KB; no SVG), primary color,
  tone, language (Spanish or English), topics the assistant must not discuss, and the welcome message in English and in Spanish. The answer
  prompt uses tone, language and forbidden topics; the public page uses name, logo, color and welcome.
- **Documents**: upload (PDF, DOCX, Markdown, text, with the limits of the ingestion), the list with passages per
  document, delete, and re-ingest; the same code path as `npm run ingest`.
- **Conversations**: the latest questions with their status and citations, and a button that deletes all of them.
- English and Spanish interface, English first: English unless the owner picks `Español` in the switch `English |
  Español`, kept in a cookie (Franc, 2026-09-29); built with the kit of `brand-and-design-system`.

## Impact

- New: `app/admin/**`, `app/api/admin/**`, `lib/admin/` (session, lockout, settings), store tables `business` and
  `login_attempts`, tests and E2E, `docs/admin.md`.
- Changed: `lib/answer/` (prompt reads the business settings), the README (status row and a screenshot of the panel).
