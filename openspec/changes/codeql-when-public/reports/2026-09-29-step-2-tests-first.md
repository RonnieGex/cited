# Step 2 report - codeql-when-public: tests first

- Date: 2026-09-29
- Change: codeql-when-public
- Agent: deepseek-harness
- Commit of the red: `b43f5a1` (`test(codeql-when-public): add the contract test of the codeql workflow`), on top of
  `1c14bd6`, over the base `efdda14` (`main`)
- Environments: Windows 11 with Node v24.11.0 and npm 11.6.1; and a disposable Linux container `node:24`
  (`docker run --rm`, the repository mounted read-only at `/src`, a scratch directory of the host at `/scripts`),
  which clones the branch inside the container and installs the locked tree with `npm ci`.

The commands of this report run from the repository root. The absolute path that the tools print is elided as
`<repository root>` because a report is a tracked file and carries no home path.

## Task 2.1 - the contract test of `codeql.yml`, written first and run red

The repository had no workflow contract test: `tests/` carried `home.test.tsx` and `personal-paths.test.ts` only, and
no test read `.github/workflows/`. The design allows a new one in that case, so `tests/codeql-workflow.test.ts` was
added. It does not exist in the base.

### What the test does

It reads `.github/workflows/codeql.yml` and parses it into a structure with a strict reader of the YAML subset that
the workflows of this repository use (block mappings, block sequences, flow sequences and quoted scalars). The reader
never guesses: an unacceptable line, an unexpected indentation or an unread line at the end throws, so a file it
cannot understand fails the suite instead of passing it. No YAML library is declared in `package.json` and the
proposal does not add one, so the test carries its own reader; the decision is recorded in the delivery of this
change.

Four assertions, one per scenario of the spec delta and per item the design requires to stay unchanged:

| Test | Scenario of the spec delta | What it requires |
|---|---|---|
| `skips the analysis while the repository is private` | A private repository skips the analysis | `jobs.analyze.if` is exactly `${{ !github.event.repository.private }}` |
| `keeps the languages, the queries and the permissions` | The language and the queries are declared | `permissions` of the workflow, the `security-events: write` of the job, and `with.languages` = `javascript-typescript` with `with.queries` = `security-extended` on the init step |
| `keeps the triggers of the analysis` | The analysis is scheduled | `on.push.branches` = `[main]`, `on.pull_request.branches` = `[main]` and `on.schedule` = `cron: "17 6 * * 1"` |
| `keeps the analysis step that uploads the results` | A public repository runs the analysis | the analysis job still carries the step that uses `github/codeql-action/analyze` |

The action versions are deliberately not pinned by the test: Dependabot bumps `actions/checkout` and
`github/codeql-action` weekly, and neither the design nor the spec freezes those versions. What the test freezes is
the condition and the four items the design names: languages, queries, triggers and permissions.

### Red on Windows, on `b43f5a1`

```
$ npx vitest run tests/codeql-workflow.test.ts
 ❯ tests/codeql-workflow.test.ts (4 tests | 1 failed) 11ms
   ❯ the CodeQL workflow (4)
     × skips the analysis while the repository is private 8ms
 Test Files  1 failed (1)
      Tests  1 failed | 3 passed (4)
exit code: 1

 FAIL  tests/codeql-workflow.test.ts > the CodeQL workflow > skips the analysis while the repository is private
AssertionError: expected undefined to be '${{ !github.event.repository.private …'
- Expected:
"${{ !github.event.repository.private }}"
+ Received:
undefined
 ❯ tests/codeql-workflow.test.ts:194:24
```

```
$ npm test
 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 12 passed (13)
exit code: 1
```

The only red is the missing condition: the three assertions of the unchanged parts pass, which proves the reader
understands the file as it is and that the rest of the workflow does not have to move.

### Red on Linux, in the `node:24` container, on the same commit

```
$ docker run --rm -v "<repository root>:/src:ro" -v "<scratch>:/scripts:ro" node:24 \
    bash /scripts/branch-run.sh feature/codeql-when-public 'npm test'
=== HEAD of the clone ===
b43f5a1 test(codeql-when-public): add the contract test of the codeql workflow
=== node ===
v24.21.0
=== npm ci exit code: 0 ===
=== command: npm test ===
 ❯ tests/codeql-workflow.test.ts (4 tests | 1 failed) 15ms
   ❯ the CodeQL workflow (4)
     × skips the analysis while the repository is private 10ms
     ✓ keeps the languages, the queries and the permissions 1ms
     ✓ keeps the triggers of the analysis 1ms
     ✓ keeps the analysis step that uploads the results 0ms
 ✓ tests/personal-paths.test.ts (7 tests) 205ms
 ✓ tests/home.test.tsx (2 tests) 166ms
 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 12 passed (13)
=== exit code: 1 ===
```

The same single assertion fails on both platforms, with the same `undefined` on the left. The two files that existed
before are green in the container.

### Static checks of the red commit

```
$ npx tsc --noEmit
exit 0
$ npm run lint
exit 0
```

The red is semantic, not a type or lint error: the test compiles and passes the linter before the fix.

## Verdict

PASS. The contract test of `codeql.yml` is written first, it is red on Windows and on Linux with the missing
condition as its only failure, and the three assertions that describe what must not change are green in both.
