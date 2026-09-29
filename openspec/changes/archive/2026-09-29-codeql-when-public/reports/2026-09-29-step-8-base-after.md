# Step 8 report - codeql-when-public: the state of the base after

- Date: 2026-09-29
- Change: codeql-when-public
- Agent: deepseek-harness
- Verified commit: `10aafd4` (the branch after the implementation, the contract test and the reports of steps 2 to 7)
- Environment: Windows 11, Node v24.11.0, npm 11.6.1, `openspec` 1.1.1

The commands of this report run from the repository root. The absolute path that `npm test` prints in its banner is
elided as `<repository root>` because a report is a tracked file and carries no home path.

## Task 8.1 - the local part of 1.1 and 1.2, repeated after the change

### The local part of 1.1

```
$ git rev-parse HEAD
10aafd400783a91b70992109e06bd7da624445be
$ git status --porcelain
(no output)

$ npm test
 RUN  v5.0.2 <repository root>
 Test Files  3 passed (3)
      Tests  13 passed (13)
   Start at  20:27:12
   Duration  6.36s
exit code: 0

$ npm run openspec:validate
> openspec validate --all --strict
✓ spec/app-skeleton
✓ change/codeql-when-public
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 4 passed, 0 failed (4 items)
exit code: 0
```

The GitHub part of task 1.1 (the failing CodeQL run `36511364255`) has no local counterpart after the change: the
run it describes belongs to the private repository and the fix is observed on GitHub when Fable pushes `main` in task
10.1. A push is forbidden in this mission, so that observation is UNKNOWN here and is recorded as such in the
delivery.

### The state of the database, repeated

```
$ git ls-files | Select-String -Pattern '\.(db|sqlite|sqlite3|dump|sql|mdb|accdb)$|(^|/)(prisma|migrations|data|db|database)(/|$)'
(no matches)
$ Test-Path migrations
False
$ node -e "console.log(JSON.stringify(require('./package.json').dependencies))"
{"next":"16.3.6","react":"19.2.8","react-dom":"19.2.8"}
```

The state after is the state before: no database, no migration, no datastore dependency and no package changed. This
change touches one line of a workflow and adds one test file; it creates nothing to persist.

## Before and after

| Measurement | Before (`789c2c8`) | After (`10aafd4`) |
|---|---|---|
| `npm test` | 2 files, 9 tests, green | 3 files, 13 tests, green |
| `openspec validate --all --strict` | 4 passed, 0 failed | 4 passed, 0 failed |
| Database | none | none |
| Declared dependencies | 3 runtime, 15 development | 3 runtime, 15 development |

## Verdict

PASS. The local part of task 1.1 is green after the change with four more tests than the base, the strict validation
still passes, and the repository still carries no database.
