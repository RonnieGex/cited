# LOOP_STATE · Cited

STATUS: DONE
CHANGE: public-page-and-widget (OpenSpec)
ROUND: the whole contract, steps 0 to 9
BRANCH: feature/public-page-and-widget
BASE: 7c4f4ff (main, "Merge brand-and-design-system")
HEAD AT THE START OF THE ROUND: 86c4598 ("Specify the public page and the widget": the delta specs and the tasks,
written by Fable)
HEAD AT THE END OF THE ROUND: 1b3dbd6 ("Render the graphics and their record from one run of the quick start"); the
closing commit carries this file, the report of step 9.2 and the last two checkboxes
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute `openspec/changes/public-page-and-widget/tasks.md` in order and in full: the public page of the business as a
chat in English first with the switch `English | Español`, the answer rendered as sanitized Markdown with its citation
chips, the widget `/widget.js` with `/embed` and the `frame-ancestors` of `ALLOWED_ORIGINS`, one `sessionId` per tab,
tests first and red before the code, a real report per `[x]` in
`openspec/changes/public-page-and-widget/reports/`, small commits on the branch.

## What was delivered

- **2.1 and 2.2, tests first**: nine unit files (Markdown with a corpus of 13 XSS entries, the contrast fallback, the
  widget, the session, the language, the headers, the browser client of `/api/ask`, the chat and the page) and two
  end-to-end files, red before any line of the implementation: 9 files could not even resolve their modules and 8 of
  the 12 E2E tests failed.
- **3.1**: `components/chat/` (the one chat of `/` and `/embed`: the question box, the turns, the loading state in
  words, the refusal style and the citation chips that open the excerpt, the document and the heading),
  `lib/markdown/` (the allowlist renderer: paragraphs, lists, bold, italic, code and `http`/`https` links, with raw
  HTML never parsed and the tree as the only thing painted), `lib/chat/session.ts` (`cited-session`, one
  `crypto.randomUUID()` per tab), `lib/chat/client.ts`, `lib/i18n/language.ts`, `lib/i18n/public.ts`,
  `components/i18n/LanguageSwitch.tsx` and the stand-in of `lib/settings/business.ts` with the exact interface and the
  header of design decision 8.
- **3.2**: `lib/theme/primary.ts` (the primary color of the settings checked against the ink and the paper, lime as the
  fallback, and the token that is legible on the fill), `lib/public/brand.ts`, `app/page.tsx` (one `main`, one `h1`,
  the logo of the panel, the chat and the foot with the flame) and `app/layout.tsx` (the language of the document).
- **3.3**: `lib/widget/script.ts` with `scripts/build-widget.mjs` and the committed `public/widget.js` of 2175 bytes,
  `app/embed/page.tsx`, `lib/headers/csp.ts` and `proxy.ts` (the nonce of Next, `frame-ancestors 'self'` on `/` and
  `'self'` plus `ALLOWED_ORIGINS` on `/embed`).
- **4**: the whole suite green with the MODIFIED home page and three existing tests updated with their reason.
- **5**: the battery on Windows and in a `node:24` Linux container, the type check, the lint, the audit, gitleaks, the
  spec validation, `git diff --check` and the size of the widget.
- **6**: the two public documents and the widget verified with `curl.exe` over `npm run start`, with the headers and
  the three questions of the flow.
- **7**: the twelve end-to-end tests green (axe reports no violation on `/` and `/embed`) and the captures of `/`,
  `/embed` and the widget at 1440 and 375 px.
- **8**: the battery repeated: 26 files, 264 tests, the worktree clean.
- **9**: `docs/widget.md`, the README rows of both languages, the real capture of the chat in the README, the graphics
  that no longer mark the widget as `Next` and the delivery `katalis-dev/tasks/entrega-community-08.md` in Spanish with
  its `## Issues`.

## Evidence

- 15 commits of this round against the contract (16 against `main`), one per step, with two for the documentation and
  one for the correction of a report: `fca625b`, `5d0cd13`, `44463da`, `9c014e8`, `9d83048`, `226a4fe`, `88e3afd`,
  `f0c9ae6`, `fac3a3c`, `0020c64`, `e40f52d`, `5641a78`, `1de8368`, `1b3dbd6` and the closing commit.
- One report per step in `openspec/changes/public-page-and-widget/reports/`, each with the exact command, the commit
  and the real output.
- `npm test`: 26 files and 264 tests green on Windows (Node v24.11.0) and 261 passed with 2 skipped in a `node:24`
  Linux container (v24.21.0) from a clone; `npm run test:e2e`: 12 tests green with axe at 0 violations on `/` and
  `/embed`; `npm run typecheck`, `npm run lint`, `npm run build`, `npm audit --audit-level=high`, gitleaks (230
  commits, `no leaks found`), `openspec validate --all --strict` (9 items) and `git diff --check main...HEAD` (exit 0).
- The captures and the delivery live outside the repository, in `katalis-dev/tasks/capturas-community-08/` and
  `katalis-dev/tasks/entrega-community-08.md`.

## The issues that stay open

- `style-src 'self' 'unsafe-inline'` on the two public documents: the primary color of the settings is an inline style
  attribute and a nonce does not cover attributes. The scripts stay strict.
- Every route is rendered on demand from now on, because the layout reads the cookie of the language and the settings
  to declare `lang`.
- The stand-in of `lib/settings/business.ts` answers `null` until the parallel lane merges, and `/api/brand/logo` was
  never reached by a test of this round.
- A partial run of `scripts/render-readme-graphics.mjs` leaves the record and the README out of step; running the whole
  script fixes it and the guard belongs to another change.
- `ALLOWED_ORIGINS` was not added to `.env.example`, because the hard rule of this round forbids opening any `.env`
  file: it is documented in `docs/widget.md` and its row of the README says `yes`.
- No push, no remote, no merge, no archive, no deploy and no call to a real provider: all of it is Fable's or belongs to
  the pipeline.

## Hard rules respected

- No `.env` file was opened (the repository has none in this worktree).
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- The other worktree (`community`, `feature/admin-panel-and-onboarding`) was not touched; its branch name was read once
  in `git worktree list`, and `lib/settings/business.ts` is only the stand-in of design decision 8.
- No test called a real provider: the deterministic `fake` ran every command.
- No personal path in a versioned file (a report of step 0 fixed one before the base was green, and step 2's report was
  trimmed).
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- The text of no task was edited: only its checkboxes; `design.md` and the specs were not touched.
