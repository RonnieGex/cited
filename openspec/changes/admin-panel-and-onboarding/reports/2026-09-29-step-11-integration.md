# Step 11: the integration of the panel with the public page

Date: 2026-09-29
Repository: `C:\Users\Franc\Documents\katalis-dev\community`
Branch: `feature/admin-panel-and-onboarding` (never a commit on `main`)
HEAD at the start of the round: `2f03670` ("Ask for the integration of the panel with the public page on main")
`main` merged: `ee966f0` ("Merge public-page-and-widget"), the change `public-page-and-widget` already archived there
Agent: deepseek-harness (this round; Fable wrote the contract and the rules of 11.1)

Round of section 11 of `tasks.md`, amended by Fable after `revision-community-07b`: the fifteen conflicts of the merge
resolved by the rules of 11.1, the Minor of `readBusiness()`, the Minor of the evidence of 10.4, and the whole battery
on the merged branch with the panel and the public page together. No test calls a real provider: the deterministic
`fake` providers ran the suite and the two servers of the browser flows.

## 11.1 `git merge main` and the fifteen conflicts

### The command, and what it left

```
$ git merge main
Auto-merging LOOP_STATE.md
CONFLICT (content): Merge conflict in LOOP_STATE.md
Auto-merging README.es.md
CONFLICT (content): Merge conflict in README.es.md
Auto-merging README.md
CONFLICT (content): Merge conflict in README.md
Auto-merging app/layout.tsx
CONFLICT (content): Merge conflict in app/layout.tsx
Auto-merging components/i18n/LanguageSwitch.tsx
CONFLICT (add/add): Merge conflict in components/i18n/LanguageSwitch.tsx
warning: Cannot merge binary files: docs/images/demo-dark.png (HEAD vs. main)
CONFLICT (content): Merge conflict in docs/images/demo-dark.png
warning: Cannot merge binary files: docs/images/demo-light.png (HEAD vs. main)
CONFLICT (content): Merge conflict in docs/images/demo-light.png
Auto-merging docs/images/readme-graphics.json
CONFLICT (content): Merge conflict in docs/images/readme-graphics.json
warning: Cannot merge binary files: docs/images/roadmap-dark.png (HEAD vs. main)
CONFLICT (content): Merge conflict in docs/images/roadmap-dark.png
warning: Cannot merge binary files: docs/images/roadmap-light.png (HEAD vs. main)
CONFLICT (content): Merge conflict in docs/images/roadmap-light.png
Auto-merging lib/i18n/language.ts
CONFLICT (add/add): Merge conflict in lib/i18n/language.ts
Auto-merging lib/settings/business.ts
CONFLICT (add/add): Merge conflict in lib/settings/business.ts
Auto-merging playwright.config.ts
CONFLICT (content): Merge conflict in playwright.config.ts
Auto-merging proxy.ts
CONFLICT (add/add): Merge conflict in proxy.ts
Auto-merging scripts/readme-graphics/data.mjs
CONFLICT (content): Merge conflict in scripts/readme-graphics/data.mjs
Auto-merging scripts/readme-graphics/honesty.mjs
Auto-merging tests/readme.test.ts
Automatic merge failed; fix conflicts and then commit the result.
exit=1
```

The fifteen files are the fifteen `revision-community-07b` named, in the same order. The merge is one commit,
`3905078`, and its combined diff touches 17 files: the fifteen conflicts plus the two the integration had to adapt
(`package.json` and `e2e/admin-fixtures.ts`), which are explained below.

### Every conflicted file and the rule applied

