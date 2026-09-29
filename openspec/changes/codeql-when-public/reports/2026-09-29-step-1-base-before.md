# Step 1 report - codeql-when-public: the state of the base before

- Date: 2026-09-29
- Change: codeql-when-public
- Agent: deepseek-harness
- Verified commit: `789c2c8` (the contract of Fable on `efdda14`, the current head of
  `feature/codeql-when-public`), which differs from `main` only by the contract files
- Environment: Windows 11, Node v24.11.0, npm 11.6.1, `openspec` 1.1.1, `gh` 2.x authenticated against GitHub
- Preparation: the checkout had an empty `node_modules` (0 entries), so the locked tree was installed with
  `npm ci --no-audit --no-fund` before the measurement: `added 550 packages in 23s`, exit code 0, with the
  `EBADENGINE` warnings of Node v24.11.0 against the declared floor `>=24.15.0` that the bootstrap change already
  recorded.

The commands of this report run from the repository root. The absolute path that `npm test` prints in its banner is
elided as `<repository root>` because a report is a tracked file and carries no home path.

## Task 1.1 - the suite, the strict validation and the failing CodeQL run

### `npm test` on the base

```
$ npm test

> katalis-responde-community@0.1.0 test
> vitest run

 RUN  v5.0.2 <repository root>

 Test Files  2 passed (2)
      Tests  9 passed (9)
   Start at  20:19:23
   Duration  4.16s (environment 61%, tests 20%, setup 14%, transform 3%, import 1%, worker 1%)
exit code: 0
```

The two files are `tests/home.test.tsx` (2 tests) and `tests/personal-paths.test.ts` (7 tests). The suite is green on
the base, so any red of this change is caused by this change.

### `openspec validate --all --strict` on the base

```
$ openspec --version
1.1.1
$ npm run openspec:validate

> katalis-responde-community@0.1.0 openspec:validate
> openspec validate --all --strict

✓ spec/app-skeleton
✓ change/codeql-when-public
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 4 passed, 0 failed (4 items)
exit code: 0
```

The change of this contract validates strictly before any line of it is implemented.

### The failing CodeQL run `36511364255`

```
$ gh run view 36511364255 --json name,displayTitle,event,conclusion,createdAt,headSha,workflowName
{"conclusion":"failure","createdAt":"2026-09-29T02:10:40Z","displayTitle":"Merge fix-tracked-text-scan","event":"push","headSha":"efdda144662f2d0e01805540c3350f8b04b1451e","name":"CodeQL","workflowName":"CodeQL"}
```

It is the first CodeQL run of `main`, triggered by the push of the merge `efdda14`. The run analyzed the code and
failed in the step `Analyze`; `gh run view 36511364255 --log-failed` returns 972 lines, all of them from that step,
and they end like this:

```
2026-09-29T02:12:58.1506330Z Adding fingerprints to SARIF file. See https://docs.github.com/en/code-security/reference/code-scanning/sarif-support-for-code-scanning#data-for-preventing-duplicated-alerts for more information.
2026-09-29T02:12:58.1507754Z ##[group]Uploading code scanning results
2026-09-29T02:12:58.1639466Z Uploading results
2026-09-29T02:13:13.0808198Z ##[warning]Code scanning is not enabled for this repository. Please enable code scanning in the repository settings. - https://docs.github.com/rest
2026-09-29T02:13:13.0813476Z ##[error]Please verify that the necessary features are enabled: Code scanning is not enabled for this repository. Please enable code scanning in the repository settings. - https://docs.github.com/rest
2026-09-29T02:13:27.9175613Z ##[warning]This run of the CodeQL Action does not have permission to access the CodeQL Action API endpoints. This could be because the Action is running on a pull request from a fork. If not, please ensure the workflow has at least the 'security-events: read' permission. Details: Code scanning is not enabled for this repository. Please enable code scanning in the repository settings. - https://docs.github.com/rest
```

The first warning of the run (02:12:31.7894007Z) carries the same detail. The analysis itself succeeded: the log
reaches "Adding fingerprints to SARIF file" after the CodeQL build, and the failure is the upload, with the message
"Code scanning is not enabled for this repository". `gh run view 36511364255` reports the annotation of the step:

```
X Please verify that the necessary features are enabled: Code scanning is not enabled for this repository. Please enable code scanning in the repository settings. - https://docs.github.com/rest
```

That is exactly the defect of the proposal: the repository is private and GitHub accepts code scanning uploads from a
private repository only with a paid plan. The `conclusion` of the run is `failure`, so the workflow of `main` is red
for a reason unrelated to the code.

## Task 1.2 - the state of the database: none exists in this repository

```
$ git ls-files | Select-String -Pattern '\.(db|sqlite|sqlite3|dump|sql|mdb|accdb)$|(^|/)(prisma|migrations|data|db|database)(/|$)'
(no matches)
$ Test-Path migrations
False
$ node -e "console.log(JSON.stringify(require('./package.json').dependencies))"
{"next":"16.3.6","react":"19.2.8","react-dom":"19.2.8"}
```

- No tracked path has a database extension, and no tracked directory is named `prisma`, `migrations`, `data`, `db` or
  `database`.
- The one declared runtime dependency of the application is `next` with `react` and `react-dom`; the fifteen declared
  development dependencies are testing, linting and Tailwind tooling. There is no datastore client, no ORM and no
  driver among the eighteen declared packages.
- The tracked tree at the root is configuration plus `app/` (three files: `layout.tsx`, `page.tsx`, `globals.css`),
  `docs/`, `openspec/`, `tests/`, `e2e/` and `scripts/`; there is no data file and no local database.
- The stack of the project (`openspec/config.yaml`) plans libSQL as the only database, and the change that builds it
  (`core-libsql-hybrid-search`) is not implemented yet. The bootstrap design recorded the same: the application of
  this change serves one page and has no persistence.

So the state before has no database, nothing to migrate, and this change does not touch one; tasks 1.2 and 8.1 record
the same measurement before and after.

## Verdict

PASS. On the base the unit suite is green (9 tests) and the strict validation passes (4 items); the CodeQL run of
`main` is red with the upload error quoted above, which is the defect the change removes; and the repository carries
no database.
