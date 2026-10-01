# Step 4 · the existing tests the change touches

Contract: `tasks.md`, task 4.1. Agent: deepseek-harness. Date: 2026-09-30.
Change: `codeql-findings`, branch `feature/codeql-findings`, verified against the code of `15f1fe3` in the
`<worktree>`.

## 4.1 none of the existing tests is weakened or deleted

The three files the task names were reviewed against the contract commit `69aa289`.

### What the diff of the test files touches

```
$ git diff 69aa289 HEAD -- tests/admin-session.test.ts | Select-String -Pattern "^-"
-import { describe, expect, it } from "vitest";

$ git diff 69aa289 HEAD -- tests/ingest.test.ts | Select-String -Pattern "^-"
-import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
```

The only lines removed from the two files are their import lines, which the change extends (`BinaryLike` of
`node:crypto`, `statSync` of `node:fs`, `vi`). No assertion of an existing case was edited, weakened or deleted: the
diff of both files is additions only apart from those two lines.

### The counts of the cases

```
$ git show 69aa289:tests/ingest.test.ts | Select-String -Pattern "^\s+it\(" | Measure-Object | Select-Object -ExpandProperty Count
20
$ Select-String -Path tests\ingest.test.ts -Pattern "^\s+it\(" | Measure-Object | Select-Object -ExpandProperty Count
25

$ git show 69aa289:tests/admin-session.test.ts | Select-String -Pattern "^\s+it\(" | Measure-Object | Select-Object -ExpandProperty Count
6
$ Select-String -Path tests\admin-session.test.ts -Pattern "^\s+it\(" | Measure-Object | Select-Object -ExpandProperty Count
7
```

Six cases were added (five in the ingestion, one in the session) and none was lost, which is also the difference of the
suite: 1018 passed at the base of step 1 and 1024 passed after this change.

### The tests of `app/api/admin/login`

`tests/admin-routes.test.ts` carries the seven cases of the login route, which is the only caller of `passwordMatches`.
All of them pass with the slow derivation in place, and the case that answers a wrong password is the one that pays for
it: 1089 ms against the 1000 ms that the refusal already waited, and 1877 ms for the walk of the unknown address with
its two failures. The one second of the delay of the spec is still the floor of every failed attempt, so the derivation
of about 100 ms per comparison stays under it.

```
$ npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/admin-routes.test.ts tests/ingest.test.ts tests/admin-session.test.ts --no-cache --reporter=verbose

 ✓ tests/admin-routes.test.ts > POST /api/admin/login > answers 503 with the code of an installation that is not finished and never a variable name 9ms
 ✓ tests/admin-routes.test.ts > POST /api/admin/login > answers 401 to a wrong password and 200 with the signed cookie to the right one 1089ms
 ✓ tests/admin-routes.test.ts > POST /api/admin/login > answers 429 with Retry-After to the sixth attempt even with the right password 504ms
 ✓ tests/admin-routes.test.ts > POST /api/admin/login > keeps an unknown address from locking anyone out and takes a second per failure 1877ms
 ✓ tests/admin-routes.test.ts > POST /api/admin/login > treats a trusted proxy without a forwarding header as an unknown address 1101ms
 ✓ tests/admin-routes.test.ts > POST /api/admin/login > answers 503 to every password shorter than sixteen characters 4ms
 ✓ tests/admin-routes.test.ts > POST /api/admin/login > refuses a body that is not a password and a mutation from another origin 13ms

 Test Files  3 passed (3)
      Tests  44 passed (44)
   Duration  29.47s (tests 94%, import 2%, environment 2%, transform 1%, setup 1%)

exit=0
```

## Commit of this task

Every command above ran against the code of `15f1fe3`. The mark of 4.1 and this report landed in `a19f0c3`
("Review the existing tests and run the checks of the change").