| # | File | Rule of 11.1 | What the merge left |
|---|---|---|---|
| 1 | `lib/settings/business.ts` | keeps this branch's version (the panel owns it) | this branch's file (add/add: `main` carried a stand-in returning `null`), with the fix of 11.2 |
| 2 | `lib/i18n/language.ts` | keeps `main`'s version (the public page owns it) | `main`'s file: `LANG_COOKIE`, `LANGS`, `langCookie` and the tolerant `resolveLang`; the stand-in header is gone |
| 3 | `components/i18n/LanguageSwitch.tsx` | keeps `main`'s version (the public page owns it) | `main`'s file; the panel calls it with `current` alone, which its optional props accept, and the stand-in header is gone |
| 4 | `LOOP_STATE.md` | the state file of the round that is running | this branch's file, the `RUNNING` state of section 11 |
| 5 | `proxy.ts` | the behaviour of both sides | one `proxy()`: `/admin` and `/admin/:path*` answer `adminProblem` with `503` and never its value; `/` and `/embed` carry the nonce and the policy of the public documents, `frame-ancestors` included; the `matcher` names the four paths |
| 6 | `app/layout.tsx` | the behaviour of both sides | `main`'s file: the language of the visitor first, the language of the business after it, English last. This branch's version read the cookie with the fixed fallback of English, so the owner's file covers it |
| 7 | `playwright.config.ts` | the ports and origins of both suites | two projects and two servers: `panel` (`admin.spec.ts`, `E2E_DATABASE_URL` reset before the start, `TRUST_PROXY=1`, the address header) and `public` (every other spec, port 3100, the ingest of `samples/`, `ALLOWED_ORIGINS` 3210 and 3212, the high limits). No test of one suite sees the store of the other |
| 8 | `README.md` | the behaviour of both sides | both rows `Available` (the panel and the public chat of the business, each one with the spec that delivers it), both captures (the panel and the chat), `main`'s row of `ALLOWED_ORIGINS`, the quick start regenerated by the renderer, and the order of the plan without the two lanes that are already in |
| 9 | `README.es.md` | the twin of the same | the same in Spanish, with the same sections, the same code blocks and the same states as the English one |
| 10 | `scripts/readme-graphics/data.mjs` | the behaviour of both sides | both rows `Available` in the status table, the two stale `Planned` rows of the lanes out, and `plannedChanges` keeping the name of each lane |
| 11 | `docs/images/demo-dark.png` | the graphics follow the merged text | regenerated |
| 12 | `docs/images/demo-light.png` | the graphics follow the merged text | regenerated |
| 13 | `docs/images/roadmap-dark.png` | the graphics follow the merged text | regenerated |
| 14 | `docs/images/roadmap-light.png` | the graphics follow the merged text | regenerated |
| 15 | `docs/images/readme-graphics.json` | the graphics follow the merged text | written by the same run of the renderer |

### The three files that took one whole side, and the three that took both

`git checkout --ours` left this branch's `lib/settings/business.ts` and `LOOP_STATE.md`, and `git checkout --theirs`
left `main`'s `lib/i18n/language.ts` and `components/i18n/LanguageSwitch.tsx`. `app/layout.tsx` also took `main`'s
file: its resolution of the language is a superset of the one of this branch, so there was nothing of this side to
keep. In all five the merge is exactly one of the two files, byte for byte, and the stand-in headers of both lanes
disappear with them (the only mentions left are the design of this change, which quotes the convention, and the test
that used to assert the headers, which is updated below).

`proxy.ts` and `app/layout.tsx` deserved the care: the guard of the panel and the policy of the public documents are
two different answers of the same middleware, and the matcher is what decides which one a request gets. A request of
`/admin` never leaves without the guard, and `/` and `/embed` never lose their `frame-ancestors`; the test of
`tests/admin-guard.test.ts` pins both halves now.

`/api/brand/logo`, the other file the rule names, was not conflicted and needed no resolution: the route is this
branch's, because the lane of the public page reads it through `LOGO_ENDPOINT` of `lib/public/brand.ts` and never
added a route of its own. The public page of `main` asks this branch's route for the logo of the business, which is
the integrated behaviour the rule asks for, and the browser flow of the public page covers it.

### The two servers of the browser flows

The two suites need two states that the other one breaks: the public page answers from the corpus of `samples/` that
its server ingests, and the panel uploads, lists and deletes the documents of its own store, which starts empty. The
panel also needs `TRUST_PROXY=1` and its own address header, and the public page does not. So the merged
`playwright.config.ts` starts two servers and gives each suite its own project:

- `panel`, on `E2E_PORT` (`e2e/admin-fixtures.ts`): 2 models of the merge ago it was 3211, and it is 3213 now, because
  `e2e/widget.spec.ts` serves from 3211 the site that must not be allowed to frame the chat; two servers cannot share
  the port and that site is what proves the `frame-ancestors` of `/embed`.
