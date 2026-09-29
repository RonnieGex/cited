# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: admin-panel-and-onboarding (OpenSpec)
ROUND: the whole contract, tasks 0.1 to 9.2
BRANCH: feature/admin-panel-and-onboarding
BASE: 7c4f4ff (main, "Merge brand-and-design-system"); the change starts at 8c054c1 ("Specify the admin panel and the
first-run assistant")
HEAD AT THE START OF THE ROUND: 8c054c1
HEAD AT THE END OF THE ROUND: (pending)
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute the contract `openspec/changes/admin-panel-and-onboarding/tasks.md` written by Fable, in order and complete:
the protected panel `/admin`, the setup status with the provider tests, the business settings with the logo, the
documents, the conversations and the English-first interface with the `English | Español` switch. Tests first and red
before the code, one real report per `[x]` inside the change folder, small commits on the branch, and the delivery
`katalis-dev/tasks/entrega-community-07.md` in Spanish with its `## Issues`.

## What is delivered

(pending: the sections fill in as the tasks close)

## Hard rules respected

- No `.env` file was opened (the repository has none: `Test-Path .env` is `False`).
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- The other worktree (`community-ui`, `feature/public-page-and-widget`) was not touched.
- `lib/settings/business.ts` and `/api/brand/logo` are owned here; `lib/i18n/language.ts` and
  `components/i18n/LanguageSwitch.tsx` are written as the stand-in of decision 9 and mocked by the tests.
- No test calls a real provider.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- The text of no task was edited: only its checkboxes; `design.md` and the specs are not touched.
