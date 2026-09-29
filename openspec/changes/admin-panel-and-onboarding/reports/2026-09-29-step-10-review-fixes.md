# Step 10 · what the review of Codex reproduced

Contract: `tasks.md`, section 10, added by Fable in `c289f94` ("Keep one visitor from locking the owner out, and count
the trusted proxies") after `revision-community-07`. Agent: deepseek-harness. Date: 2026-09-29. The round starts at
`c289f94` and every command below runs in the `community` worktree, quoted as `.`. No test calls a real provider.

Tests first: each finding has its red run committed before the fix that turns it green, and the red reproduces what the
review reproduced. The five `[x]` of this section, this report and the round of the delivery travel in the closing
commit, which `git log -1 --format=%h -- openspec/changes/admin-panel-and-onboarding/reports/2026-09-29-step-10-review-fixes.md`
names.

## The findings of the review, and where each one was answered

| Finding of `revision-community-07` | Task |
|---|---|
| BROKEN 1, Major: `TRUST_PROXY` was a flag, `.env.example` promised the first value of `x-forwarded-for` and the code took the last; two clients of the same proxy locked each other, and without the variable every visitor shared one bucket and anybody could keep the owner out | 10.1 and 10.2 |
| RISK 1, Minor: `readBusiness()` swallowed every failure of the store and called it "no business yet" | 10.3 |
| RISK 2, Minor: reports whose "commit of this task" had no hash, and one with the literal `<commit>` | 10.4 |
| RISK 3, Minor: the delivery counted 16 commits against `main` where Git counted 17 | 10.4 |
| NOT DONE 1, Minor: `login-375.png` did not exist although task 7.1 marked the captures complete | 10.4 |

Two more findings appeared while running the battery of 10.5. They are not in the review because they were not visible
at `57bbeb4`: the amendment of `c289f94` broke the README guard, and the one second of 10.2 could answer at 999 ms on
Linux. Both are written below with their red.

## 10.1 `TRUST_PROXY` as the number of trusted proxies (Major)

### Red, before the fix

`tests/guards-proxy.test.ts` is new and pins the two functions of the calculation
(`trustedProxies` and `clientAddress`); `tests/guards.test.ts` gained the two scenarios of the MODIFIED requirement of
`specs/answering/spec.md`. Committed red in `9e80491` ("Write the red tests of the trusted proxies before the fix").

```
$ npx vitest run tests/guards.test.ts tests/guards-proxy.test.ts

 ❯ tests/guards-proxy.test.ts (4 tests | 4 failed) 32ms
   ❯ the number of trusted proxies (1)
     × reads a count out of the value and nothing else 4ms
   ❯ the address the chain carries (3)
     × answers null when no proxy is trusted or no header arrives 24ms
     × takes the address that many places from the right of x-forwarded-for 1ms
     × falls back to x-real-ip and then to the single bucket behind a proxy 1ms
 ❯ tests/guards.test.ts (17 tests | 2 failed) 8278ms
   ❯ the address of the visitor (7)
     × keeps every client of two trusted proxies in its own bucket 13ms
     × ignores the addresses a client wrote before the two its proxies appended 2ms

 FAIL  tests/guards-proxy.test.ts > the number of trusted proxies > reads a count out of the value and nothing else
TypeError: trustedProxies is not a function
 FAIL  tests/guards.test.ts > the address of the visitor > keeps every client of two trusted proxies in its own bucket
AssertionError: expected 'direct' to be '198.51.100.21'

 Test Files  2 failed (2)
      Tests  6 failed | 15 passed (21)

exit=1
```

The behavioural red is the one of the review: with `TRUST_PROXY=2` the two clients of the same CDN edge and Traefik
both fell in `direct`, so the second client was the first one for the lock.

### The fix

`4c300d3` ("Take the visitor address from the number of trusted proxies"):

- `trustedProxies(environment)` reads a positive integer out of `TRUST_PROXY` (`2` is two proxies; `true` stays `1`
  for a file written before the amendment; empty, `0`, `no`, `1.5` and `-2` are none).
- `clientAddress(request, environment)` answers `null` when no proxy is trusted or when the chain cannot carry the
  address, and otherwise the address that many places from the right of `x-forwarded-for` (falling back to
  `x-real-ip` when the chain is shorter, and to `null` when there is none).
- `clientIp()` keeps the buckets of the ask route: the address, or `unknown` behind a declared proxy without a
  chain, or `direct` with no proxy at all.

```
$ npx vitest run tests/guards.test.ts tests/guards-proxy.test.ts

 Test Files  2 passed (2)
      Tests  21 passed (21)

exit=0
```

The three documents that promised the first value say what the code does, which is what the task asks: `.env.example`
(count, `1` for Traefik alone and `2` for a CDN in front of Traefik, `x-real-ip` when the chain is shorter),
`docs/answering.md` (the table of the address, with a `TRUST_PROXY=2` row) and the configuration tables of `README.md`
and `README.es.md`. `docs/security.md` and `docs/admin.md` say it too, in the text of 10.2.

## 10.2 The lock of a known address, the second of the unknown one, and the sixteen characters (Major)

### Red, before the fix

Committed red in `3ccf116` ("Write the red tests of the login lock and the short password before the fix"):
`tests/admin-session.test.ts` pins the flag of `ADMIN_PASSWORD` and the constant of sixteen,
`tests/admin-guard.test.ts` pins the `503` of the guard and of the page, and `tests/admin-routes.test.ts` pins the
twenty failures that never lock, the failure that waits a second, and the route that answers `503`.

```
$ npx vitest run tests/admin-session.test.ts tests/admin-guard.test.ts tests/admin-routes.test.ts

 ❯ tests/admin-session.test.ts (6 tests | 1 failed) 11ms
     × flags a password shorter than the sixteen characters of the spec 5ms
 ❯ tests/admin-guard.test.ts (6 tests | 1 failed) 20ms
     × refuses the panel when the password is shorter than sixteen characters 8ms
 ❯ tests/admin-routes.test.ts (12 tests | 3 failed) 7237ms
     × keeps an unknown address from locking anyone out and takes a second per failure 112ms
     × treats a trusted proxy without a forwarding header as an unknown address 72ms
     × answers 503 to every password shorter than sixteen characters 34ms

AssertionError: expected { status: 'unauthorized' } to deeply equal { status: 'short-password', …(1) }
AssertionError: attempt 1: expected 107 to be greater than or equal to 1000
AssertionError: attempt 1: expected 69 to be greater than or equal to 1000
AssertionError: expected 200 to be 503
AssertionError: expected undefined to be 16

 Test Files  3 failed (3)
      Tests  5 failed | 19 passed (24)

exit=1
```

The red of the route test is the DoS the review described: without `TRUST_PROXY` the twenty failures answered in
milliseconds and the right password at the end answered `429`, because every visitor shared the bucket `direct`.

### The fix

`a02d5f4` ("Lock the login only for a known address and require sixteen characters"):

- `lib/guards/ip.ts` answers the address or nothing; the login asks for `clientAddress()`.
- An unknown address is never counted and never locks anybody, and every failed attempt of an unknown address waits
  until a second has passed before it answers (`UNKNOWN_ADDRESS_DELAY_MS` in `lib/admin/lockout.ts`, next to the five
  failures and the fifteen minutes). A known address keeps the store, the bucket and the `429` with `Retry-After`.
- `ADMIN_PASSWORD` gains `ADMIN_PASSWORD_MIN_LENGTH = 16`: `adminConfig()` flags a shorter one, `guardSession()` and
  `guardRequest()` answer `short-password`, `guardResponse()` and the page (`proxy.ts`, through `adminProblem()`)
  answer `503` naming the variable and never its value.
- `e2e/admin-fixtures.ts` moves its password to twenty characters, because the old one had fifteen and the whole
  end-to-end run would answer `503`.
- `docs/security.md`, `docs/admin.md`, `docs/backend-standards.md` and the comment of `ADMIN_PASSWORD` in
  `.env.example` state the rule.

```
$ npx vitest run tests/admin-session.test.ts tests/admin-guard.test.ts tests/admin-routes.test.ts

 Test Files  3 passed (3)
      Tests  24 passed (24)

exit=0
```

### The one second that answered at 999 ms, found on Linux

The first run of the battery in the `node:24` container, at `8ebdb08`, failed the new test of the delay:

```
FAIL tests/admin-routes.test.ts > POST /api/admin/login > keeps an unknown address from locking anyone out and takes a second per failure
AssertionError: attempt 17: expected 999 to be greater than or equal to 1000

 Test Files  1 failed | 27 passed (28)
      Tests  1 failed | 257 passed | 2 skipped (260)
```

The timer of Node can wake a millisecond early, so one wait of 1000 ms answered at 999 ms. The test was not weakened:
`4aa559e` ("Keep the second of the unknown address when the timer wakes early") measures again after every wake and
waits the remaining time, so the answer never leaves before the second the spec asks for. The run of 10.5 in the same
container is green with the same assertion.

## 10.3 `readBusiness()` and the failures of the store (Minor)

### Red, before the fix

`tests/admin-business-missing.test.ts` now mocks two different failures of `sharedStore`, and
`tests/admin-business.test.ts` carries the exact reproduction of the review, a remote URL without a token. Committed
red in `dda1ec8`.

```
$ npx vitest run tests/admin-business.test.ts tests/admin-business-missing.test.ts

     × lets every other failure through 6ms
     × lets a failure that is not a missing table through 6ms

AssertionError: promise resolved "null" instead of rejecting
AssertionError: promise resolved "null" instead of rejecting

 Test Files  2 failed (2)
      Tests  2 failed | 9 passed (11)

exit=1
```

### The fix

`8b8eaa1` ("Let readBusiness answer null only when the table is missing"): the `catch` of `readBusiness()` returns
`null` only when the message of the error (or of its cause) says `no such table`, and re-throws everything else. The
test of the review, `readBusiness({DATABASE_URL: "libsql://not-contacted.invalid", TURSO_AUTH_TOKEN: ""})`, now reports
the missing token instead of answering "no business yet".

```
$ npx vitest run tests/admin-business.test.ts tests/admin-business-missing.test.ts

 Test Files  2 passed (2)
      Tests  11 passed (11)

exit=0
```

`readBusinessLogo()` keeps its broad tolerance, because it is not the finding and the contract names only
`readBusiness()`; it is written as an open issue below.

## 10.4 The exact commits, the count and the missing capture (Minors)

`8ebdb08` ("Name the exact commit of every report and complete the mobile login capture"):

- The nine reports that closed a task with "the commit that carries this report" or with a `<commit>` now name their
  real commit: `0d10d2c` (steps 0 and 1), `1785d2f` (2), `22d8649` (4), `ab4a742` and `b883eb3` (5), `05620c9` (6),
  `db462e1` (7), `2bb7373` (8), `9c98bb0` and `57bbeb4` (9). `git log --diff-filter=A -1 --format='%h %s' -- <report>`
  is the command that names each one, and

```
$ Select-String -Path openspec/changes/admin-panel-and-onboarding/reports/*.md -Pattern '<commit>|the commit that carries'
(no line)
```

- The delivery `katalis-dev/tasks/entrega-community-07.md` no longer says 16 commits: it says 15 of implementation and
  17 against `main` at `57bbeb4`, counting the specification of Fable and the closing commit, which is what
  `git rev-list --count main..57bbeb4` answers.
- The capture `login-375.png` exists. The capture spec of `.data/captures/` signed in before it looked at the login
  again, so it could not take the mobile one; it now captures `/admin` at 375 before signing in, the run repeated
  against the built application,

```
$ npx playwright test --config .data/captures/playwright.config.ts
  ok 1 [chromium] › .data\captures\admin-captures.spec.ts:24:5 › captures every page of the panel at 1440 and at 375 pixels (2.6s)
  1 passed (6.0s)
```

  and the file is in `katalis-dev/tasks/capturas-community-07/login-375.png`: PNG, 375 × 812, 9926 bytes, SHA-256
  `5933f5c8e17479487e0c710513b74e098f31c2ad3c83d50afae6b7089856a5c3`. The report of step 7 keeps the correction and
  the delivery names it in its table of captures. The other nine captures are the ones of the original run.

## 10.5 The battery of the round

### A finding of the amendment, and its fix

At `c289f94`, before any change of this round, the suite was red: the amendment added a `## MODIFIED Requirements`
delta of `answering` (`openspec/changes/admin-panel-and-onboarding/specs/answering/spec.md`) while the spec of
`openspec/specs/answering/spec.md` is already in force, and the guard of the README treated any open change with a
delta of a capability as if it were still adding it. Reproduced with the work of the round stashed:

```
$ git stash push -q -m wip-10-1
$ npx vitest run tests/readme.test.ts

- Expected
+ Received
- false
+ true
 ❯ tests/readme.test.ts:668:11
    666|           inForce && delivering.length > 0,
    667|           `${row.capability}: a spec an open change still adds is neve…`,
    668|         ).toBe(false);

 Test Files  1 failed (1)
      Tests  1 failed | 41 passed (42)

$ git stash pop
```

`dc44952` ("Teach the README guard that an open change may modify a spec in force") keeps the rule and sharpens it:
only a delta that carries `## ADDED Requirements` means the change is still adding the capability, so the README row
of a capability whose `## MODIFIED` spec is being amended is not a spec written by hand.

### The checks

```
$ git status --short
(no line: the working tree is clean, which is what "the commits are part of the work" means)

$ npm test                                        # Windows, Node v24.11.0

 Test Files  28 passed (28)
      Tests  260 passed (260)
   Duration  13.22s (tests 48%, environment 30%, setup 10%, import 9%, transform 3%)

exit=0

$ git clone --local --no-hardlinks . <temp> && git -C <temp> rev-parse --short HEAD
4aa559e
$ docker run --rm -v <temp>:/work -w /work node:24 bash -lc "node --version; npm ci; npm test"

v24.21.0
 Test Files  28 passed (28)
      Tests  258 passed | 2 skipped (260)
   Duration  54.32s (environment 50%, setup 20%, import 18%, tests 8%, transform 3%, worker 1%)

exit=0

$ npm run typecheck
✓ Types generated successfully
exit=0

$ npm run lint
exit=0

$ npm run test:e2e

  ok  1 [chromium] › e2e\home.spec.ts:3:5 › home page answers with the product name (641ms)
  ok  2 [chromium] › e2e\admin.spec.ts:37:5 › the panel opens in English and signs the owner in (1.9s)
  ok  3 [chromium] › e2e\design-system.spec.ts:90:5 › every text of the app is Outfit, served by the app (682ms)
  ok  4 [chromium] › e2e\design-system.spec.ts:188:5 › the controls can be seen: 3:1 of the border and of the focus, 4.5:1 of every text (2.1s)
  ok  5 [chromium] › e2e\design-system.spec.ts:134:5 › the kit renders every component, answers 200 and passes axe (1.8s)
  ok  6 [chromium] › e2e\admin.spec.ts:56:5 › the sixth attempt of one address is locked (738ms)
  ok  7 [chromium] › e2e\admin.spec.ts:78:5 › the setup page lists the variables without their values and tests a provider (1.2s)
  ok  8 [chromium] › e2e\admin.spec.ts:97:5 › the business form is saved and the panel speaks Spanish (1.1s)
  ok  9 [chromium] › e2e\admin.spec.ts:119:5 › an SVG logo is refused and a document is uploaded, listed and deleted (1.2s)
  ok 10 [chromium] › e2e\admin.spec.ts:145:5 › the conversations are listed and deleted (1.0s)

  axe: 0 violations, 21 rules passed
  10 passed (20.0s)

exit=0

$ npm run secrets:scan
258 commits scanned.
no leaks found
exit=0

$ openspec validate --all --strict
Totals: 9 passed, 0 failed (9 items)
exit=0

$ git diff --check main...HEAD
(no line)
exit=0
```

The battery ran at `4aa559e`, the head of the branch before the closing commit, and the two skips of the container are
the two the base skips on every machine where the source of the mark is not present.

### The manual reproduction of both Majors over HTTP

The review reproduced its Major with two clients behind one proxy against a running server, so the round repeated it
the same way: `node_modules/next/dist/bin/next start -p 3412` with the deterministic providers and a store of its own,
`curl.exe` for every request, one server per run.

```
=== RUN 1: a short password, GET /admin ===
server answered /admin with 503
ADMIN_PASSWORD has fewer than 16 characters: choose a longer password in the environment of the server and start it again

HTTP 503

=== RUN 2: no TRUST_PROXY, five failures with a varied header, then the right password ===
failure 1 (x-forwarded-for: 203.0.113.1)   HTTP 401 in 1.100811s
failure 2 (x-forwarded-for: 203.0.113.2)   HTTP 401 in 1.018481s
failure 3 (x-forwarded-for: 203.0.113.3)   HTTP 401 in 1.005099s
failure 4 (x-forwarded-for: 203.0.113.4)   HTTP 401 in 1.011353s
failure 5 (x-forwarded-for: 203.0.113.5)   HTTP 401 in 1.015654s
the right password after the five failures  HTTP 200 in 0.004538s

=== RUN 3: TRUST_PROXY=2, two clients of the same CDN edge and Traefik ===
client A, failure 1..5 (198.51.100.201, 203.0.113.10)  HTTP 401 (no wait: the address is known)
client B, the right password (198.51.100.202, 203.0.113.10)  HTTP 200
client A, the right password, still locked  HTTP 429, retry-after 900
```

Run 2 is the reproduction of the review inverted: it was `401 401 401 401 401 429`, and it is now five failures that
each take at least a second, with the header a client wrote ignored, and a right password that still opens the panel.
Run 3 is the other half: two clients of one edge fall in their own bucket, and one of them cannot lock the other.

## What changed in the tests of the base, and why

- `tests/readme.test.ts`: the amendment of the contract, not this round, made the README guard red (above); the fix
  keeps its rule and reads the delta of an open change before calling it "adding" a capability.
- `tests/admin-guard.test.ts` and `tests/admin-session.test.ts`: the password of their environment was eight characters
  and the guard now refuses fewer than sixteen, so the fixture moved to twenty and the short one has its own case.
- `e2e/admin-fixtures.ts`: fifteen characters to twenty for the same reason.
- No assertion was weakened: the one second is still asked as `>= 1000` and the implementation is what changed.

## Commits of this task

- `02f5eb7` opens the round with `LOOP_STATE.md` in `RUNNING`.
- 10.1: `9e80491` (red) and `4c300d3` (the fix), with `.env.example`, `docs/answering.md`, `README.md` and
  `README.es.md`.
- 10.2: `3ccf116` (red) and `a02d5f4` (the fix), with `docs/security.md`, `docs/admin.md`, `docs/backend-standards.md`,
  the comment of `.env.example` and `e2e/admin-fixtures.ts`; and `4aa559e`, the second of the unknown address that a
  timer could cut to 999 ms, found by the container run of 10.5.
- 10.3: `dda1ec8` (red) and `8b8eaa1` (the fix).
- 10.4: `8ebdb08`.
- `dc44952` fixes the guard of the README that the amendment of `c289f94` broke, before the battery of 10.5.
- 10.5: this report, the five marks, the round of the delivery and `LOOP_STATE.md` travel together in the closing
  commit of the round.