- `public`, on port 3100: the port `e2e/widget.spec.ts` names as the origin of the application it embeds, with the
  ingest of the corpus, `ALLOWED_ORIGINS` and the high limits of `main`'s configuration.

The build is one and it moved to `npm run test:e2e` (`npm run build && playwright test`), because Playwright starts the
two servers at the same time and two `next build` runs writing the same `.next` would race. The two servers start from
that one build with their own environment.

## 11.2 `readBusiness()` answers `null` only for its own table (Minor)

### Red, before the fix

`c870b16` adds the two cases of the review to `tests/admin-business-missing.test.ts`: a missing table that is not
`business` (`documents`) and a missing table whose name starts with `business` (`business_logo`) must reach the
caller.

```
$ npx vitest run tests/admin-business-missing.test.ts

     × lets a missing table that is not business through
     × lets a missing table whose name starts with business through

AssertionError: promise resolved "null" instead of rejecting

 Test Files  1 failed (1)
      Tests  2 failed | 2 passed (4)

exit=1
```

### The fix

`d8eef32`: `lib/settings/business.ts` recognises the message `no such table:` only when the table it names is
`business` (with an optional schema and optional quotes, and never a name that starts with `business`), so the
`catch` of `readBusiness()` answers `null` for its own missing table and lets every other failure through.

```
$ npx vitest run tests/admin-business-missing.test.ts tests/admin-business.test.ts

 Test Files  2 passed (2)
      Tests  13 passed (13)

exit=0
```

`readBusinessLogo()` keeps its broad `catch`, as 10.3 recorded: it is not the finding of the review and the contract
names only `readBusiness()`.

## 11.3 The evidence of 10.4 (Minor)

`9b50210` and `2a3a11a`. The search that 10.4 recorded read `(no line)`, and `revision-community-07b` (RISK 1)
reproduced why: the marker it looks for is written by the report that records the correction, which names it in its
list of findings, in its paragraph and in the command itself, so the search found those three mentions and never the
reports that were corrected. The full search, before the correction:

```
$ Select-String -Path openspec/changes/admin-panel-and-onboarding/reports/*.md -Pattern '<commit>|the commit that carries'
openspec\changes\admin-panel-and-onboarding\reports\2026-09-29-step-10-review-fixes.md:18:| RISK 2, Minor: reports whose "commit of this task" had no hash, and one with the literal `<commit>` | 10.4 |
openspec\changes\admin-panel-and-onboarding\reports\2026-09-29-step-10-review-fixes.md:213:- The nine reports that closed a task with "the commit that carries this report" or with a `<commit>` now name their
openspec\changes\admin-panel-and-onboarding\reports\2026-09-29-step-10-review-fixes.md:219:$ Select-String -Path openspec/changes/admin-panel-and-onboarding/reports/*.md -Pattern '<commit>|the commit that carries'
```

The evidence of 10.4 is the search over the reports of steps 0 to 9, the ones the correction touched, whose single
digit in `step-N-` leaves this report and every later one out, so no report written after it can change its answer:

```
$ Get-ChildItem openspec/changes/admin-panel-and-onboarding/reports/*.md | Where-Object { $_.BaseName -match 'step-[0-9]-' } | Select-String -Pattern '<commit>|the commit that carries'
(no line)
```

## 11.4 The battery on the merged branch

