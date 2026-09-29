Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task. A task is `[x]` only
with evidence in its report (`reports/2026-09-29-step-N-<name>.md`, a folder inside this change, always written
relative to the change so the path holds after archive; never `reports/` at the root of the repository): the exact command, the commit and the output.
Evidence rule: every `[x]` needs a real report that supports it at archive time; a report in a later commit than its
mark is recorded, not blocking, unless it is missing or contradicts the mark. Commit in small steps on
`feature/admin-panel-and-onboarding`: the commits are part of the implementer's work. The repository will be public: no
secret, no customer data. No network call to a real provider in any test.

## 0. Step 0: the branch

- [x] 0.1 Work on `feature/admin-panel-and-onboarding`, created by Fable from `main` after `pluggable-models-and-ask`
      and `brand-and-design-system`; confirm branch and base; `npm ci` — report: `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [x] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict`, `git status`; the tables
      of the store — report: `reports/2026-09-29-step-1-base-before.md`

## 2. Tests first

- [x] 2.1 Red unit and route tests for every scenario of `specs/admin-panel/spec.md` — report:
      `reports/2026-09-29-step-2-tests-first.md`
- [x] 2.2 Red E2E: login, lockout, setup page without values, business form, logo refusal, upload, list and delete a
      document, conversations and delete all, an axe check of each page — report:
      `reports/2026-09-29-step-2-tests-first.md`

## 3. Implementation

- [x] 3.1 Session, lockout, guard and CSRF check (decisions 1 to 3) — report:
      `reports/2026-09-29-step-3-implementation.md`
- [x] 3.2 Setup status and the provider tests — report: `reports/2026-09-29-step-3-implementation.md`
- [x] 3.3 Business settings, logo and the prompt rules (decisions 4 and 5) — report:
      `reports/2026-09-29-step-3-implementation.md`
- [x] 3.4 Documents and conversations (decision 6), the interface in both languages (decision 7) — report:
      `reports/2026-09-29-step-3-implementation.md`

## 4. Review and update of the existing tests

- [x] 4.1 The whole suite; say which test changed and why — report: `reports/2026-09-29-step-4-existing-tests.md`

## 5. Run the checks and the state of the store

- [x] 5.1 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD` —
      report: `reports/2026-09-29-step-5-checks.md`
- [x] 5.2 The tables of the store after the tests and after the E2E, with their row counts — report:
      `reports/2026-09-29-step-5-checks.md`

## 6. Manual verification with curl

- [x] 6.1 `npm run build && npm run start`; `curl.exe` of `/admin` without the variable (503), of an admin API without
      a session (401), the login and the sixth failed attempt (429), and an upload with the session cookie — report:
      `reports/2026-09-29-step-6-curl.md`

## 7. End-to-end

- [x] 7.1 The E2E of 2.2 green; captures of each page at 1440 and 375 px — report: `reports/2026-09-29-step-7-e2e.md`

## 8. The state of the base after

- [x] 8.1 Repeat 1.1 — report: `reports/2026-09-29-step-8-base-after.md`

## 9. Documentation

- [x] 9.1 `docs/admin.md`; the README status row and one real capture of the panel; the Spanish twin — report:
      `reports/2026-09-29-step-9-docs.md`
- [x] 9.2 The delivery `katalis-dev/tasks/entrega-community-07.md` in Spanish with the captures and `## Issues` —
      report: `reports/2026-09-29-step-9-docs.md`

## 10. What the review of Codex reproduced (contract amended by Fable after `revision-community-07`)

Report: `reports/2026-09-29-step-10-review-fixes.md`. Tests first, red before each fix, reproducing what the review
reproduced.

- [x] 10.1 Major: `TRUST_PROXY` as a number of trusted proxies in `lib/guards/ip.ts` (the MODIFIED requirement of
      `specs/answering/spec.md`), `.env.example` and `docs/security.md` saying the same thing — report: the one of
      this section
- [x] 10.2 Major: the lock of the login only for a known address, the delay of one second per failure otherwise, and
      the 16 characters of `ADMIN_PASSWORD` (the amended requirement and its two new scenarios) — report: the one of
      this section
- [x] 10.3 Minor: `readBusiness()` returns `null` only when the table is missing and lets every other error through —
      report: the one of this section
- [x] 10.4 Minors: the exact commit in every report that lacks it (no `<commit>` left), the count of commits in the
      delivery, and the capture `login-375.png` — report: the one of this section
- [x] 10.5 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm run test:e2e`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD`; append the round
      to `katalis-dev/tasks/entrega-community-07.md` with `## Issues` — report: the one of this section

## 11. The integration with `main` (contract amended by Fable after `revision-community-07b`)

`main` now carries `public-page-and-widget` (`ee966f0`). Report: `reports/2026-09-29-step-11-integration.md`.

- [ ] 11.1 `git merge main` into this branch (never a commit on `main`) and resolve every conflict by these rules, one
      commit for the merge: `lib/settings/business.ts` and `/api/brand/logo` keep this branch's version (the panel owns
      them); `lib/i18n/language.ts` and `components/i18n/LanguageSwitch.tsx` keep `main`'s version (the public page owns
      them) and every stand-in header disappears; `proxy.ts`, the root layout, `playwright.config.ts`, the README and
      its twin keep the behaviour of both sides (the nonce and `frame-ancestors` of the public pages, and the guards of
      the panel; the ports and origins of both suites); list each conflicted file and the rule applied — report: the
      one of this section
- [ ] 11.2 Minor: `readBusiness()` returns `null` only for the missing table `business`, and a missing `documents` table
      (or any other error) reaches the caller — report: the one of this section
- [ ] 11.3 Minor: the command of 10.4 in its report shows the real output (the three historical mentions it finds), or
      a command that excludes them on purpose — report: the one of this section
- [ ] 11.4 The whole battery on the merged branch: `npm test` on Windows and in a `node:24` Linux container,
      `npm run typecheck`, `npm run lint`, `npm run test:e2e` (the panel and the public page together), gitleaks,
      `openspec validate --all --strict`, `git diff --check main...HEAD`; append the round to
      `katalis-dev/tasks/entrega-community-07.md` with `## Issues` — report: the one of this section
