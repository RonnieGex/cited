# Step 12: what the third review of Codex reproduced

- Contract: `openspec/changes/provider-keys-in-panel/tasks.md`, section 12 (amended by Fable after
  `katalis-dev/tasks/revision-community-12c.md`)
- Branch: `feature/provider-keys-in-panel`, in the worktree `katalis-dev/community-ins`
- Base: `main` `c07640b`; the change starts at `71f08f0`
- HEAD at the start of the round: `287539e` ("Amend the keys contract after the third review: an unfinished
  installation names no variable, and the state reader fails on a missing store")
- Fixes: 12.1, 12.2, 12.3 and 12.4
- Reports of the earlier steps: `reports/2026-09-29-step-{0,1,2,3,4,5,6,7,8,9,10,11}-*.md`

This report is written in parts, one per commit of the round, so that every `[x]` of section 12 points at the exact
command, the commit and the output that support it. The report of a step is always at this path inside the change
folder, which is what survives the archive.

The round follows the rule of the contract: the test first, red before the fix, reproducing what the review
reproduced. Every red run below is a real execution on the worktree with the fix out of it, and the red test of each
Major travels in its own commit, immediately before the fix.

`main` did not move during this round: it is still `03101b6` ("Merge elevenlabs-voice-agent"), which brought the two
tables of the voice change. The base of this change is still `c07640b`.

## 12.1 Major M-1: the shared answer of an installation that is not finished

**The finding.** `lib/admin/respond.ts` built its `503` with the names the guard handed over
(`the panel needs ${guarded.missing.join(" and ")}`, `ADMIN_PASSWORD has fewer than ${guarded.minimum} characters`),
and `app/admin/layout.tsx` printed `guarded.missing`. The constructor is the one of every route of `/api/admin/*`, and
the layout is the one of every page of `/admin`, so `/admin/ai`, `/admin/business`, `/admin/conversations` and
`/admin/documents` could name a variable of the environment when the installation was not finished. Codex reproduced
it against the real constructor:

```text
unconfigured status=503 names_variable=true body={"status":"unconfigured","error":"the panel needs ADMIN_SESSION_SECRET; fill the variable in the environment of the server, never with a value in the repository"}
short-password status=503 names_variable=true body={"status":"unconfigured","error":"ADMIN_PASSWORD has fewer than 16 characters; choose a longer password in the environment of the server, never with a value in the repository"}
```

The test of 11.3 always configured both variables before reading the routes and the pages, so it never entered these
two paths: the requirement is universal and the coverage was not.

### Red before the fix

Command:

```text
npx vitest run tests/admin-unconfigured-words.test.tsx tests/admin-routes.test.ts --reporter=verbose
```

Output (with the fix out of the worktree, at the red commit `0effde0`):

```text
 FAIL  tests/admin-routes.test.ts > POST /api/admin/login > answers 503 with the code of an installation that is not
       finished and never a variable name
 AssertionError: expected 'unconfigured' to be 'panel_not_configured' // Object.is equality
 FAIL  tests/admin-routes.test.ts > every admin route checks the session > answers 503 without a password, and 403 to
       a mutation from another origin
 AssertionError: expected '{"status":"unconfigured","error":"the…' to contain 'panel_not_configured'
 FAIL  tests/admin-unconfigured-words.test.tsx > an installation that is not finished > writes the names of the missing
       variables to the server log, once
 AssertionError: expected [] to have a length of 1 but got +0
 FAIL  tests/admin-unconfigured-words.test.tsx > an installation that is not finished > answers every route of
       /api/admin with the code and never the name, without a session secret
 AssertionError: POST http://localhost/api/admin/business/logo: {"status":"unconfigured","error":"the panel needs
       ADMIN_SESSION_SECRET; fill the variable…"}: expected [ 'ADMIN_SESSION_SECRET' ] to deeply equal []
 FAIL  tests/admin-unconfigured-words.test.tsx > an installation that is not finished > answers every route of
       /api/admin with the code and never the name, with a short password
 AssertionError: POST http://localhost/api/admin/business/logo: {"status":"unconfigured","error":"ADMIN_PASSWORD has
       fewer than 16 characters; choose a longer password…"}: expected 'unconfigured' to be 'admin_password_too_short'
 FAIL  tests/admin-unconfigured-words.test.tsx > an installation that is not finished > renders every page other than
       For the installer in the words of the owner, without a session secret
 AssertionError: /admin/ai: expected [ 'ADMIN_SESSION_SECRET' ] to deeply equal []
 FAIL  tests/admin-unconfigured-words.test.tsx > an installation that is not finished > renders every page other than
       For the installer in the words of the owner, with a short password
 Error: A component suspended while responding to synchronous input (the layout did not stop the panel, so the async
       pages of the routes were rendered)
 FAIL  tests/admin-unconfigured-words.test.tsx > an installation that is not finished > answers the other pages of
       /admin without a variable name, in both states
 AssertionError: /admin/ai: the panel needs ADMIN_SESSION_SECRET: fill the variable in the environment of the server
       and start it again: expected [ 'ADMIN_SESSION_SECRET' ] to deeply equal []

 Test Files  2 failed (2)
      Tests  8 failed | 12 passed (20)
```

The first failure of the walk is the `503` of a route of the panel, with the name of the missing variable inside the
JSON; the third is the proxy answering a page of `/admin` with the same name; the fourth is the layout of the panel
printing it in the HTML of `/admin/ai`. That is the Major of the review, line by line.

Commits: `0effde0` (the test, red) and this one (the fix).

### The fix

`lib/admin/guard.ts`:

- `blockOf()` writes the diagnostic of the state once to the log of the server with `console.error`, and once per
  state and process and not once per request (`writeOnce()`, keyed by the line): the names of the missing variables for
  `unconfigured`, and `ADMIN_PASSWORD` with its minimum for `short-password`. The log is the place of whoever
  installs, and it is one of the two the requirement allows.
- `OWNER_WORDS` holds the two sentences of the owner: they say that whoever installs Cited has to finish the
  installation, and they name nothing.
- `adminProblem(environment, { installerPage })` answers the names only when `installerPage` is true; every other
  caller receives `OWNER_WORDS`.

`lib/admin/respond.ts`: the two blocks answer `{"status":"panel_not_configured","reason":"panel_not_configured",
"error":<owner words>}` and `{"status":"admin_password_too_short","reason":"admin_password_too_short",
"error":<owner words>}` with `503`, the same shape the provider routes of 11.3 use for `address_not_allowed`.

`app/admin/layout.tsx`: the `unconfigured` branch stops printing `guarded.missing`, and the `short-password` state
stops falling through to the pages — it was rendering the panel, which is the other half of the same hole. Both
states render the words of the owner and a link to "For the installer" (`/admin`), the only page that names a
variable.

`proxy.ts`: `adminProblem` receives `installerPage: pathname === "/admin"`, so the response of a page under `/admin/`
names no variable and only the response of `/admin` itself (the installer page) keeps its diagnostic.

`lib/i18n/admin.ts` and `components/admin/LoginForm.tsx`: the two new strings (`panelNotConfigured`,
`panelPasswordTooShort`) in English and in Spanish, and the form translates the code of the `503` instead of echoing
the body of the server.

`docs/admin.md`: the paragraph that promised a `503` "naming the variable or the rule that fails" now describes the
code, the words of the owner, the log and "For the installer", and the table of tests names the new file. The
documentation outside the change folder is not part of the contract of section 12, but it described the behaviour this
round removes.

### Green after the fix

```text
npx vitest run tests/admin-unconfigured-words.test.tsx tests/admin-routes.test.ts tests/admin-guard.test.ts tests/admin-pages-variables.test.ts tests/provider-panel-words.test.ts --reporter=verbose
 Test Files  5 passed (5)
      Tests  42 passed (42)
```

The states are in the log and nowhere else, which is the other half of the scenario:

```text
stderr | tests/admin-routes.test.ts > POST /api/admin/login > answers 503 to every password shorter than sixteen characters
the panel is not configured: ADMIN_PASSWORD has fewer than 16 characters
stderr | tests/admin-routes.test.ts > every admin route checks the session > answers 503 without a password, and 403 to a mutation from another origin
the panel is not configured: the environment of the server is missing ADMIN_PASSWORD
```

The whole suite after this fix: 56 files, 488 tests, green (55 files and 480 tests before this round; the new file
adds eight tests).

### Three existing tests changed, and why

They encoded the behaviour this Major removes, so they had to say the new one. No assertion was relaxed: the name is
replaced by the code, and the sentence of the owner is checked for the words of whoever installs.

- `tests/admin-routes.test.ts`, `POST /api/admin/login`: "answers 503 with the code of an installation that is not
  finished and never a variable name" (it expected `body.error` to contain `ADMIN_PASSWORD` and
  `ADMIN_SESSION_SECRET`).
