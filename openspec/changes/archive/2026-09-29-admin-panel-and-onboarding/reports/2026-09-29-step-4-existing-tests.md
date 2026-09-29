# Step 4 · the review and the update of the existing tests

Contract: `tasks.md`, task 4.1. Agent: deepseek-harness. Date: 2026-09-29.
Every command runs in the `community` worktree, quoted below as `.`.

## 4.1 The whole suite and which existing test changed

### The whole suite

```
$ npm test

 Test Files  27 passed (27)
      Tests  246 passed (246)
   Duration  11.18s (tests 56%, environment 26%, setup 8%, import 7%, transform 3%)

exit=0
```

The base had 17 files and 191 tests (task 1.1); the change adds ten files and fifty-five tests, and every one of
them passes.

### Which existing test changed: none at the time of this review

```
$ git diff --name-status main...HEAD | Select-String "^M|^D|^R"
M	LOOP_STATE.md
M	app/layout.tsx
M	lib/answer/ask.ts
M	lib/answer/prompt.ts
M	lib/store/index.ts
M	playwright.config.ts
```

No file under `tests/` of the base was modified, renamed or deleted at this point of the branch: every test of the
base passed with the change exactly as it was written.

**Correction, added in task 9.1.** Later in the same branch, `tests/readme.test.ts` gained one name in its constant
list of planned changes: `admin-and-public-ui` became `public-page-and-widget`, because Fable split that change in
two and the status row of the panel now names the change that is actually being built beside this one. It is the only
line of an existing test that this change touches, the reason is written in the report of step 9, and the correction
is recorded here because a report never keeps a claim that stopped being true.

The change touches five source files and one configuration file, and this is why each one of them did not invalidate
a test of the base:

- `app/layout.tsx` reads the cookie `cited-lang` and puts the language on `<html lang>`. The tests of the base do not
  render the layout (`tests/home.test.tsx` renders `Home`, not the document) and the browser tests of the base check
  the font, the kit and the axe of `/kit`, which still pass with a document language of `en`.
- `lib/answer/ask.ts` reads the business of the store once per question and passes it to `buildMessages`. The prompt
  of the base is unchanged when there is no business row, so `tests/answer.test.ts` and `tests/ask-route.test.ts`
  keep the prompt they assert.
- `lib/answer/prompt.ts` adds the rules of the business **after** the five rules of the base and only when a business
  is given; `buildMessages` takes the business as an optional field. The test of the base that reads the system
  message (`keeps the rules, the passages and the question apart`) still finds the rule it looks for.
- `lib/store/index.ts` adds two tables and their methods and does not change one line of the existing schema or of
  the existing methods; `tests/store.test.ts` lists the tables it asks for and does not enumerate them.
- `playwright.config.ts` passes the environment of the end-to-end run to the server it starts and removes the store
  of the previous run. The two specs of the base (`e2e/home.spec.ts`, `e2e/design-system.spec.ts`) run against the
  same built application and are not touched by that environment.

The one thing that did change inside a test file is the correction of four bounds of the **new** tests while
implementing them; they belong to step 2 and are recorded in the report of step 3, section "What changed in the
tests while implementing, and why".

## Commit of this task

- `22d8649` ("Review the whole suite: no test of the base had to change") carries this report and the mark of 4.1,
  verified against `74a0ad9`.
