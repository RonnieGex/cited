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
