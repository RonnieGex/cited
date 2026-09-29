# Step 3 report - codeql-when-public: the implementation

- Date: 2026-09-29
- Change: codeql-when-public
- Agent: deepseek-harness
- Base of the implementation: `b43f5a1` (the red test)
- Environment: Windows 11, Node v24.11.0, npm 11.6.1

The commands of this report run from the repository root. The absolute path that the tools print is elided as
`<repository root>` because a report is a tracked file and carries no home path.

## Task 3.1 - the one-line condition, and the test green

### The line

```
$ git diff -- .github/workflows/codeql.yml
diff --git a/.github/workflows/codeql.yml b/.github/workflows/codeql.yml
index 243a27c..9f00876 100644
--- a/.github/workflows/codeql.yml
+++ b/.github/workflows/codeql.yml
@@ -18,6 +18,7 @@ concurrency:
 jobs:
   analyze:
     name: Analyze JavaScript and TypeScript
+    if: ${{ !github.event.repository.private }}
     runs-on: ubuntu-latest
     permissions:
       actions: read
```

One added line, exactly the condition of decision 1 of the design, on the analysis job, so the job is reported as
skipped instead of failed and the workflow does not end red while the repository is private. Nothing else of the
file moved: no `permissions`, no `on`, no step, no action version.

### The file is valid YAML, and the parsers agree

The reader of the contract test is not a standard YAML library, so the file was cross-checked with `js-yaml`
(`npx --yes js-yaml`, the same tool the bootstrap verification used), which parses the whole file with exit code 0:

```
$ npx --yes js-yaml .github/workflows/codeql.yml
exit code: 0
top level: name,on,permissions,concurrency,jobs
on: {"push":{"branches":["main"]},"pull_request":{"branches":["main"]},"schedule":[{"cron":"17 6 * * 1"}]}
analyze.if: "${{ !github.event.repository.private }}"
analyze.permissions: {"actions":"read","contents":"read","security-events":"write"}
init.with: {"languages":"javascript-typescript","queries":"security-extended"}
analyze.uses: actions/checkout@v7 github/codeql-action/init@v4 github/codeql-action/autobuild@v4 github/codeql-action/analyze@v4
```

An independent, standard parser reads the condition as the string
`${{ !github.event.repository.private }}` (it is not coerced to a boolean or cut short at the braces), and it reads
the triggers, the permissions and the languages and queries exactly as the contract test does. The condition will
therefore reach the job as the workflow expression intended.

### The test green

```
$ npx vitest run tests/codeql-workflow.test.ts

 RUN  v5.0.2 <repository root>

 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  20:22:30
   Duration  2.43s
exit code: 0
```

```
$ npm test
 Test Files  3 passed (3)
      Tests  13 passed (13)
   Start at  20:22:33
   Duration  2.71s
exit code: 0
```

The suite went from 9 tests on the base to 13: the four scenarios of the contract test. The single red of the step 2
report is the only thing the line removes.

## Verdict

PASS. The implementation is one `if:` on the analysis job, the workflow still parses with a standard YAML parser,
and the contract test and the whole suite are green.
