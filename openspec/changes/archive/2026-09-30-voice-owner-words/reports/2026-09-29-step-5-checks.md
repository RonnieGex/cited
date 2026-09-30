# Step 5.1: the checks

- Date: 2026-09-29
- Change: `voice-owner-words`
- Branch: `feature/voice-owner-words`
- Agent: deepseek-harness
- Commit verified: `42e9afb` (the last commit before this report)
- Task: 5.1

## `npm test` on Windows

```
$ npm test
 Test Files  69 passed (69)
      Tests  599 passed (599)
   Duration  30.92s (tests 46%, environment 26%, import 11%, setup 11%, transform 6%, worker 1%)
exit=0
```

`node --version` on this machine is `v24.11.0` (step 0).

## `npm test` in the `node:24` Linux container

The tree of `42e9afb` was cloned to a temporary directory (`git clone --branch feature/voice-owner-words`, so the
container has a real repository and a real index: four tests of this repository ask `git ls-files`, and two of them
compare the mode of the agent links) and mounted at `/app`:

```
$ docker run --rm -v <the clone>:/app -w /app node:24 sh -c "node --version && git --version && npm ci --no-audit --no-fund && npm test"
v24.21.0
git version 2.39.5
added 581 packages in 4m
 Test Files  69 passed (69)
      Tests  597 passed | 2 skipped (599)
   Duration  145.54s (environment 46%, setup 22%, import 21%, tests 7%, transform 3%, worker 1%)
exit=0
```

The interpreter of the container is `v24.21.0`, newer than the 24.15 the contract asks for and newer than the
`^24.15.0` that `w3c-xmlserializer@6.0.0` declares (the `EBADENGINE` warning of `npm ci` on Windows). The two skipped
tests are the ones of `tests/design-system.test.ts` (19 tests | 2 skipped) that were already skipped on Linux before
this change; the other 597 are green, the change included.

## The other checks

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

$ git diff --check main...HEAD
exit=0
```

`git diff --check main...HEAD` prints nothing: no trailing whitespace and no whitespace error in the whole change.
`main` is `d71220d` in this worktree, the merge the branch was born from.

## gitleaks, per commit and over the round

`npm run hooks:install` left the pre-commit hook of `.githooks/pre-commit` in place (`git config core.hooksPath` is
`.githooks`), so every commit of this round ran
`gitleaks git --pre-commit --staged --redact --no-banner -c .gitleaks.toml` and answered `no leaks found`. The eight
commits of the branch since the merge:

| Commit | What it carries | gitleaks |
| --- | --- | --- |
| `2f9a75b` | the contract of the change (written by Fable) | covered by the scan of the range below |
| `dc29d08` | `LOOP_STATE.md` in RUNNING | the hook: no leaks found |
| `b7e3dcc` | the report of step 0 and its mark | the hook: no leaks found |
| `cd2e053` | the report of step 1 and its mark | the hook: no leaks found |
| `92542de` | the red test of step 2 and its report | the hook: no leaks found |
| `09911ba` | the two routes, the log, the report of step 3.1 | the hook: no leaks found |
| `9ea3d03` | the screen, its strings, the report of step 3.2 | the hook: no leaks found |
| `42e9afb` | the answer to the guards of the suite and the report of step 4 | the hook: no leaks found |

And the two scans of the round, run again over the range:

```
$ gitleaks version
8.30.1

$ gitleaks git --log-opts="d71220d..HEAD" --redact --no-banner -c .gitleaks.toml
6:45PM INF scanned ~66943 bytes (66.94 KB) in 476ms
6:45PM INF no leaks found
exit=0

$ gitleaks git --redact --no-banner -c .gitleaks.toml
6:45PM INF scanned ~6378061 bytes (6.38 MB) in 5.75s
6:45PM INF no leaks found
exit=0
```

The second one is the whole history of the repository, which is the one `ci.yml` runs
(`gitleaks git --redact --no-banner --exit-code 2 -c .gitleaks.toml`, with the same version 8.30.1) and the one the CI
of this change will run in the pipeline.

## Verdict

Task 5.1 is done: the suite is green on Windows (69 files, 599 tests) and in the `node:24` Linux container
(v24.21.0, 69 files, 597 passed and the 2 that were already skipped on Linux), the types compile, the lint is clean,
the audit finds no high or critical vulnerability, gitleaks finds no leak in any commit of the round nor in the whole
history, OpenSpec validates the 13 items and `git diff --check main...HEAD` finds no whitespace error.