```
$ git status --short
(no line: the working tree is clean)

$ npm test                                        # Windows, Node v24.11.0

 Test Files  38 passed (38)
      Tests  348 passed (348)
   Duration  19.25s (environment 41%, tests 35%, setup 10%, import 10%, transform 4%, worker 1%)

exit=0

$ git clone --local --no-hardlinks . <temp> && git -C <temp> rev-parse --short HEAD
3905078
$ docker run --rm -v <temp>:/work -w /work node:24 bash -lc "node --version; npm ci; npm test"

v24.21.0
 Test Files  38 passed (38)
      Tests  346 passed | 2 skipped (348)
   Duration  81.86s (environment 56%, setup 20%, import 13%, tests 7%, transform 3%, worker 1%)

exit=0

$ npm run typecheck
✓ Types generated successfully
exit=0

$ npm run lint
exit=0

$ npm run test:e2e
  ok  1 [public] › e2e\home.spec.ts:3:5 › home page answers with the product name (726ms)
  ok  2 [public] › e2e\design-system.spec.ts:134:5 › the kit renders every component, answers 200 and passes axe (2.5s)
  ok  3 [public] › e2e\design-system.spec.ts:90:5 › every text of the app is Outfit, served by the app (830ms)
  ok  4 [panel] › e2e\admin.spec.ts:37:5 › the panel opens in English and signs the owner in (2.6s)
  ok  5 [public] › e2e\design-system.spec.ts:188:5 › the controls can be seen: 3:1 of the border and of the focus, 4.5:1 of every text (2.4s)
  ok  6 [public] › e2e\public-chat.spec.ts:19:5 › an answer with its sources: the chip opens the excerpt, the document and the heading (1.3s)
  ok  7 [public] › e2e\public-chat.spec.ts:53:5 › the answer is rendered safely: injected HTML reaches no element of the DOM (1.1s)
  ok  8 [public] › e2e\public-chat.spec.ts:41:5 › a refusal: the message is styled as such and carries no citation chip (1.3s)
  ok  9 [public] › e2e\public-chat.spec.ts:89:5 › a follow-up keeps its thread in the tab and a new tab starts clean (1.4s)
  ok 10 [public] › e2e\public-chat.spec.ts:133:5 › the color reaches the page: the ask button is painted with the primary color of the settings (2.0s)
  ok 11 [public] › e2e\public-chat.spec.ts:193:5 › a tab opened from the page starts its own conversation (960ms)
  ok 12 [public] › e2e\public-chat.spec.ts:245:7 › the public page speaks English first › opens in English although the browser prefers Spanish, and answers in Spanish (779ms)
  ok 13 [public] › e2e\public-chat.spec.ts:273:5 › the public page and the embed pass axe at level A and AA (1.7s)
  ok 14 [public] › e2e\widget.spec.ts:44:5 › an allowed site: the widget loads the chat and the chat answers (622ms)
  ok 15 [public] › e2e\widget.spec.ts:66:5 › Escape inside the iframe closes the widget and returns the focus to its button (592ms)
  ok 16 [public] › e2e\widget.spec.ts:90:5 › a site that is not allowed cannot embed the chat (410ms)
  ok 17 [panel] › e2e\admin.spec.ts:56:5 › the sixth attempt of one address is locked (832ms)
  ok 18 [panel] › e2e\admin.spec.ts:78:5 › the setup page lists the variables without their values and tests a provider (964ms)
  ok 19 [panel] › e2e\admin.spec.ts:97:5 › the business form is saved and the panel speaks Spanish (954ms)
  ok 20 [panel] › e2e\admin.spec.ts:119:5 › an SVG logo is refused and a document is uploaded, listed and deleted (1.2s)
  ok 21 [panel] › e2e\admin.spec.ts:145:5 › the conversations are listed and deleted (946ms)

  axe: 0 violations, 21 rules passed
  /: axe 0 violations, 24 rules passed
  /embed: axe 0 violations, 23 rules passed
  21 passed (13.5s)

exit=0

$ npm run secrets:scan
265 commits scanned.
no leaks found
exit=0

$ openspec validate --all --strict
Totals: 10 passed, 0 failed (10 items)
exit=0

$ git diff --check main...HEAD
(no line)
exit=0
```

The battery ran on the merged tree at `3905078`; `2a3a11a` changes the report of step 10 and nothing the tests read, so
the container clone of `3905078` and the Windows runs of `2a3a11a` are the same code. The twenty-one browser tests are
the six of the panel and the fifteen of the public page and the widget, in one run of `npm run test:e2e` with the two
servers up: that is the panel and the public page together that 11.4 asks for. The two skips of the container are the
two the base skips on a machine where the source of the mark is not present.

The closing commit of the round, `602230d`, repeats the secret scan over the whole history as `main` does:

```
$ npm run secrets:scan
267 commits scanned.
no leaks found
exit=0
```

## What the tests of the base changed, and why

