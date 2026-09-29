# Step 5 report - fix-tracked-text-scan: the checks

- Date: 2026-09-29
- Change: fix-tracked-text-scan
- Agent: deepseek-harness
- Verified commit: `9d41faccc72e66c2d28fd8b5207867a777e42d75` (the branch with the fix and the documentation line)
- Environments: Windows 11 with Node v24.11.0 and npm 11.6.1; and a disposable Linux container `node:24`
  (Debian, Node v24.21.0) over a fresh clone of the branch, which is what the CI runs.

## Task 5.1 - the whole battery

### In the disposable Linux container

```
docker run --rm \
  -v "${PWD}:/src:ro" \
  -v "<scratch>:/scripts:ro" \
  node:24 bash /scripts/branch-run.sh feature/fix-tracked-text-scan 'bash /scripts/container-checks.sh'
```

```
=== HEAD of the clone ===
9d41fac docs(fix-tracked-text-scan): note the symlink modes behind the scan
=== node ===
v24.21.0
=== npm ci exit code: 0 ===

=== $ npm test ===
 ✓ tests/home.test.tsx (2 tests) 229ms
 ✓ tests/personal-paths.test.ts (7 tests) 1816ms
 Test Files  2 passed (2)
      Tests  9 passed (9)
=== exit code: 0 ===

=== $ npm run typecheck ===
> next typegen && tsc --noEmit
✓ Types generated successfully
=== exit code: 0 ===

=== $ npm run lint ===
> eslint .
=== exit code: 0 ===

=== $ npx --yes @fission-ai/openspec@1.1.1 validate --all --strict ===
✓ spec/app-skeleton
✓ change/fix-tracked-text-scan
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 4 passed, 0 failed (4 items)
=== exit code: 0 ===

=== $ git diff --check ===
=== exit code: 0 ===

=== install gitleaks 8.30.1 ===
/tmp/gitleaks.tar.gz: OK
install exit code: 0

=== $ gitleaks version ===
8.30.1
=== exit code: 0 ===

=== $ gitleaks git --redact --no-banner --exit-code 2 -c .gitleaks.toml ===
21 commits scanned.
scanned ~857433 bytes (857.43 KB) in 674ms
no leaks found
=== exit code: 0 ===

docker run exit code: 0
```

The gitleaks command line of the container is the one of the pipeline: the release 8.30.1 is downloaded from GitHub
and checked against the same SHA-256 that `ci.yml` pins.

### On Windows, in the working tree of the same commit

```
git rev-parse HEAD                          -> 9d41faccc72e66c2d28fd8b5207867a777e42d75

npm test                                    -> Test Files  2 passed (2)
                                                     Tests  9 passed (9)

npm run typecheck                           -> ✓ Types generated successfully        (exit 0)
npm run lint                                -> eslint .                             (exit 0)
npx --yes @fission-ai/openspec@1.1.1 validate --all --strict
                                            -> Totals: 4 passed, 0 failed (4 items)  (exit 0)
npm run openspec:validate                   -> Totals: 4 passed, 0 failed (4 items)  (exit 0)
gitleaks git --redact --no-banner --exit-code 2 -c .gitleaks.toml
                                            -> 21 commits scanned.
                                               no leaks found                       (exit 0)
git diff --check                            -> (no output)                          (exit 0)
git diff --check 3ff834f..HEAD              -> (no output)                          (exit 0)
```

## The flake that the closing battery found, and its fix

The battery was repeated in the container on the tree that already carries the reports, with the machine busy with
other builds of the suite, and one of the scenarios of the fixture exceeded the default timeout of Vitest:

```
❯ tests/personal-paths.test.ts (7 tests | 1 failed) 9873ms
  ✓ are listed by git 22ms
  ✓ carry no home directory of a development machine 191ms
  ✓ carry no home directory prefix outside the change contract that states the rule 16ms
  ✓ are read by the target of the link when git tracks them as a symbolic link 22ms
  ✓ report a tracked symbolic link whose target carries a home directory 592ms
  × exempt the rule-defining contract at its active and archived path and report any other file with the prefix 6932ms
  ✓ skip a binary tracked file 99ms

FAIL ... Error: Test timed out in 5000ms.
Test Files  1 failed | 1 passed (2)
     Tests  1 failed | 8 passed (9)
=== exit code: 1 ===
```

It is a defect of the test, not of the fix: the scenario builds a throwaway Git repository and calls git about ten
times, so a loaded machine can push it past the five seconds that Vitest allows by default. The same scenario passed
in every other run, between 85 ms and 1.6 s. The three scenarios that build a fixture now declare
`{ timeout: fixtureTimeout }`, with `fixtureTimeout = 30_000`, and the suite is green again on both platforms:

```
npm test
  -> Test Files  2 passed (2)
          Tests  9 passed (9)
```

The rest of that battery (typecheck, lint, the strict OpenSpec validation, gitleaks and `git diff --check`) was green
in the same run; only the unit suite failed, on that timeout, and it was green again with the timeout declared. The
closing run, on the commit that carries this report, is recorded in the delivery.

## Summary

| Check | Linux container | Windows |
|---|---|---|
| `npm test` | green, 9 passed | green, 9 passed |
| `npm run typecheck` | exit 0 | exit 0 |
| `npm run lint` | exit 0 | exit 0 |
| gitleaks (whole history) | green, 21 commits, no leaks | green, 21 commits, no leaks |
| `openspec validate --all --strict` | 4 passed, 0 failed | 4 passed, 0 failed |
| `git diff --check` | exit 0 | exit 0 (working tree and `3ff834f..HEAD`) |

## Verdict

PASS. Every check of the contract is green on the two platforms, on `9d41fac`, with the command and its output
above.
