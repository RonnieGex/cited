## Why

The first CodeQL run on the public `main` (`3985131`, 2026-09-30) left four open alerts in the product:

- `js/double-escaping` and `js/incomplete-multi-character-sanitization` on the conversion of a Word document
  (`lib/ingest/parse.ts`, `docxToMarkdown`). The first one is a real bug: `&amp;` is decoded before `&lt;`, so the text
  `&lt;` that an author typed comes out as `<`.
- `js/file-system-race` on `parseFile` (`lib/ingest/parse.ts`): the size limit is read with `stat` on the path and the
  bytes with `readFile` on the same path, so the file that is read is not necessarily the file that was measured.
- `js/insufficient-password-hash` on `passwordMatches` (`lib/admin/session.ts`): the password of the panel is digested
  with SHA-256 to compare it in constant time. Nothing is stored, but a fast hash over a password is what the rule
  flags, and a slow derivation costs nothing at the rate the login allows.

The five alerts in scripts and tests (3, 6, 7, 8 and 9) were dismissed on GitHub with their reasons, with Franc's OK.

## What Changes

- A Word document's text is decoded in one pass, so an entity is decoded once, and its markup is removed until none is
  left.
- The size limit is read from the open file whose bytes are read.
- The password of the panel is compared through scrypt under a salt drawn when the process starts, in constant time.

## Impact

- Code: `lib/ingest/parse.ts`, `lib/admin/session.ts`.
- Tests: `tests/ingest.test.ts`, `tests/admin-session.test.ts`.
- Specs: `knowledge-search` and `admin-panel` gain one requirement each (deltas in `specs/`).
- Docs: the rows of `docs/security.md` on the password and on the size limit.
- No change to the API, the database or the interface.
