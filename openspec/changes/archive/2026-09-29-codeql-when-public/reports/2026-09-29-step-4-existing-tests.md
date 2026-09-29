# Step 4 report - codeql-when-public: review and update of the existing tests

- Date: 2026-09-29
- Change: codeql-when-public
- Agent: deepseek-harness
- Verified commit: `10ba77f` (`ci(codeql-when-public): skip the CodeQL analysis while the repository is private`)
- Environments: Windows 11 with Node v24.11.0 and npm 11.6.1; and a disposable Linux container `node:24`
  (Node v24.21.0) over a fresh clone of the branch inside the container, which is what the CI runs.

The commands of this report run from the repository root. The absolute path that the tools print is elided as
`<repository root>` because a report is a tracked file and carries no home path.

## Task 4.1 - the whole suite, on both platforms

### Which tests changed

```
$ git diff --stat efdda14..HEAD -- tests/
 tests/codeql-workflow.test.ts | 225 ++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 225 insertions(+)

$ git diff --numstat efdda14..HEAD -- tests/home.test.tsx tests/personal-paths.test.ts
(no output)
```

The branch created by Fable carries the contract on top of `efdda14`, and the work commits of this change are
`1c14bd6`, `b43f5a1` and `10ba77f`. Against the base of `main`, exactly one test file changes: the new
`tests/codeql-workflow.test.ts`, with its four assertions. The two files of the base are untouched, byte for byte:

| File | Tests | Change |
|---|---|---|
| `tests/home.test.tsx` | 2 | none |
| `tests/personal-paths.test.ts` | 7 | none |
| `tests/codeql-workflow.test.ts` (new) | 4 | the contract test of `codeql.yml` |

No existing test was invalidated by the change: no test of the base reads `.github/workflows/`, and the only file of
the application that the change touches is `codeql.yml`. The new file is picked up by the suite through the
`include` of `vitest.config.mts` (`tests/**/*.test.ts`), so the pipeline runs it without touching `ci.yml`.

The suite goes from 9 tests on the base to 13.

### Windows, in the working tree of `10ba77f`

```
$ git rev-parse HEAD
10ba77f6a6821779a22597aa6ea2d8f1c1712863
$ git status --porcelain
(no output)
$ npm test
 RUN  v5.0.2 <repository root>
 Test Files  3 passed (3)
      Tests  13 passed (13)
   Start at  20:23:06
   Duration  3.34s
exit code: 0
```

### Linux, in the disposable `node:24` container

```
$ docker run --rm -v "<repository root>:/src:ro" -v "<scratch>:/scripts:ro" node:24 \
    bash /scripts/branch-run.sh feature/codeql-when-public 'npm test'
=== HEAD of the clone ===
10ba77f ci(codeql-when-public): skip the CodeQL analysis while the repository is private
=== node ===
v24.21.0
=== npm ci exit code: 0 ===
=== command: npm test ===
 ✓ tests/codeql-workflow.test.ts (4 tests) 9ms
 ✓ tests/home.test.tsx (2 tests) 186ms
 ✓ tests/personal-paths.test.ts (7 tests) 393ms
 Test Files  3 passed (3)
      Tests  13 passed (13)
   Start at  02:24:01
   Duration  1.82s
=== exit code: 0 ===
```

The container clones the branch from the mounted repository (a fresh Linux checkout) and installs with `npm ci`, so
the run reproduces the environment of the runner: the same three files and the same 13 tests are green there.

## Verdict

PASS. The whole suite is green on Windows and in the Linux container at `10ba77f`; the only test that changed is the
new contract test, and the two files of the base were not modified.
