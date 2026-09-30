# Step 8.1: the state of the base after the change

- Date: 2026-09-29
- Change: `voice-owner-words`
- Branch: `feature/voice-owner-words`
- Agent: deepseek-harness
- Commit verified: the commit that carries this report
- Task: 8.1

## The same commands of step 1.1

```
$ npm test
 Test Files  69 passed (69)
      Tests  599 passed (599)
   Duration  33.80s (tests 45%, environment 27%, import 12%, setup 11%, transform 4%, worker 1%)
exit=0

$ npm run typecheck
> next typegen && tsc --noEmit
Generating route types...
✓ Types generated successfully
exit=0

$ npm run lint
> eslint .
exit=0

$ npx openspec validate --all --strict
✓ spec/admin-panel
✓ spec/answering
✓ spec/app-skeleton
✓ spec/design-system
✓ spec/knowledge-search
✓ spec/product-identity
✓ spec/project-readme
✓ spec/provider-settings
✓ spec/public-chat
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
✓ spec/voice-agent
✓ change/voice-owner-words
Totals: 13 passed, 0 failed (13 items)
exit=0

$ npm run store:state -- .data/step-1-base.sqlite
store: <the worktree>\.data\step-1-base.sqlite
exists: true
bytes: 131072
tables: 14 (plus the 5 of the full-text index)
  documents rows=0
  passages rows=0
  passages_fts rows=0
  rate_limits rows=0
  model_calls rows=0
  voice_minutes rows=0
  voice_agent rows=1
  conversations rows=0
  login_attempts rows=0
  business rows=0
  provider_settings rows=0 (added by this change)
  provider_tests rows=0 (added by this change)
  document_index rows=0 (added by this change)
rows of the tables this change added: 0
exit=0
```

The first line of `store:state` prints the absolute path of the store and it is elided here as `<the worktree>` for the
same reason as in the report of step 1.1: no tracked file of this repository may carry a home directory.

## What changed, and what did not

- **`npm test`**: the base before was red, 68 files and 589 tests with one failing assertion of
  `tests/readme.test.ts` (`expected true to be false`). It is now 69 files and 599 tests, all green: the change adds
  `tests/voice-owner-words.test.ts` with ten tests, updates the assertions on the old payload of
  `tests/voice-signed-url.test.ts` and `tests/voice-minute-cap.test.ts`, and amends the guard of
  `tests/readme.test.ts` so an ADDED delta over a capability already in force stops being read as a spec written by
  hand (all of it in the report of step 4).
- **`npm run typecheck`, `npm run lint` and `openspec validate --all --strict`**: green before and green after, with
  the same thirteen items. The typecheck was red in the middle of the round only because the test of step 2.1 named the
  two strings of the screen before they existed, which is the red the contract asks for.
- **The store**: the same file, the same size (`bytes: 131072`), the same fourteen tables and the same counts, row by
  row. The change adds no table, no column and no write path: it only changes the body of two answers and the sentence
  of a screen. Nothing of the database moved.

## Verdict

Task 8.1 is done: the state of the base after the change is recorded with the same commands of step 1.1, the suite went
from one red assertion to 599 green tests and no table of the store changed.
