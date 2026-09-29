# Step 8 · the state of the base after

Contract: `tasks.md`, task 8.1: the same battery as task 1.1, run at the head of the branch with the change in place.
Agent: deepseek-harness. Date: 2026-09-29. HEAD of this run: `db462e1`.

## 8.1 The same five checks

```
$ git status --short
(no line: the working tree is clean)

$ npm test

 RUN  v5.0.2 .

 Test Files  27 passed (27)
      Tests  247 passed (247)
   Start at  10:55:17
   Duration  12.32s (tests 54%, environment 28%, setup 7%, import 7%, transform 3%)

exit=0

$ npm run typecheck
> next typegen && tsc --noEmit
Generating route types...
✓ Types generated successfully
exit=0

$ npm run lint
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

Beside task 1.1: seventeen files and one hundred and ninety-one tests became twenty-seven files and two hundred and
forty-seven tests; the type check, the lint and the validation of the specifications end with the same exit code
zero, and the working tree is clean, which is what "the commits are part of the work" means.

## The tables of the store after

```
$ node .data/table-probe.mjs .data/katalis.sqlite
business: 0
conversations: 0
documents: 4
login_attempts: 0
model_calls: 1
passages: 11
passages_fts: 11
passages_fts_config: 1
passages_fts_content: 11
passages_fts_data: 7
passages_fts_docsize: 11
passages_fts_idx: 5
rate_limits: 1
```

The store of the quick start is the same one of task 1.1 with the two tables of this change added and empty: the
four documents and the eleven passages of the sample corpus are untouched, because every test and every run of this
change points `DATABASE_URL` at a store of its own.

**Correction, added in task 9.1.** The counts of the two counters of the quick start moved after this run, and it
was not this change: `node scripts/render-readme-graphics.mjs` runs the quick start again to draw the demo and
patches the README with what it printed, so it wrote one more rate limit row and one more model call in
`.data/katalis.sqlite`. The table grew two more internal rows of `passages_fts_data` and `passages_fts_idx` with the
same eleven passages, which is the index the same corpus re-ingested. The measurement above is the one of this task
at `2bb7373`; the ones of the file after the render are reported in task 5.2 of the final run.

## Commit of this task

- `2bb7373` ("Repeat the battery of the base with the panel in place") carries this report and the mark of 8.1.
