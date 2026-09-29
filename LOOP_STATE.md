# LOOP_STATE · Cited

STATUS: DONE
CHANGE: admin-panel-and-onboarding (OpenSpec)
ROUND: the whole contract, tasks 0.1 to 9.2
BRANCH: feature/admin-panel-and-onboarding
BASE: 7c4f4ff (main, "Merge brand-and-design-system"); the change starts at 8c054c1 ("Specify the admin panel and the
first-run assistant")
HEAD AT THE START OF THE ROUND: 8c054c1
HEAD AT THE END OF THE ROUND: 810720d, plus the closing commit that carries this file, the report of step 9 and the
delivery `katalis-dev/tasks/entrega-community-07.md`
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute the contract `openspec/changes/admin-panel-and-onboarding/tasks.md` written by Fable, in order and complete:
the protected panel `/admin`, the setup status with the provider tests, the business settings with the logo, the
documents, the conversations and the English-first interface with the `English | Español` switch. Tests first and red
before the code, one real report per `[x]` inside the change folder, small commits on the branch, and the delivery
`katalis-dev/tasks/entrega-community-07.md` in Spanish with its `## Issues`.

## What was delivered

- **0 and 1**: the branch and its base confirmed, `npm ci` green (626 packages, 0 vulnerabilities), and the battery
  of the base (17 files, 191 tests) with the tables of the store before.
- **2**: ten test files written before the code and run red (10 files and 1 test red against 191 green), and the
  end-to-end red because the build rejects the modules the spec asks for.
- **3.1**: the cookie `cited_admin` with `expiry.hmac` signed with `ADMIN_SESSION_SECRET` (`httpOnly`,
  `sameSite=strict`, twelve hours, `secure` outside `localhost`), the password compared in constant time, the lockout
  of five failures per address in fifteen minutes in `login_attempts`, the shared guard with the check of the
  `Origin`, and `proxy.ts` answering `503` on `/admin` when a variable is missing.
- **3.2**: `lib/admin/setup.ts` grouping every variable of `.env.example` by the purpose its own comments declare,
  and the two provider tests that make one small call and redact every key from an error.
- **3.3**: the business row of the store, the owned `lib/settings/business.ts` with the exact interface of the
  design, the logo decided by its bytes, `/api/brand/logo` without a session, and the tone, the language and the
  forbidden topics of the business as rules of the prompt.
- **3.4**: the upload through `lib/ingest` with a temporary path, the list, the delete, the re-ingestion, the
  conversations with their status and citations, the delete of all of them, and the panel in English and Spanish with
  the stand-in of the shared switch.
- **4 to 8**: the whole suite, the battery on Windows and in a `node:24` Linux container, the manual verification
  with `curl.exe` (503, 401, the sixth attempt as 429 with `Retry-After: 900`, and an upload with the cookie), the
  end-to-end green with an axe check of every page, and the battery repeated.
- **9**: `docs/admin.md` with the five captures, the README row of the panel moved to `Available` with the roadmap
  rendered again, the Spanish twin, the living documents corrected, and the delivery in Spanish.

## Evidence

- 15 commits of the implementation on the specification, plus the closing commit.
- One report per step inside the change:
  `reports/2026-09-29-step-{0,1,2,3,4,5,6,7,8,9}-*.md`, each one with the exact command, the commit and the output.
- `npm test`: 27 files and 247 tests green on Windows (Node v24.11.0), and 245 green with 2 skipped in a `node:24`
  Linux container (v24.21.0) from a clean clone with its own `npm ci`.
- `npm run test:e2e`: 10 tests green, the six flows of the panel and the four of the base, with zero axe violations.
- `npm run typecheck`, `npm run lint`, `npm audit --audit-level=high` (0 vulnerabilities),
  `gitleaks git` (241 commits, `no leaks found`), `openspec validate --all --strict` (9 items) and
  `git diff --check main...HEAD`: green.
- The captures of every page at 1440 and 375 px are in `katalis-dev/tasks/capturas-community-07/`; the one of the
  business is committed in `docs/images/admin/panel.png`.

## The issues that stay open

- The root layout reads the language cookie, so every route of the application is dynamic; the public page lane has
  to know it before promising a static page.
- The suite carries a margin of 20 s per test because two slow tests of the base timed out under the load of the ten
  new files in the Linux container.
- The lockout is per address, and without `TRUST_PROXY` every visitor shares one bucket.
- The re-ingestion recomputes the embeddings from the passages the store keeps; it does not read the original file
  again.
- The change is not archived (that needs the explicit OK of Franc), nothing was pushed and nothing was deployed.
- The merge with the parallel lane is not proven: both edit the README and both write the shared language module.

## Hard rules respected

- No `.env` file was opened (the repository has none: `Test-Path .env` is `False`).
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- The other worktree (`community-ui`, `feature/public-page-and-widget`) was not touched.
- `lib/settings/business.ts` and `/api/brand/logo` are owned here; `lib/i18n/language.ts` and
  `components/i18n/LanguageSwitch.tsx` are the stand-in of decision 9, with its head on the first line, and the tests
  of the panel mock it.
- No test calls a real provider.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- The text of no task was edited: only its checkboxes; `design.md` and the specs are untouched.