- `tests/admin-i18n.test.tsx`: it asserted the stand-in headers of `lib/i18n/language.ts` and
  `components/i18n/LanguageSwitch.tsx`, which the rules of 11.1 remove, so the first case now asserts that the owner's
  module carries no stand-in and the interface the panel uses (`LANG_COOKIE`, `resolveLang`, `langCookie`,
  `aria-pressed`, both languages). Its second case expected `resolveLang("ES", "en")` to answer `"en"`; the owner's
  module trims and lowercases, so it answers `"es"`, and the case follows the owner.
- `tests/admin-guard.test.ts`: the merged `proxy()` takes the request it reads the path from, so the case of the short
  password passes a `NextRequest` of `/admin`, and it now also pins the other half: the same broken configuration
  leaves `/` answering `200` with its policy, so the guard of the panel does not leak into the public page.
- `tests/readme.test.ts`: it asked for five rows marked `Planned`; the merge moves the two rows of the lanes to
  `Available`, so the floor follows the table that is left (four). The rule is not weakened: every `Available` row
  still has to name the spec that delivers it, and every `Planned` row the change that still owes it. `git` merged
  the rest of the file by itself, including `main`'s cases of `app/page.tsx`.
- `e2e/admin-fixtures.ts`, `package.json` and `docs/development-guide.md`: the port of the panel, the one build of the
  two servers and the row of the guide that describes `npm run test:e2e`.

No assertion of the panel was weakened: the lock of the sixth attempt, the one second of an unknown address, the
sixteen characters, the four passages of the uploaded document, the refusal of the SVG logo and the deletion of the
conversations run unchanged on the merged branch, and every scenario of the public page and the widget of `main` runs
beside them.

## The flakiness seen in this round

- The first browser run after the build, with `CI=1`, ended `20 passed` and `1 flaky`:
  `[public] › e2e\widget.spec.ts:44:5 › an allowed site: the widget loads the chat and the chat answers` did not find
  the answer of the iframe inside the five seconds of the assertion and passed on the retry. The two runs after it, the
  second without `CI` and so without retries, ended `21 passed (13.5s)` and `21 passed (14.0s)`.
- One run of `npm test` on Windows failed one test of the 348 and the tail of its output was not kept, so this report
  cannot name it; the eleven runs after it were green, five of them with the whole output kept.

Both are recorded as issues below.

## Commits of this round

- `e8dcef1` opens the round with `LOOP_STATE.md` in `RUNNING`.
- 11.2: `c870b16` (red) and `d8eef32` (the fix).
- 11.3: `9b50210` and `2a3a11a`.
- 11.1: `3905078`, the single commit of the merge.
- 11.4: this report, the four marks, the round of the delivery and `LOOP_STATE.md` travel together in the closing
  commit of the round.

## Issues

### BROKEN

None on the head of the round. The merge is resolved, the unit suite, the typecheck, the lint, the two servers of the
browser flows, the secret scan, the validation of the specifications and the whitespace check are green, and the two
Minors the review left open are closed with their evidence.

### RISK

1. **Minor, the browser suite is flaky on the first run after the build.** The widget case of the iframe answer failed
   once inside its five seconds and passed on the retry; the same run of the whole battery without retries was green.
   The case belongs to `public-page-and-widget` and this round did not touch it.
2. **The one test of `npm test` that failed once could not be named.** Its run kept only the tail of the output; the
   eleven runs after it were green. It is recorded here so the next round knows it happened.
3. **The panel moved its test port from 3211 to 3213.** The port of the widget suite that must not embed the chat is
   3211 and the two servers cannot share it. It is a decision of the integration, not of a lane: if Fable prefers the
   panel to keep 3211, the site of the refusal in `e2e/widget.spec.ts` is what has to move.

### NOT DONE

1. The change is not archived and nothing was pushed or deployed; that needs the explicit OK of Franc.
2. `/api/brand/logo` still has no delete route, as the round of section 10 recorded.
3. The flakiness of the browser suite was not investigated any further than the runs above.

### UNKNOWN

1. The behaviour with a real provider and with a remote Turso database is still untested: the whole round uses the
   deterministic providers and local libSQL files.
2. The state of `main` after this merge is not proven by this round: the resolution lives on
   `feature/admin-panel-and-onboarding` and nothing was pushed.
