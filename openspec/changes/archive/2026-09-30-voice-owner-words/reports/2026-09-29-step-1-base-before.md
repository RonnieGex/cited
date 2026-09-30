# Step 1.1: the state of the base before the change

- Date: 2026-09-29
- Change: `voice-owner-words`
- Branch: `feature/voice-owner-words`
- Agent: deepseek-harness
- Commit verified: `b7e3dcc` (the report of step 0 and its mark); the code of the base is `2f9a75b`, untouched
- Task: 1.1

## Command and output

```
$ npm test
 Test Files  1 failed | 67 passed (68)
      Tests  1 failed | 588 passed (589)
   Start at  18:32:36
   Duration  44.93s (tests 41%, environment 32%, import 12%, setup 11%, transform 5%, worker 1%)
exit=1
```

The one failure, alone:

```
$ npx vitest run tests/readme.test.ts
 ❯ tests/readme.test.ts (42 tests | 1 failed) 390ms
   ❯ README, the status table (2)
     × marks every row Available or Planned, with the spec or the change that delivers it 13ms

 FAIL  tests/readme.test.ts > README, the status table > marks every row Available or Planned, with the spec or the
 change that delivers it
AssertionError: Voice agent with ElevenLabs, created in one click: a spec an open change still adds is never written by
hand: expected true to be false // Object.is equality
 ❯ tests/readme.test.ts:683:11
exit=1
```

```
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

$ node --input-type=module -e "import { openStore } from './lib/store/index.ts'; const s = await openStore('.data/step-1-base.sqlite'); await s.saveVoiceAgent({ agentId: 'agent_de_la_base', secretId: 'secret_1', toolId: 'tool_1', sourcesToolId: 'tool_2', language: 'es' }); s.close(); console.log('store of the base created');"
store of the base created
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

The store of `.data/step-1-base.sqlite` was created by the code of the base (`openStore()` of `lib/store/index.ts`), it
writes one row of `voice_agent`, and the reader of `scripts/store-state.ts` shows the fourteen tables of the schema
with their real counts and no error. The first line of that output is the absolute path of the store; it is elided
here as `<the worktree>`, because no tracked file of this repository may carry a home directory
(`tests/personal-paths.test.ts`) and the change wrote the names of its own store with a relative path.
`store:state` also printed `.env not found. Continuing without it.` to stderr: this worktree carries no `.env`, and no
`.env` was opened.

## The red of the base is the contract itself, not the code

The failing test is not about the voice routes. It is `tests/readme.test.ts`, the guard of the status table of
`README.md`, and it fails on the row "Voice agent with ElevenLabs, created in one click" (`Available`,
`[voice-agent](openspec/specs/voice-agent/spec.md)`):

- `openspec/specs/voice-agent/spec.md` exists in force, so `inForce` is `true`;
- the open change `voice-owner-words` carries `specs/voice-agent/spec.md` with `## ADDED Requirements`, so
  `openChangeSpecs("voice-agent")` is not empty;
- the guard refuses that pair (`inForce && delivering.length > 0`): "a spec an open change still adds is never written
  by hand".

The cause is commit `2f9a75b`, the contract itself: it is the first open change of this repository that ADDS a
requirement to a capability whose spec is already in force. `provider-keys-in-panel`, the lane before it, only MODIFIED
the specs in force (`answering`, `knowledge-search`) and ADDED the one capability that did not exist yet
(`provider-settings`), which is the case the guard was written for. The code of the base has no part in the failure:
`git stash`-free `npm test` at `b7e3dcc`, whose only difference from `d71220d` is the contract and this report, is red
by exactly this assertion.

The change may not edit the text of the specs (rule of the round) and it cannot mark the voice row `Planned`: the voice
agent is available today and the README says so in its prose, which other guards of the same file compare against. The
only lever left is the guard, and it is the task 4.1 "review and update of the existing tests" which carries it: the
report of step 4 says exactly what line changes and why. It is also an Issue of the delivery
(`tasks/entrega-community-15.md`).

## Verdict

Task 1.1 is done, and the state of the base before the change is recorded with its exact commands and outputs:
`npm run typecheck`, `npm run lint`, `openspec validate --all --strict` (13 items) and `store:state` over a store
created by the base are green, and `npm test` is red with one assertion, `tests/readme.test.ts:683`, caused by the
ADDED delta of the contract on a capability already in force and not by the code of the base.
