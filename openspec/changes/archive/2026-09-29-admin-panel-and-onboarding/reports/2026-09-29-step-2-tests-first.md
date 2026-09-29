# Step 2 · the tests first

Contract: `tasks.md`, tasks 2.1 and 2.2. The two tasks share this report, as the contract asks.
Agent: deepseek-harness. Date: 2026-09-29. Branch: `feature/admin-panel-and-onboarding`.
Every command runs in the `community` worktree, quoted below as the working directory `.`; no tracked file carries the
absolute path of the machine, because `tests/personal-paths.test.ts` refuses it.

## 2.1 The red unit and route tests of every scenario

### What the tests ask for, scenario by scenario

| Scenario of `specs/admin-panel/spec.md` | Test |
|---|---|
| No password configured | `tests/admin-routes.test.ts` · `POST /api/admin/login` answers 503 naming the variable · `tests/admin-guard.test.ts` |
| Locked after five failures | `tests/admin-lockout.test.ts` · `tests/admin-routes.test.ts` (429 with `Retry-After` to the sixth attempt, even with the right password) |
| Every admin route checks the session | `tests/admin-routes.test.ts` · the twelve handlers answer 401 and leave the store empty |
| Values never leave the server | `tests/admin-setup.test.ts` (the shape carries no value) · `tests/admin-routes.test.ts` `GET /api/admin/setup` (every name of `.env.example`, no value of the environment in the JSON) |
| An SVG or a renamed file | `tests/admin-business.test.ts` (`detectLogoMime` by bytes, the refusal does not change the stored logo) |
| A forbidden topic | `tests/admin-business.test.ts` (the system prompt of a real question carries the tone, the language and the topic) |
| Upload, list, delete | `tests/admin-documents.test.ts` (the sample corpus through the route, the passage count, the delete leaves no document and no passage) |
| Delete all | `tests/admin-documents.test.ts` (the conversations table empties and the counters of spend stay) |
| A first visit and a switch | `tests/admin-i18n.test.ts` (the stand-in of the shared module) · `tests/admin-ui.test.tsx` (English first, the same keys in both languages) |

The session, the guard and the cookie of the design have their own files: `tests/admin-session.test.ts` (the token
`expiry.hmac`, `timingSafeEqual` on the password, the cookie flags) and `tests/admin-guard.test.ts` (the guard of a
page, of a handler and of a mutation from another origin).

### The red run

The tests were written before any module of the panel existed and the whole suite was run in that state, with the
implementation set aside:

```
$ npm test

 FAIL  tests/admin-business.test.ts [ tests/admin-business.test.ts ]
Error: Cannot find package '@/app/api/admin/business/route' imported from tests/admin-business.test.ts
 FAIL  tests/admin-documents.test.ts [ tests/admin-documents.test.ts ]
Error: Cannot find package '@/app/api/admin/conversations/delete/route' imported from tests/admin-documents.test.ts
 FAIL  tests/admin-guard.test.ts [ tests/admin-guard.test.ts ]
Error: Cannot find package '@/lib/admin/guard' imported from tests/admin-guard.test.ts
 FAIL  tests/admin-i18n.test.ts [ tests/admin-i18n.test.ts ]
Error: Cannot find package '@/lib/i18n/language' imported from tests/admin-i18n.test.ts
 FAIL  tests/admin-lockout.test.ts [ tests/admin-lockout.test.ts ]
Error: Cannot find package '@/lib/admin/lockout' imported from tests/admin-lockout.test.ts
 FAIL  tests/admin-routes.test.ts [ tests/admin-routes.test.ts ]
Error: Cannot find package '@/app/api/admin/login/route' imported from tests/admin-routes.test.ts
 FAIL  tests/admin-session.test.ts [ tests/admin-session.test.ts ]
Error: Cannot find package '@/lib/admin/session' imported from tests/admin-session.test.ts
 FAIL  tests/admin-setup.test.ts [ tests/admin-setup.test.ts ]
Error: Cannot find package '@/lib/admin/setup' imported from tests/admin-setup.test.ts
 FAIL  tests/admin-ui.test.tsx [ tests/admin-ui.test.tsx ]
Error: Failed to resolve import "@/components/admin/BusinessForm" from "tests/admin-ui.test.tsx". Does the file exist?
 FAIL  tests/admin-business-missing.test.ts > readBusiness without the table > answers null instead of throwing
Error: Cannot find package '@/lib/settings/business' imported from tests/admin-business-missing.test.ts

 Test Files  10 failed | 17 passed (27)
      Tests  1 failed | 191 passed (192)
   Duration  10.60s

exit=1
```

The ten new files fail for the only reason a test may fail before the code: the modules they ask for do not exist.
The seventeen files of the base keep passing, which is what says the red comes from this change and not from the
suite.

One bound of the tests was corrected while writing them and it is recorded here because it is real: the token of the
"expired session" case was built at `now + 13 h`, which signs an expiry of `now + 25 h` and is therefore valid. The
case now signs a token thirteen hours in the past, which is expired, and it reports the guard as `unauthorized`.

## 2.2 The red end-to-end

`e2e/admin.spec.ts` walks the flows the contract names, in the order of the panel: the login with a wrong password
and with the right one, the sixth attempt of one address, the setup page with its variables and one provider test,
the business form with the save and the switch to Spanish, an SVG logo refused, a document uploaded, listed and
deleted, the conversations listed and deleted, and an axe check of every page with the tags of the existing
`e2e/design-system.spec.ts`.

The spec runs against the built application (`npm run build && npm start`), with the deterministic providers and a
store of its own, so no test of this change can touch the store of the quick start or call a real provider:

- `e2e/admin-fixtures.ts` holds the password, the secret, the store path and the address of the run.
- `playwright.config.ts` passes them to the server, removes the store of the previous run before the build and sends
  the `x-forwarded-for` of the run, so the lockout of one test cannot lock the next one.

### The red run

```
$ npx playwright test e2e/admin.spec.ts

Error: Process from config.webServer was not able to start. Exit code: 1
[WebServer] Failed to type check.

exit=1
```

The run stops before the first browser because the build type-checks the project and the spec imports
`lib/i18n/admin` and the fixtures of a panel that does not exist yet. The red of this end-to-end is the build
refusing the missing modules, and the green of task 7.1 is the same command with the panel in place.

## Commits of this task

- `1785d2f` ("Write the red tests of the panel, unit, route and end to end, before its code") carries this report, the
  ten test files, `e2e/admin.spec.ts`, `e2e/admin-fixtures.ts`, the `playwright.config.ts` of the run and the marks of
  2.1 and 2.2.
