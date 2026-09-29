# Step 1 · the state of the base before

Contract: `tasks.md`, task 1.1. Agent: deepseek-harness. Date: 2026-09-29.
Every command runs against `8c054c1` in the `community` worktree, before any file of the implementation exists.

## 1.1 The suite, the types, the lint, the specs and the store

### The four checks

```
$ git status --short
 M LOOP_STATE.md

$ npm test

> cited@0.1.0 test
> vitest run

 RUN  v5.0.2 .

 Test Files  17 passed (17)
      Tests  191 passed (191)
   Start at  09:56:30
   Duration  11.59s (tests 50%, environment 32%, setup 8%, import 7%, transform 3%)

exit=0

$ npm run typecheck

> cited@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully

exit=0

$ npm run lint

> cited@0.1.0 lint
> eslint .

exit=0

$ openspec validate --all --strict
✓ change/admin-panel-and-onboarding
✓ spec/answering
✓ spec/app-skeleton
✓ spec/design-system
✓ spec/knowledge-search
✓ spec/product-identity
✓ spec/project-readme
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 9 passed, 0 failed (9 items)

exit=0
```

The only modified file in the tree is `LOOP_STATE.md`, written by the start of this round with `STATUS: RUNNING`; no
tracked file of the implementation exists yet. `openspec` is the command line already installed on the machine (the
`openspec` of the global npm prefix, which is on `PATH`); the validation includes the change folder of this contract
and the eight specifications of the repository.

### The tables of the store before

```
$ node .data/table-probe.mjs .data/katalis.sqlite
conversations: 0
documents: 4
model_calls: 1
passages: 11
passages_fts: 11
passages_fts_config: 1
passages_fts_content: 11
passages_fts_data: 3
passages_fts_docsize: 11
passages_fts_idx: 1
rate_limits: 2
```

The store is the local file of the quick start (`DATABASE_URL` unset, `.data/katalis.sqlite`, git ignored) with the
sample corpus of four documents and eleven passages. The probe is a throwaway script under `.data/`, which git
ignores; it lists every table of the design and the rows of each one. The tables of this change (`business` and
`login_attempts`) do not exist yet, which is the point of the "before": task 5.2 repeats this command and shows them.

## Commit of this task

Every command above ran against `8c054c1`. The mark of 1.1 and this report landed in `0d10d2c` ("Start the panel
change with the branch, the base checks and the reports of steps 0 and 1").