- `tests/admin-routes.test.ts`, the short password: it expected `body.error` to contain `ADMIN_PASSWORD` and `16`; now
  it checks `admin_password_too_short` in `status` and `reason`.
- `tests/admin-routes.test.ts`, `GET /api/admin/setup` without a password: it expected the body to contain
  `ADMIN_PASSWORD`; now it checks the code and that the name is absent.

## 12.2 Major M-2: `store:state` fails clearly on a store that is not there

**The finding.** `scripts/store-state.ts` printed `exists: false` for a path that did not exist and returned from
`main()` without a word: the process finished with code 0. The test of 11.4 codified it
(`expect(result.status).toBe(0)`), so a command of evidence could support a box with a store that never existed.
Codex reproduced it with a temporary path:

```text
npm run store:state -- C:\...\store-review\missing.sqlite
exists: false
tables: 0
...
STORE_MISSING exit=0 created=False
```

The other half of the finding was closed: a reading over an existing SQLite finished with code 0, kept the same
SHA-256 and added no table (`STORE_READONLY exit=0 hash_unchanged=True`).

### Red before the fix

Command:

```text
npx vitest run tests/store-state.test.ts --reporter=verbose
```

Output (with the fix out of the worktree, at the red commit `33c443c`):

```text
 FAIL  tests/store-state.test.ts > the reader of the state of the store > fails clearly on a store that is not there,
       creating nothing
 AssertionError: expected +0 to be 2 // Object.is equality

 - Expected
 + Received

 - 2
 + 0

 Test Files  1 failed (1)
      Tests  1 failed | 3 passed (4)
```

