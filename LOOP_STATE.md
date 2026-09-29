# LOOP_STATE · Cited

STATUS: DONE
CHANGE: pluggable-models-and-ask (OpenSpec)
ROUND: section 10 of the contract, "What the review of Codex reproduced" (tasks 10.1 to 10.7)
BRANCH: feature/pluggable-models-and-ask
BASE: aa52b7c (main)
HEAD AT THE START OF THE ROUND: 0ca819d ("Close the forged header, the racing limit, the open delimiter and the
retired defaults": the delta specs and the tasks of this section, written by Fable)
HEAD AT THE END OF THE ROUND: 7803e58 ("Narrow the outcome of the forged delimiter test before its citations"); the
closing commit carries this file, the report of the round and the seven checkboxes
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Close the findings of `katalis-dev/tasks/revision-community-05.md` (1 Blocker, 4 Major, 1 Minor, all reproduced by
Codex), tests first and red before each fix, reproducing what the review reproduced, with a real report per `[x]` in
`openspec/changes/pluggable-models-and-ask/reports/2026-09-29-step-10-review-fixes.md`.

## What was delivered

- **10.1 Blocker**: `openspec/specs/answering/spec.md` removed and `openspec/specs/project-readme/spec.md` restored to
  the text of `main`; the README test follows the amended scenario "Available means specified and merged" with
  `capabilityOf`, `openChangeSpecs` and `specIsDelivered`; `openspec archive pluggable-models-and-ask -y` succeeds on a
  throwaway clone (`+ 7`, `~ 2`, `Specs updated successfully`), never in this worktree.
- **10.2 Major 1**: `lib/guards/ip.ts` takes the last value of `x-forwarded-for`, the one the trusted proxy appended.
- **10.3 Major 2**: `reserveModelCall(day, limit)` reserves the call with one `INSERT ... ON CONFLICT ... WHERE
  count < ? RETURNING count` before `generateText`; eight concurrent questions with `DAILY_MODEL_CALL_LIMIT=1` make
  exactly one call and the counter of the day ends at 1.
- **10.4 Major 3**: `lib/answer/prompt.ts` escapes the text, the document name and the heading of a passage, so no
  document can open or close a delimiter and no citation leaves the passages the store has.
- **10.5 Major 4**: `DEFAULT_CHAT_MODELS` and the table of `docs/answering.md` name the model every provider still
  served on 2026-09-29 with its official source and the date: `gpt-4o-mini`, `claude-haiku-4-5-20251001`,
  `gemini-3.8-flash`, `deepseek-flash`, `openai/gpt-oss-120b`, `openai/gpt-4o-mini`, `llama3.1`, `local-model`,
  `fake`.
- **10.6 Minor 1**: the cleanup of the suite has a 60 s margin (`vitest.config.mts` and the `afterAll` of
  `tests/answer.test.ts`, which closes every client before the first delete); `npm test` passes five times in a row and
  under load.
- **10.7**: the full battery on Windows and in a `node:24` Linux container, and the round appended to
  `katalis-dev/tasks/entrega-community-05.md` in Spanish with `## Issues`.

## Evidence

- 12 commits: the red test of each finding in a commit of its own and the fix in the next one (`91d6e9d`, `012dabd`,
  `ad06a3f`, `5ae2ea5`, `03ebfa2`, `684052b`, `81c1803`, `f8f75d5`, `f60d002`, `be92eb3`, `b699670`, `7803e58`).
- One report with the exact command, the commit and the output of every `[x]`:
  `reports/2026-09-29-step-10-review-fixes.md`.
- `npm test`: 16 files and 172 tests green on Windows (Node v24.11.0), five runs in a row, and in a `node:24` Linux
  container (v24.21.0) from a clean clone; `npm run typecheck`, `npm run lint`, `npm run test:e2e`,
  `npm audit --audit-level=high`, gitleaks (197 commits, `no leaks found`), `openspec validate --all --strict`
  (7 items) and `git diff --check main...HEAD` green.
- The archive of the change succeeds on a throwaway clone of the branch; in this worktree nothing was archived.

## The issues that stay open

- The OpenRouter page is rendered by the browser and its fetched text does not state the lifecycle of the model; the
  source and the verification are the ones of the review.
- The LM Studio row points at the official OpenAI-compatibility page (the review calls `local-model` a local
  identifier, not a published model) and `fake` points at this repository.
- The Claude default is the pinned snapshot `claude-haiku-4-5-20251001`; the alias lives on a page the review does not
  cite.
- The escaping makes a model echo entities when a document carries `<`, `>` or `&`; the citations keep the real text.
- The defaults age again; the test pins them but nothing checks the pages by itself.
- The stability of the cleanup was measured here, not on every machine.

## Hard rules respected

- No `.env` file was opened (the repository has none: `Test-Path .env` is `False`, and the Linux clone reported the
  same).
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- The other worktree (`community-ui`, `feature/brand-and-design-system`) was not touched.
- No call to a real provider and no call to Turso: the deterministic `fake` ran every command.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- The text of no task was edited: only its checkboxes; `design.md` and the specs were not touched by this round.
