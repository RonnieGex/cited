# Step 1: the state of the base before (task 1.1)

Date: 2026-09-30. Branch `feature/guided-setup-and-knowledge` at 2a69eb5 (the contract), from `main` 5929b64.

Every command of this report runs with the Node the engine asks for, the way task 0.1 and the task of this round
require:

    $ npx -y -p node@24 node -v
    v24.21.0

## `npm test`

    $ npx -y -p node@24 node node_modules/vitest/vitest.mjs run

     Test Files  1 failed | 78 passed (79)
          Tests  2 failed | 884 passed (886)
       Duration  57.62s

The two failures are the two cases of `tests/personal-paths.test.ts` and they are already there before this change
touches anything:

    $ npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/personal-paths.test.ts

     Test Files  1 failed (1)
          Tests  2 failed | 5 passed (7)

    - Expected
    + Received
    - []
    + [
    +   "openspec/changes/guided-setup-and-knowledge/design.md",
    + ]
    ❯ tests/personal-paths.test.ts:156:49
      155|   it("carry no home directory of a development machine", () => {
      156|     expect(offenders(repositoryRoot, homePath)).toEqual([]);
    ❯ tests/personal-paths.test.ts:160:74
      159|   it("carry no home directory prefix outside the change contract that …
      160|     expect(offenders(repositoryRoot, homePrefix, ruleDefiningContracts…

`design.md` of this very change carries the absolute path of a skill of a development machine in a parenthetical of
its decision 1 (a home path to the `onboard.md` reference of the `impeccable` skill, since removed by Fable in `63b9a0a`). The rule that file states is the rule
the test enforces, and the contract of this round forbids editing the text of `design.md`, so the two red cases are
recorded here and in the delivery as a broken case of the base and are not touched. The command of the suite of this
round is therefore read as "884 pass, and the same two known cases of `design.md` fail", and task 5.1 repeats it with
that reading written down.

Everything else is green: 78 of the 79 files.

## `npm run typecheck`

    $ npx -y -p node@24 node node_modules/next/dist/bin/next typegen
    ✓ Types generated successfully
    [exit=0]

    $ npx -y -p node@24 node node_modules/typescript/bin/tsc --noEmit
    [exit=0]

## `npm run lint`

    $ npx -y -p node@24 node node_modules/eslint/bin/eslint.js .
    [exit=0]

## `openspec validate --all --strict`

    $ openspec validate --all --strict
    ✓ spec/admin-panel
    ✓ spec/answering
    ✓ spec/app-skeleton
    ✓ spec/design-system
    ✓ change/guided-setup-and-knowledge
    ✓ spec/knowledge-search
    ✓ spec/product-identity
    ✓ spec/project-readme
    ✓ spec/provider-settings
    ✓ spec/public-chat
    ✓ spec/repository-bootstrap
    ✓ spec/supply-chain-security
    ✓ spec/voice-agent
    Totals: 13 passed, 0 failed (13 items)
    [exit=0]

## `git status`

    $ git status --porcelain=v1
     M LOOP_STATE.md

(At the moment of this reading only the loop state of the round was uncommitted. This report and the one of task 0.1
are the commit of the step.)

## The state of the store

Read with the reader of the repository and never with the client that writes (the reader of `scripts/store-state.ts`
opens the file with `node:sqlite` and `readOnly: true`, so the "before" it prints is not a state the code created), and
on the store the repository points at by default, so this reading does not open any file of secrets:

    $ npx -y -p node@24 node scripts/store-state.ts

    store: <worktree>\.data\katalis.sqlite
    exists: true
    bytes: 151552
    tables: 14 (plus the 5 of the full-text index)
      documents rows=4
      passages rows=11
      passages_fts rows=11
      rate_limits rows=2
      model_calls rows=1
      voice_minutes rows=0
      voice_agent rows=0
      conversations rows=0
      login_attempts rows=0
      business rows=0
      provider_settings rows=0 (added by this change)
      provider_tests rows=0 (added by this change)
      document_index rows=4 (added by this change)
    rows of the tables this change added: 4

The store of the working tree holds four documents with their eleven passages and four rows of the index, one model
call and two windows of the question limit; no business, no provider setting, no conversation and no voice agent. The
four documents are the sample corpus the E2E of the previous round ingested into this file. Task 8.1 repeats this
command on the same store and says which counts moved and why.
