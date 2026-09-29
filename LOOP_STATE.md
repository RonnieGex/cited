# LOOP_STATE · Cited

STATUS: DONE
CHANGE: cited-identity-and-readme (OpenSpec)
ROUND: section 14, third review round (tasks 14.1 to 14.3)
BRANCH: feature/cited-identity-and-readme
BASE: 5dec3af (main)
HEAD AT THE START OF THE ROUND: 387e2df
HEAD AT THE END OF THE ROUND: 623a06a
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute section 14 of `openspec/changes/cited-identity-and-readme/tasks.md`, the contract Fable wrote after
`katalis-dev/tasks/revision-community-03c.md`: one Major (the test and the guard exclude the whole `demo` subtree of the
records, so a present-tense promise in a demo field passes). Fable narrowed the exemption in the amended scenario: only
the output lines captured verbatim from the real run of the quick start, the command lines and the lines they printed,
are exempt; every other demo field is checked. Tests first and red, small commits, section 10 stays reserved for Fable.

## What the round delivered

- **14.1** (`9853148`): the new scenario `reads every field of the demo but the lines the run printed` and the amended
  assertion `keeps the state of a roadmap row and the captured run of the demo as the evidence`, both red. The whole
  file printed `2 failed | 40 passed (42)` and named the fields. The guard, with the record mutated in memory, answered
  `demo.caption: accepted` and `demo.drawn.ingest[0]: accepted` with exit 0: that was the defect.
- **14.2** (`c7e7491`): the prefix exclusion of `demo` is gone from `honesty.mjs` and from `tests/readme.test.ts`. The
  exemption is exact: the two command lines, the two captured outputs, and each drawn line only while it is a line of
  its own capture. Every other text field of the record is read, `demo` included. `isCapturedOutput` is the single
  predicate, `honesty.d.mts` declares it and the test imports it for `textRoutes` and `textFields`. The guard now
  refuses both mutants and names the route, exit 1; the file is `42 passed (42)`, exit 0.
- **14.3**: `npm test` 11 files and **114 tests** (113 before), `npm run typecheck` exit 0, `npm run lint` exit 0,
  gitleaks 121 commits with no leaks, `openspec validate --all --strict` 5 passed and 0 failed,
  `git diff --check main...HEAD` exit 0. Two file mutants (`demo.caption` and `demo.drawn.ingest[0]`) gave red and the
  guard gave exit 1; the record was restored with `git checkout --` and the tree stayed clean. The round is appended to
  `katalis-dev/tasks/entrega-community-03.md` under its own heading with `## Issues`, and the report is
  `reports/2026-09-29-step-14-review-round.md`.

## The boundary that stays exempt

The capture fields are the evidence, so a promise inserted inside `demo.ingest.output` still passes the guard: it is
accepted, exit 0. What refuses it is the test `draws the demo from the real run of the quick start`, red with exit 1,
because the line is not in the quick start block of `README.md`. The exemption is closed over exact routes and over the
published run for the output, and over exact routes and the content of its own capture for every drawn line. It is
recorded as a RISK in the report and in the delivery: the guard alone cannot tell a captured line from a fabricated
one.

## State of the tree

The tree is clean on `feature/cited-identity-and-readme`. `main` still points at `5dec3af`, no remote was contacted,
nothing was pushed and nothing was archived. Section 14 carries its three boxes marked with the report of the round;
section 10 stays untouched because it is Fable's.

## Hard rules respected

- No `.env` file was opened.
- No push, no remote, no commit in `main`, no archive.
- No call to a real provider and no call to Turso: the deterministic `fake` provider ran every command.
- No secret, no customer data and no text of the Construye book in any commit.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.

## Pending and out of scope

- **NOT DONE, reserved for Fable**: section 10 of the contract (rename the GitHub repository to `cited`, update the
  remote and prove that the old URL redirects), the adversarial review of this round, the merge and the archive.
- **NOT DONE**: the GitHub pipeline itself, because a push is forbidden here.
- **UNKNOWN**: the verdict of the next review on the exact exemption, the state of the badge and of the redirect after
  10.1, and how GitHub renders the documentation that changed.
