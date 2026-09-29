Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task. A task is `[x]` only
with evidence in its report (`reports/2026-09-29-step-N-<name>.md`, a folder inside this change, always written
relative to the change so the path holds after archive; never `reports/` at the root of the repository): the exact command, the commit and the output.
Evidence rule: every `[x]` needs a real report that supports it at archive time; a report in a later commit than its
mark is recorded, not blocking, unless it is missing or contradicts the mark. Commit in small steps on
`feature/public-page-and-widget`: the commits are part of the implementer's work. The repository will be public: no
secret, no customer data. No network call to a real provider in any test.

## 0. Step 0: the branch

- [x] 0.1 Work on `feature/public-page-and-widget`, created by Fable from `main` after `pluggable-models-and-ask` and
      `brand-and-design-system`; confirm branch and base; `npm ci` — report: `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [x] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict`, `git status` — report:
      `reports/2026-09-29-step-1-base-before.md`

## 2. Tests first

- [x] 2.1 Red unit tests for the Markdown renderer (with an XSS corpus), the contrast fallback, the widget builder and
      the session id — report: `reports/2026-09-29-step-2-tests-first.md`
- [x] 2.2 Red E2E for every scenario of `specs/public-chat/spec.md`, including an allowed test origin for the widget,
      and an axe check of `/` and `/embed` — report: `reports/2026-09-29-step-2-tests-first.md`

## 3. Implementation

- [x] 3.1 The chat component and the Markdown renderer (decisions 1 and 2) — report:
      `reports/2026-09-29-step-3-implementation.md`
- [x] 3.2 The public page with the theme from the settings (decision 3) — report:
      `reports/2026-09-29-step-3-implementation.md`
- [x] 3.3 The widget, `/embed` and the headers (decisions 4 and 5), the session (decision 6) — report:
      `reports/2026-09-29-step-3-implementation.md`

## 4. Review and update of the existing tests

- [x] 4.1 The whole suite, including the MODIFIED home page; say which test changed and why — report:
      `reports/2026-09-29-step-4-existing-tests.md`

## 5. Run the checks

- [x] 5.1 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD`, the
      size of `public/widget.js` — report: `reports/2026-09-29-step-5-checks.md`

## 6. Manual verification with curl

- [x] 6.1 `npm run build && npm run start` with the fake providers and the sample corpus; `curl.exe -I` of `/`,
      `/embed` and `/widget.js` with their headers; `curl.exe` of `/api/ask` from the page's flow — report:
      `reports/2026-09-29-step-6-curl.md`

## 7. End-to-end

- [x] 7.1 The E2E of 2.2 green; captures of `/` with an answer and its open citation, and of the widget open on a test
      page, at 1440 and 375 px — report: `reports/2026-09-29-step-7-e2e.md`

## 8. The state of the base after

- [x] 8.1 Repeat 1.1 — report: `reports/2026-09-29-step-8-base-after.md`

## 9. Documentation

- [x] 9.1 `docs/widget.md` (the snippet, `ALLOWED_ORIGINS`, the headers); the README status rows and a real capture of
      the chat; the Spanish twin — report: `reports/2026-09-29-step-9-docs.md`
- [ ] 9.2 The delivery `katalis-dev/tasks/entrega-community-08.md` in Spanish with the captures and `## Issues` —
      report: `reports/2026-09-29-step-9-docs.md`
