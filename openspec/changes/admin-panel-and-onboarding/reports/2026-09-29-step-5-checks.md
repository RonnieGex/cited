# Step 5 · the checks and the state of the store

Contract: `tasks.md`, tasks 5.1 and 5.2. The two tasks share this report, as the contract asks.
Agent: deepseek-harness. Date: 2026-09-29. The battery runs against `ab4a742` in the `community` worktree, quoted
below as `.`.

## 5.1 The battery

### The suite on Windows

```
$ npm test

 RUN  v5.0.2 .

 Test Files  27 passed (27)
      Tests  246 passed (246)
   Start at  10:12:09
   Duration  10.93s (tests 55%, environment 27%, setup 8%, import 7%, transform 3%)

exit=0
```

### The suite in a `node:24` Linux container

A clone of the branch (`git clone --local --no-hardlinks . <temp>`, working tree at `ab4a742`) runs the suite in the
official image, with a clean `npm ci` of its own, so the container never shares `node_modules` with the machine:

```
$ docker run --rm -v <temp>:/work -w /work node:24 bash -lc "node --version; npm ci; npm test"

v24.21.0

 Test Files  27 passed (27)
      Tests  244 passed (244) | 2 skipped (246)
   Duration  49.11s (environment 51%, setup 21%, import 17%, tests 8%, transform 2%, worker 1%)

exit=0
```

The two skipped tests are the two the suite skips on every machine where the source of the mark is not present; they
are the same two the base skips.

**One finding of this run, and what was done about it.** The first Linux run failed one test of the base,
`tests/readme.test.ts > README, the banner > records the brand tokens and the font`, with `Test timed out in
5000ms`, and a second run failed that one and `tests/design-system.test.ts > is reproduced byte for byte by the
committed script` in the same way. The `main` branch ran green in the same container, with 17 files instead of 27, so
the extra load of the ten new files was what pushed two slow tests past the five second default of Vitest on a bind
mount of a Windows folder. Both tests pass in isolation on the branch and on `main`, and both pass on Windows.

The fix is the margin, not an assertion: `vitest.config.mts` now carries `testTimeout: 20_000` next to the
`hookTimeout: 60_000` that the suite already had for the same reason (a slow machine, not a wrong test). No test of
the base was touched, and this is recorded here because the check that failed and the check that passes are not the
same command.

```
$ git show --stat ab4a742
 vitest.config.mts | 1 +
```

### The rest of the battery

```
$ npm run typecheck
> next typegen && tsc --noEmit
Generating route types...
✓ Types generated successfully
exit=0

$ npm run lint
> eslint .
exit=0

$ npm audit --audit-level=high
found 0 vulnerabilities
exit=0

$ npm run secrets:scan
> gitleaks git --redact --no-banner
10:12AM INF 221 commits scanned.
10:12AM INF scanned ~2472169 bytes (2.47 MB) in 1.53s
10:12AM INF no leaks found
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

$ git diff --check main...HEAD
exit=0
```

The secret scan covers the 221 commits of the history in this worktree, including the 12 of this change, and finds
nothing; `git diff --check` finds no whitespace error between `main` and the head of the branch.

## 5.2 The tables of the store, after the tests and after the end-to-end

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
passages_fts_data: 3
passages_fts_docsize: 11
passages_fts_idx: 1
rate_limits: 2
```

The store of the quick start (the default `DATABASE_URL`, `.data/katalis.sqlite`) keeps the four documents and the
eleven passages it had in task 1.1, plus the two tables this change adds (`business` and `login_attempts`), both
empty: no test of this change writes into that file, because every one of them points `DATABASE_URL` at a temporary
file of its own that the test removes when it ends.

The store of the end-to-end run is measured after the run itself, in task 7.1, and its row counts close this
section.

## Commits of this task

- `ab4a742` the margin of the suite in `vitest.config.mts`.
- the commit that carries this report and the marks of 5.1 and 5.2.