The test that expected code 0 was changed to expect 2; the other three passed before the fix and after it, which is
the point of the second one: an existing file keeps its bytes.

Commits: `33c443c` (the test, red) and this one (the fix).

### The fix

`scripts/store-state.ts`: `missing()` no longer prints a table of absences as if it were a state. It writes
`store not found: <path>` to stderr and exits with code 2, and it creates neither the file nor the folder — the path
was already only resolved, never prepared with `prepareStorePath()`, which is what creates the folder of the store.
The comment of the file carries the reason, with the Major that reproduced it.

The reader of a store that exists is untouched: `node:sqlite` with `readOnly: true`, no `openStore()`, no migration.

### Green after the fix

```text
npx vitest run tests/store-state.test.ts --reporter=verbose
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

### The command of the review, over the fixed reader

The same command Codex reproduced, with a temporary path that did not exist (the folder of the path did not exist
either, so both halves of "creating nothing" are read):

```text
$ npm run store:state -- <a temporary path that did not exist>

> cited@0.1.0 store:state
> node --env-file-if-exists=.env scripts/store-state.ts <that path>

.env not found. Continuing without it.
store not found: <that path>
exit=2 file=False folder=False
```

`file=False` is `Test-Path` over the path and `folder=False` is `Test-Path` over its folder: the command created
nothing at all. The `.env not found. Continuing without it.` line is Node and not the reader: the repository has no
`.env` (`Test-Path .env` is `False`), which is why the script can be run through `npm run store:state` without opening
a file of secrets.

## 12.3 Minor: every `[x]` of the round in the commit of its evidence, and gitleaks commit by commit

The Minor of the third review asked two things of this section: that every `[x]` is marked in the same commit as the
report that supports it — the Linux container run included — and that the table of gitleaks of the report lists every
commit of the round up to the final HEAD, read after the last commit.

| Casilla | Commit that marks it | The evidence inside that same commit |
| --- | --- | --- |
| 12.1 | `2709134` | the red run, in its own commit `0effde0` immediately before, and the green run, in this report |
| 12.2 | `a978752` | the red run, in its own commit `33c443c` immediately before, and the green run, in this report |
| 12.3 | the closing commit | this table and the one of gitleaks below |
| 12.4 | the closing commit | the battery of Windows and the run of the `node:24` container, in this report |

The state of the loop in RUNNING travelled in `cb5a558`, before the red test of 12.1, as in the earlier rounds.

### gitleaks, one commit at a time

```text
$ gitleaks git --log-opts "<the sha> -1" --redact --no-banner
```

| Commit | What it carries | gitleaks over that commit |
| --- | --- | --- |
| `cb5a558` | the state of the loop in RUNNING | no leaks found |
| `0effde0` | 12.1: the walk of every route and every page, red | no leaks found |
| `2709134` | 12.1: the code, the words of the owner and the log | no leaks found |
| `33c443c` | 12.2: the reader that has to fail with code 2, red | no leaks found |
| `a978752` | 12.2: the reader fails with code 2 | no leaks found |
| the closing commit | 12.3 and 12.4: this report, the marks and the state of the loop | no leaks found (`gitleaks git --pre-commit --staged -c .gitleaks.toml`, over the staged tree, which is byte for byte the tree of the commit) |

The hook of the repository (`.githooks/pre-commit`) ran for every commit of the round and refused none of them. A
commit cannot contain the scan of its own hash, so the closing one is registered with the scan of its staged tree —
the same bytes it commits — and the scan of `HEAD -1` after the commit, the final HEAD and
`git rev-list --count main..HEAD` are recorded in the delivery `katalis-dev/tasks/entrega-community-12.md`, which is
outside the repository and is written once the closing commit exists.

## 12.4 The battery and the delivery

### Windows

Run over the working tree that becomes the closing commit, after the two typing errors of the new test file were
fixed (see below):

```text
$ npm test
 Test Files  56 passed (56)
      Tests  489 passed (489)

