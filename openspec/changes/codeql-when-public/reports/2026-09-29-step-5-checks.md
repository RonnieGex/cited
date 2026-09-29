# Step 5 report - codeql-when-public: the checks

- Date: 2026-09-29
- Change: codeql-when-public
- Agent: deepseek-harness
- Verified commit: `59c369b` (the branch with the condition, the contract test and the reports of steps 2 and 4)
- Environments: Windows 11 with Node v24.11.0 and npm 11.6.1; and a disposable Linux container `node:24`
  (Node v24.21.0) over a fresh clone of the branch, which is what the CI runs.

The commands of this report run from the repository root. The absolute path that the tools print is elided as
`<repository root>` because a report is a tracked file and carries no home path.

## Task 5.1 - the whole battery

### On Windows

```
$ npm run typecheck
> next typegen && tsc --noEmit
Generating route types...
✓ Types generated successfully
exit code: 0

$ npm run lint
> eslint .
exit code: 0

$ npm run openspec:validate
> openspec validate --all --strict
✓ spec/app-skeleton
✓ change/codeql-when-public
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 4 passed, 0 failed (4 items)
exit code: 0

$ git diff --check
exit code: 0

$ git diff --check efdda14..HEAD
exit code: 0

$ gitleaks git --redact --no-banner --exit-code 2 -c .gitleaks.toml
8:24PM INF 33 commits scanned.
8:24PM INF scanned ~931737 bytes (931.74 KB) in 407ms
8:24PM INF no leaks found
exit code: 0

$ npm run secrets:scan
> gitleaks git --redact --no-banner
8:24PM INF 33 commits scanned.
8:24PM INF no leaks found
exit code: 0
```

The gitleaks command is the exact one of the `secrets` job of `ci.yml` (release 8.30.1 on the PATH of this machine,
the rules of `.gitleaks.toml`), not only the `npm run secrets:scan` wrapper. It scanned the 33 commits the branch had
at that moment: the whole history, without a leak.

### In the disposable Linux container

```
$ docker run --rm -v "<repository root>:/src:ro" -v "<scratch>:/scripts:ro" node:24 \
    bash /scripts/branch-run.sh feature/codeql-when-public 'bash /scripts/container-checks.sh'
=== HEAD of the clone ===
59c369b docs(codeql-when-public): report the green suite on both platforms
=== node ===
v24.21.0
=== npm ci exit code: 0 ===

=== $ npm test ===
 ✓ tests/codeql-workflow.test.ts (4 tests) 9ms
 ✓ tests/personal-paths.test.ts (7 tests) 255ms
 ✓ tests/home.test.tsx (2 tests) 274ms
 Test Files  3 passed (3)
      Tests  13 passed (13)
=== exit code: 0 ===

=== $ npm run typecheck ===
✓ Types generated successfully
=== exit code: 0 ===

=== $ npm run lint ===
=== exit code: 0 ===

=== $ npx --yes @fission-ai/openspec@1.1.1 validate --all --strict ===
✓ spec/app-skeleton
✓ change/codeql-when-public
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
34 commits scanned.
scanned ~935166 bytes (935.17 KB) in 227ms
no leaks found
=== exit code: 0 ===
```

The gitleaks of the container is downloaded from the release 8.30.1 and checked against the same SHA-256 that
`ci.yml` pins, so the scan of the history runs with the binary of the pipeline. It scanned 34 commits because the
clone of this run already carried the report of step 4.

### Extra check: the production build

The contract does not ask for it in this step, and the change touches no application code, but the mandatory steps of
this repository run the build, so it was run on the same tree:

```
$ npm run build
▲ Next.js 16.3.6 (Turbopack)
✓ Compiled successfully in 1017ms
✓ Generating static pages using 4 workers (3/3) in 674ms
Route (app)
┌ ○ /
└ ○ /_not-found
exit code: 0
```

### `actionlint`

It is not installed on this machine (`Get-Command actionlint` finds nothing), and the contract asks for it only if it
is installed. The syntax of the file is covered locally by two independent parsers instead: the reader of the
contract test and `npx --yes js-yaml` (step 3 report), both of which parse `.github/workflows/codeql.yml` with exit
code 0. The schema and the expression evaluation of a workflow are validated by GitHub when the workflow runs; a push
is forbidden in this mission, so that validation is UNKNOWN here and is recorded as such in the delivery.

## Summary

| Check | Windows | Linux container |
|---|---|---|
| `npm test` | 3 files, 13 tests, exit 0 | 3 files, 13 tests, exit 0 |
| `npm run typecheck` | exit 0 | exit 0 |
| `npm run lint` | exit 0 | exit 0 |
| gitleaks over the history | 33 commits, no leaks, exit 0 | 34 commits, no leaks, exit 0 |
| `openspec validate --all --strict` | 4 passed, 0 failed | 4 passed, 0 failed |
| `git diff --check` | exit 0 | exit 0 (working tree and `efdda14..HEAD`) |
| `npm run build` | exit 0 | not run |

## Verdict

PASS. Every check of the contract is green on the two platforms at `59c369b`, with the command and its real output
above; `actionlint` is not installed and the two YAML parsers cover the syntax locally.
