# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: cited-identity-and-readme (OpenSpec)
ROUND: section 14, third review round (tasks 14.1 to 14.3)
BRANCH: feature/cited-identity-and-readme
BASE: 5dec3af (main)
HEAD AT THE START OF THE ROUND: 387e2df
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute section 14 of `openspec/changes/cited-identity-and-readme/tasks.md`, the contract Fable wrote after
`katalis-dev/tasks/revision-community-03c.md`: one Major (the test and the guard exclude the whole `demo` subtree of the
records, so a present-tense promise in a demo field passes). Fable narrowed the exemption in the amended scenario: only
the output lines captured verbatim from the real run of the quick start, the command lines and the lines they printed,
are exempt; every other demo field is checked. Tests first and red, small commits, section 10 stays reserved for Fable.

## What the round must deliver

- **14.1** Tests first: a present-tense answer claim in any text field under `demo` other than the captured output lines
  turns the test red and makes the render guard exit non-zero; both red runs pasted.
- **14.2** Replace the prefix exclusion of `demo` in `scripts/readme-graphics/honesty.mjs` and `tests/readme.test.ts`
  by an exemption of the captured output lines only, as the amended scenario says; green.
- **14.3** `npm test`, `npm run typecheck`, `npm run lint`, gitleaks, `openspec validate --all --strict`,
  `git diff --check main...HEAD`, and the round appended to `katalis-dev/tasks/entrega-community-03.md` with
  `## Issues`.

## State of the tree

The round opened on `feature/cited-identity-and-readme` at `387e2df` with a clean tree. `main` still points at
`5dec3af`, no remote was contacted, nothing was pushed and nothing was archived. Section 10 stays untouched because it
is Fable's.

## Hard rules respected

- No `.env` file was opened.
- No push, no remote, no commit in `main`, no archive.
- No call to a real provider and no call to Turso: the deterministic `fake` provider runs every command.
- No secret, no customer data and no text of the Construye book in any commit.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
