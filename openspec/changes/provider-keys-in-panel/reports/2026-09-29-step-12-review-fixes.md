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
