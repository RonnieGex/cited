# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: pluggable-models-and-ask (OpenSpec)
ROUND: section 10 of the contract, "What the review of Codex reproduced" (tasks 10.1 to 10.7)
BRANCH: feature/pluggable-models-and-ask
BASE: aa52b7c (main)
HEAD AT THE START OF THE ROUND: 0ca819d ("Close the forged header, the racing limit, the open delimiter and the
retired defaults": the delta specs and the tasks of this section, written by Fable)
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Close the findings of `katalis-dev/tasks/revision-community-05.md` (1 Blocker, 4 Major, 1 Minor, all reproduced by
Codex), tests first and red before each fix, reproducing what the review reproduced, with a real report per `[x]` in
`openspec/changes/pluggable-models-and-ask/reports/2026-09-29-step-10-review-fixes.md`.

## The round, one line per finding

- **10.1 Blocker**: `/archive` aborts because `openspec/specs/answering/spec.md` was written before the archive and
  `openspec/specs/project-readme/spec.md` was modified by hand. Delete the first, restore the second from `main`, let
  the README test follow the amended scenario, and show `openspec archive pluggable-models-and-ask -y` succeeding on a
  throwaway clone.
- **10.2 Major 1**: with `TRUST_PROXY=1` the address is the last value of `x-forwarded-for`, the one the proxy
  appended, so a forged prefix cannot change the rate-limit bucket.
- **10.3 Major 2**: the daily limit is reserved atomically before the model call, so eight concurrent questions with
  `DAILY_MODEL_CALL_LIMIT=1` make exactly one call.
- **10.4 Major 3**: the content of a passage is escaped, so a document cannot close or open a delimiter.
- **10.5 Major 4**: the defaults of `lib/models/types.ts` and `docs/answering.md` are models the providers still
  serve, each row with its official source and the date it was checked.
- **10.6 Minor 1**: the `afterAll` of `tests/answer.test.ts` closes every client before it deletes and `npm test`
  passes five times in a row.
- **10.7**: the full battery on Windows and in a `node:24` Linux container, and the round appended to
  `katalis-dev/tasks/entrega-community-05.md` in Spanish with `## Issues`.

## State

The round is in progress. Nothing is pushed and nothing is archived in this worktree.

## Previous round (0.1 to 9.3)

The answer with citations, the nine providers, the guards, the CLI, the docs and the README were delivered in 14
commits with 10 reports; `revision-community-05.md` confirmed the happy paths and found the six issues this round
closes. The old `LOOP_STATE.md` of that round is in the history of this branch.