$ npm run typecheck
✓ Types generated successfully
(exit 0)

$ npm run lint
(no output, exit 0)

$ npm run test:e2e
  30 passed

$ npm audit --audit-level=high
found 0 vulnerabilities

$ npx openspec validate --all --strict
Totals: 11 passed, 0 failed (11 items)

$ git diff --check main...HEAD
(no output, exit 0)
```

The durations of the runs and the timing table of vitest are left out of this transcription because they change
between two runs of the same tree; every command is written above, so they can be read again at any time.

The first `npm run typecheck` of this battery found two typing errors of the new test file of 12.1 —
`import.meta.glob` with a type argument this version of Vite does not take, and the index of the module by method —
which vitest never sees, because it runs the files with the transpiler and without a type check. Both are fixed in
the closing commit, and the battery above is the run over the tree with the fix.

### In a `node:24` Linux container, over the exact tree of the closing commit

Everything this commit carries is staged first (`git add -A`), so the tree of the commit that is about to exist is the
one of the staging area, read with `git write-tree`. A temporary copy outside the repository receives the 541 tracked
files of the worktree and commits them: it is a clone
(`git clone --no-hardlinks --branch feature/provider-keys-in-panel`) and not a plain copy of the files, because some
tests read `git ls-files` and a linked worktree of Windows has a `.git` that is a file pointing to a path of the host,
which the container cannot resolve. The tree of that local commit and the tree of the staging area are then the same
hash, and that is what says that what the container reads is what the closing commit writes. The hash is not
transcribed here on purpose: writing it inside this report would change the tree it names. The delivery records it
next to the closing HEAD.

```text
$ git -C <the worktree> write-tree                       (the tree of the closing commit)
$ git -C <the copy> rev-parse HEAD^{tree}                 (the tree the container reads)
(both hashes are the same)

$ docker run --rm -v "<the copy>:/app" -w /app node:24 sh -c "npm ci --no-audit --no-fund && node --version && npx vitest run --reporter=dot"
v24.21.0

 Test Files  56 passed (56)
      Tests  487 passed | 2 skipped (489)
```

`git -C <the copy> status --porcelain` is empty after the run: the container wrote nothing tracked, only the
`node_modules` it installed. The copy is discarded when the round closes.

A first attempt mounted the worktree itself, with an anonymous volume over `node_modules` so that the `npm ci` of the
container could not touch the install of the host: the tree was the same before and after the run, but eight tests of
`tests/design-system.test.ts`, `tests/personal-paths.test.ts` and `tests/readme.test.ts` failed inside the container
for the reason above (`git ls-files` over the `.git` of a linked worktree). The copy with a real `.git` is what the
earlier rounds used, and it is what this run uses.

The two skipped tests are the two of `tests/design-system.test.ts` that were already skipped on Linux before this
change. `node:24` carries Node v24.21.0, newer than the `>=24.15.0` of `package.json`, which is what the contract
asks for.

### The delivery

`katalis-dev/tasks/entrega-community-12.md` (outside the repository, which is why it changes no count of this round)
receives the round in Spanish with its `## Issues`, the closing HEAD and `git rev-list --count main..HEAD` read after
the last commit, with the command next to the number. The report of the round is this file; the state of the loop
closes in DONE with it.
