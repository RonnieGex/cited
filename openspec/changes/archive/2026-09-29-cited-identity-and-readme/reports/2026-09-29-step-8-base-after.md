# Step 8 - The state of the base after

- Date: 2026-09-29
- Change: `cited-identity-and-readme`
- Branch: `feature/cited-identity-and-readme`
- Agent: `deepseek-harness`
- Commit verified against: `8aa0df2`, tree clean
- Report of task 8.1: repeat 1.1 and 1.2.

## 8.1 The battery after the change

Windows 11, Node `v24.11.0`, npm `11.6.1`, tree clean at `8aa0df2`.

| Command | Before (1.1) | After (8.1) |
|---|---|---|
| `npm test` | 10 files, 72 tests | 11 files, 101 tests |
| `npm run typecheck` | exit 0 | exit 0 |
| `npm run lint` | exit 0 | exit 0 |
| `npm run build` | exit 0 | exit 0 |
| `openspec validate --all --strict` | 5 passed, 0 failed | 5 passed, 0 failed |
| `git status --short` | empty | empty |

```
> npm test

> cited@0.1.0 test
> vitest run

 Test Files  11 passed (11)
      Tests  101 passed (101)
   Duration  8.9s

test exit: 0

> npm run typecheck

> cited@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully

typecheck exit: 0

> npm run lint

> cited@0.1.0 lint
> eslint .

lint exit: 0

> npm run build

> cited@0.1.0 build
> next build

▲ Next.js 16.3.6 (Turbopack)
✓ Compiled successfully in 485ms
  Generating static pages using 4 workers (3/3) in 556ms
Route (app)
┌ ○ /
└ ○ /_not-found

build exit: 0

> openspec validate --all --strict
- Validating...
✓ spec/app-skeleton
✓ change/cited-identity-and-readme
✓ spec/knowledge-search
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 5 passed, 0 failed (5 items)

openspec exit: 0

> git status --short
(no output)
```

The suite grew from 72 to 101 tests: the 29 cases of `tests/readme.test.ts` are the new contract, and the 72 of the
base are unchanged and green. The package name in the header of every script changed from
`katalis-responde-community@0.1.0` to `cited@0.1.0`, which is the point of the change.

## 8.2 The state of the store

**This change still adds no persistence.** The diff of the branch over `main` carries no SQL, no table, no column and
no call to the store:

```
> git diff --name-only main...HEAD | Measure-Object -Line
79 files

> git diff --name-only main...HEAD | Select-String -Pattern '\.(sql|sqlite|sqlite3|prisma|db)$'
(no output)

> git ls-files | Select-String -Pattern '\.(sqlite|sqlite3|db|db3)$'
(no output)
```

The 79 files are the identity, the two READMEs, the two render scripts with their templates, the twenty-one files of
`docs/images/`, the two tests of the name, the contract of Fable and its reports. **None of them is SQL, a migration
or a schema.**

The only file of the branch that writes to the machine is the render script, and it writes PNGs and two JSON records
under `docs/images/`.

**The quick start leaves no store file tracked by git.** The commands of the quick start ran again on the closing
commit, on the machine and in the `node:24` container of step 6:

```
> npm run ingest with the deterministic provider
documents 4, passages 11, skipped 0, store .data/katalis.sqlite, 28 ms, rss 113 MB

> git status --short -uall
(no output: the store is ignored, so nothing untracked appears)

> git status --short --ignored=matching | Select-String -Pattern '\.data'
!! .data/

> git ls-files | Select-String -Pattern '\.(sqlite|sqlite3|db|db3)$'
(no output)

> Remove-Item -Recurse -Force .data
> Test-Path .data
False
```

The store of the run was deleted after the verification, so the tree of the branch carries none. The tests of the
suite create their databases under the temporary folder of the operating system and delete them in `afterAll`, which
the previous change already proved.

## The difference between the two states

| | Before | After |
|---|---|---|
| The product | `katalis-responde-community` | `cited` |
| The README | a bootstrap note with no identity and no picture | the announcement of Cited with nine graphics, a status table, a quick start that runs and a Spanish twin |
| The tests | 10 files, 72 tests | 11 files, 101 tests |
| `docs/images/` | does not exist | 21 files, 0.445 MB |
| The scripts | `ingest`, `search`, `install-hooks` | plus the two render scripts |
| The store | no file tracked by git | no file tracked by git |

## Verdict

PASS. Every check of task 1.1 is green after the change with three more tests and a green build, the change adds no
persistence, and the quick start still leaves no store file tracked by git.
