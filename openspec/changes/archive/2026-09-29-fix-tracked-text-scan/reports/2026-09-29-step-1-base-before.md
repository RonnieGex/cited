# Step 1 report - fix-tracked-text-scan: the state of the base before

- Date: 2026-09-29
- Change: fix-tracked-text-scan
- Base: `3ff834f` (`main`), the tip of the branch before any fix
- Agent: deepseek-harness

## Task 1.1 - `npm test` and the failing run of `main`

### The local run on Windows

`npm test` in this checkout, at the base `3ff834f` (measured in a detached worktree of that exact commit, with the
dependency tree of the repository linked in so the command is the real one):

```
> vitest run

 RUN  v5.0.2

 ❯ tests/personal-paths.test.ts (3 tests | 1 failed) 40ms
   ❯ tracked files (3)
     × carry no home directory prefix outside the change contract that states the rule 21ms

 FAIL  tests/personal-paths.test.ts > tracked files > carry no home directory prefix outside the change contract that
 states the rule
 AssertionError: expected [ Array(1) ] to deeply equal []

- Expected
+ Received

- []
+ [
+   "openspec/changes/archive/2026-09-29-bootstrap/tasks.md",
+ ]

 ❯ tests/personal-paths.test.ts:54:23

 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 4 passed (5)
```

The worktree was removed after the measurement and the main checkout is untouched.

**The base is not green on Windows.** The task text of 1.1 expects "green on Windows", and that is not what the tree
does: the second defect of the proposal is already visible here. On Windows the three `agents` entries are plain text
files, so the `EISDIR` of CI does not hide the second offender, and the suite fails on
`openspec/changes/archive/2026-09-29-bootstrap/tasks.md`. That file is tracked at `3ff834f`
(`100644 4aa9be099cc9d5770af62ba8084cde2cb8803caf openspec/changes/archive/2026-09-29-bootstrap/tasks.md`) and its
line 48 quotes the home prefix of the rule itself, the drive letter followed by a backslash, the segment `Users` and a
backslash, so the exemption list of the test, which names only `openspec/changes/bootstrap/tasks.md`, no longer
matches it. See the issue BROKEN 1 of the delivery.

The same run on the working tree of `ecd9bb0` prints the identical single offender: the change folder added by Fable
(`proposal.md`, `tasks.md`, `specs/`, `.openspec.yaml`) carries no home path.

### The failing run of `main` on GitHub

```
gh run view 36506681705
  -> X main CI · 36506681705
     Triggered via push
     ✓ Types in 27s        ✓ Secret scan in 7s   ✓ Build in 35s
     ✓ OpenSpec validation ✓ End to end in 1m14s
     X Unit tests in 25s   ✓ Lint in 31s         ✓ Dependency audit in 25s
```

```
gh run view 36506681705 --log-failed
  -> Unit tests  ❯ tests/personal-paths.test.ts (3 tests | 2 failed) 8ms
     Unit tests     ✓ are listed by git 2ms
     Unit tests     × carry no home directory of a development machine 4ms
     Unit tests     × carry no home directory prefix outside the change contract that states the rule 1ms

     Unit tests  FAIL  tests/personal-paths.test.ts > tracked files > carry no home directory of a development machine
     Unit tests  Error: EISDIR: illegal operation on a directory, read
     Unit tests   ❯ textOf tests/personal-paths.test.ts:23:17
     Unit tests       23|   const bytes = readFileSync(resolve(repositoryRoot, path));
     Unit tests   ❯ tests/personal-paths.test.ts:37:20
     Unit tests   ❯ tests/personal-paths.test.ts:36:29
     Unit tests  Serialized Error: { errno: -21, code: 'EISDIR', syscall: 'read' }

     Unit tests  FAIL  tests/personal-paths.test.ts > tracked files > carry no home directory prefix outside the
                 change contract that states the rule
     Unit tests  Error: EISDIR: illegal operation on a directory, read
     Unit tests   ❯ textOf tests/personal-paths.test.ts:23:17
     Unit tests   ❯ tests/personal-paths.test.ts:49:22
     Unit tests   ❯ tests/personal-paths.test.ts:48:8
     Unit tests  Serialized Error: { errno: -21, code: 'EISDIR', syscall: 'read' }

     Unit tests  ##[error]Process completed with exit code 1.
```

The two failures are the two assertions of the file that call `textOf` on every tracked path. On the Linux runner the
three entries of mode `120000` are real symbolic links to the directory `ai-specs/agents`, so `readFileSync` opens a
directory and throws. `main` is red on GitHub for this single defect.

## Task 1.2 - the state of the database

This repository has no database yet. Proof, with the exact commands:

```
git ls-files | Select-String '(\.db$|\.sqlite3?$|\.sql$|\.dump$|migrations/|prisma|drizzle|knex|sequelize|typeorm|schema\.)'
  -> (no output: no tracked database, dump, migration or schema file)

Get-Content package.json | ConvertFrom-Json  -> dependencies + devDependencies
  -> next, react, react-dom, @playwright/test, @tailwindcss/postcss, @testing-library/dom,
     @testing-library/jest-dom, @testing-library/react, @types/node, @types/react, @types/react-dom,
     @vitejs/plugin-react, eslint, eslint-config-next, jsdom, tailwindcss, typescript, vitest
  -> 18 declared packages, none of them a datastore client, an ORM or a migration tool
```

There is no `migrations/` directory in the tree either, even though section 6 of `docs/development-guide.md` reserves
that name for a later change. The two suites of the repository (Vitest and Playwright against the Next.js page) read no
datastore: the only state they touch is the file system of the checkout. Nothing was created, migrated or seeded by
this mission.

## Verdict

PASS for the base state, with one correction to the contract: the local Windows suite is **red** at the base, not
green (it fails on the archived contract, the second defect the proposal describes). The CI failure of `main` is
confirmed verbatim: job Unit tests, two `EISDIR` errors at `tests/personal-paths.test.ts:23`. The repository has no
database of any kind.
