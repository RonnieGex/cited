# Step 2: tests first (tasks 2.1 and 2.2)

Implementer: Sonnet 5.5. Date: 2026-09-29. Every path is relative to the repository; `<worktree>` is the checkout of
`community-ui` and `<e2e-worktree>` its scratch sibling `community-e2e`, the only place where anything builds or serves.

Commits of this step, on `feature/brand-identity-ui`:

| Commit | What |
|---|---|
| `32e492c` | `tests/brand-static.test.ts`: the static half of task 2.1 |
| `7d301df` | `e2e/brand.spec.ts` and `e2e/admin-brand.spec.ts`: task 2.2 |
| `d413c2d` | `playwright.config.ts`: the panel project serves `admin-brand.spec.ts` |

Each commit ran the pre-commit hook of the repository (gitleaks). One attempt was refused, honestly recorded: the first
version of `e2e/brand.spec.ts` carried its own password constant for the branded server and the hook stopped it
(`RuleID: generic-api-key`, `File: e2e/brand.spec.ts`, `Line: 590`, secret redacted). I removed the constant and the file now
imports `E2E_ADMIN_PASSWORD` and `E2E_ADMIN_SECRET` from `e2e/admin-fixtures.ts`, the test-only values the panel E2E already
uses. The commits above are the ones that passed:

```
INF scanned ~19409 bytes (19.41 KB) in 180ms
INF no leaks found                                    (32e492c)
INF scanned ~44987 bytes (44.99 KB) in 274ms
INF no leaks found                                    (7d301df)
INF scanned ~131 bytes (131 bytes) in 3.9s
INF no leaks found                                    (d413c2d)
```

## Task 2.1, the part that does not depend on an internal API: `tests/brand-static.test.ts`

Scope of this report: the static test only. The unit tests of `Wordmark`, `CitationMark`, `highlightLast`,
`LanguageSwitch` tones, the numbered navigation, the split sign-in and the ledger are written first by the implementers
of those components, as the contract for this step says, and they record them in their own report of step 3.

The file reads the stylesheets, the package and the sources; it renders nothing. Five groups, 24 tests:

| Group (check of the assignment) | Tests |
|---|---|
| (a) `app/brand.css` | exists with `@keyframes` `mark-land`, `note-in`, `rise`, `bar`; every keyframe animates only `transform`, `opacity`, `background-size`; every animation lasts 150 to 700 ms (the waiting bar excepted); one `@media (prefers-reduced-motion: reduce)` block sets `animation: none` for every selector that starts a keyframe (universal selector accepted) and, when the file declares a transition, `transition: none`; the block gives the highlighter `background-size: 100% 100%`; no other stylesheet declares a keyframe and no source uses a Tailwind `animate-*` utility |
| (b) tokens | Construye tokens untouched; `--ink-2 #57534E`, `--rule` (`color-mix` 12%), `--dur-fast 180ms`, `--dur-base 320ms`, `--dur-slow 640ms` in the same `:root`; `--color-ink-2` in `@theme` so that `text-ink-2` exists; `app/globals.css` imports `./brand.css` after `./tokens.css` |
| (c) contrast, WCAG 2.2 formula on the hex values read from `app/tokens.css` | ink-2 on `#FFFFFF`; ink-2 on `#FAFAF9`; ink on lime; lime on ink; paper at 60% over ink; paper at 70% over ink; plus paper at 80% over ink (the inactive navigation name of decision 7); each must reach 4.5 |
| (d) dependencies | none of `gsap`, `motion`, `framer-motion`, `animejs`, `anime.js`, `lenis`, `@studio-freight/lenis`; no dependency that `git show main:package.json` does not have (skipped only when no `main` or `origin/main` ref exists, never silently otherwise) |
| (e) bans over `app/` and `components/` | no `border-l/r/s/e-2` or wider (nor `border-left: 2px` or wider in CSS); no `bg-clip-text`, `background-clip: text`, `text-fill-color: transparent`; no emoji or pictograph (`\p{Extended_Pictographic}`, `U+FE0F`, `U+20E3`); no `backdrop-blur` or `backdrop-filter` |

The contrast tests read `--ink-2` from `app/tokens.css`, so they are red until the token exists and not green by copy.

### Red, before any implementation

```
$ npx vitest run tests/brand-static.test.ts          (<worktree>, at 32e492c)
     × exists and declares the keyframes mark-land, note-in, rise and bar
     × animates only transform, opacity and the size of the highlighter inside its keyframes
     × times every animation between 150 and 700 ms, the waiting bar excepted
     × sets animation to none, under prefers-reduced-motion, for every class that uses a keyframe
     × gives the highlighter its final background-size under reduced motion
     × adds --ink-2, --rule and the three durations in the same :root
     × exposes --ink-2 to Tailwind, so that text-ink-2 exists
     × imports ./brand.css from app/globals.css, after the tokens
     × ink-2 (secondary text) on white paper reaches 4.5:1
     × ink-2 (secondary text) on the surface #FAFAF9 reaches 4.5:1
     × has no colored side stripe (border-l-2, border-r-2 or wider used as an accent)
AssertionError: app/brand.css exists: expected false to be true
AssertionError: --ink-2: expected undefined to be '#57534e'
AssertionError: --color-ink-2: expected undefined to be 'var(--ink-2)'
AssertionError: files with a side stripe: expected [ 'components/chat/Chat.tsx', …(1) ] to deeply equal []
 Test Files  1 failed (1)
      Tests  11 failed | 13 passed (24)
```

The 13 that pass today are the ones that describe what already holds and must keep holding (the Construye tokens, no
animation library, no added dependency, no gradient text, no emoji, no glassmorphism, no keyframe outside the file,
ink on lime and lime on ink and the paper mixes over ink, all far above 4.5). The one real side stripe of the base is the
`border-l-2` of `components/chat/Chat.tsx` (twice) and `components/chat/CitationPanel.tsx`, the ones decision 10 removes.

### The test is proved able to go green, and to go red for the right reason

The parser of the stylesheets (`rulesOf`, `declarationsOf`) is not trivial, and a first version passed vacuously (it read
no declaration, because of an error in a regular expression). I found that by feeding it a `app/brand.css` and the tokens
written exactly as `design.md` describes, in the scratch worktree and not in this one: with that sample 23 of the 24 tests
passed and only the real side stripe of the base failed. Then three mutations of the sample, each caught by the test that
names it: removing `.note-in` from the reduced-motion block failed "sets animation to none"; `rise 900ms` failed "times
every animation"; a keyframe that moved `margin-left` failed "animates only transform, opacity". The sample and the copy
of the test were deleted from the scratch worktree afterwards (`git status --short` there is empty).

## Task 2.2: `e2e/brand.spec.ts` and `e2e/admin-brand.spec.ts`

15 new tests, one per scenario of the three deltas (three extra ones prove that a scenario measures something), with the
hooks and names of decision 17 and the roles and names the existing E2E use.

| Scenario of the deltas | Test (file) |
|---|---|
| design-system: The kit shows the devices | `the kit renders the wordmark, the citation mark and the highlighter next to the six markers, and passes axe` (`brand`) |
| design-system: Every text still reads | `every text of /kit reaches 4.5:1, the number inside a citation mark and the words in the highlighter included` (`brand`) |
| design-system: Reduced motion | `reduced motion` group: `/` and `/kit` with no `animation-name` and no running animation and the highlighter at `100% 100%`; and an open citation on `/` |
| (control of the scenario above) | `with motion allowed the welcome headline does animate, so the reduced-motion scenario measures something` (`brand`) |
| design-system: Nothing external moves | `tests/brand-static.test.ts` (d) and (a) |
| public-chat: The band of the business | `a business is configured › the band wears the color of the business, its name is the only h1 and the switch reads at 4.5:1` (`brand`) and its Spanish twin `the band follows the language of the visitor and the ask form still answers` |
| public-chat: No business yet | `no business yet: the band is ink, shows the wordmark, and the question box is there` (`brand`) |
| public-chat: A long thread keeps the box in reach | `four questions on a 375 x 812 viewport keep the ask form in reach, and every answer keeps its markers` (`brand`) |
| public-chat: The marks of an answer | `the marks of an answer: lime buttons named Citation n, the sources beside it, the passage in the highlighter` (`brand`) |
| admin-panel: The navigation at 1440 px | `the navigation at 1440 px: an ink column with the numbered sections, the current one marked, every text at 4.5:1` (`admin-brand`) |
| admin-panel: The navigation at 375 px | `the navigation at 375 px: a top bar that scrolls sideways, with no horizontal scroll on the page` (`admin-brand`) |
| admin-panel: The sign-in | `the sign-in › in Spanish it shows the tagline ...` and `at 375 px the two halves stack, ink first, ...` (`admin-brand`) |

The measurement is the sampler of `e2e/design-system.spec.ts` (WCAG 2.2 relative luminance over the ground the element
sits on, colors with alpha composited in a canvas), extended in two ways the spec asks for: the number inside a citation
mark is a text like any other, and the words inside the highlighter, whose ground is a gradient and not a background
color, are measured over both grounds they sit on (the paper above the paint and the lime of the paint) with the worse
of the two counting. The sampler was exercised on synthetic markup before use: ink over the highlighter measured 14.70:1,
ink-2 over paper 7.63:1, `rgba(255, 255, 255, 0.6)` over ink 7.02:1, and it flagged the number of a
`[data-brand="citation-mark"]` and the words of a `.hl` (both flags are asserted on the real pages, so a sampler that
missed them would fail and not pass).

### How the two scenarios that need a business are set up

The public E2E server has no business row, and other specs depend on that (`e2e/public-chat.spec.ts` measures the demo lime
in `--primary`, `e2e/home.spec.ts` and the others read the `Cited` heading). Seeding a row in that store would break them,
and seeding one in the store of the panel server would race with `admin.spec.ts`, which saves a business of its own in the
same run. So `e2e/brand.spec.ts` starts its own server for the group `a business is configured`: the same build
(`next start`, `node_modules/next/dist/bin/next start --port 3241`, port overridable by `E2E_BRAND_PORT`), the
deterministic providers, its own store `.data/e2e-brand.sqlite` (deleted before and after), the password and the secret of
`e2e/admin-fixtures.ts`. It signs in to the panel of that server through `POST /api/admin/login` and saves the business
through `PUT /api/admin/business`, exactly as the owner does, so nothing is seeded behind the back of the application. The
group is `serial` (one worker starts the server once) and `afterAll` kills the process tree (`taskkill /T /F` on Windows,
`SIGKILL` elsewhere). The scenario "No business yet" runs against the public server, whose store has no business row.
After the runs below `netstat` showed nothing listening on 3241, 3100 or 3213.

This adds one port (3241) to the ones of the suite (3100, 3213, 3210, 3212); I checked it free before the runs.

### The config change

The contract calls it a one-line change of the `testMatch` of the panel project. It needed two lines: the public
project matches everything but `admin.spec.ts` (`testIgnore: "**/admin.spec.ts"`), so a new `admin-brand.spec.ts` would
also have run in the public project (against the public server, with no `ADMIN_PASSWORD`) and failed there. Both are now
arrays, and only the file names differ:

```diff
-      testMatch: "**/admin.spec.ts",
+      testMatch: ["**/admin.spec.ts", "**/admin-brand.spec.ts"],
...
-      testIgnore: "**/admin.spec.ts",
+      testIgnore: ["**/admin.spec.ts", "**/admin-brand.spec.ts"],
```

### The run, red for the new scenarios and green for the old ones

```
$ cd <e2e-worktree> && git checkout --detach feature/brand-identity-ui     (at d413c2d)
$ for p in 3100 3213 3210 3212 3241; do netstat -ano | grep -E "[:.]$p " | grep -q LISTEN && echo busy || echo free; done
port 3100 free  /  3213 free  /  3210 free  /  3212 free  /  3241 free
$ CI=1 npm run test:e2e                          (npm run build && playwright test; CI=1: a busy port is an error, retries 1)
  Running 36 tests using 8 workers
  14 failed
  1 did not run
  21 passed (47.0s)
exit 1
```

A second run of the same suite on the same build with `CI=1 npx playwright test --reporter=list`, to list every test by
name, gave the same counts (`14 failed`, `1 did not run`, `21 passed (37.2s)`).

**The 21 that pass are exactly the 21 tests that existed before this change**, all green, none touched: 6 of
`e2e/admin.spec.ts`, 3 of `e2e/design-system.spec.ts`, 1 of `e2e/home.spec.ts`, 8 of `e2e/public-chat.spec.ts`, 3 of
`e2e/widget.spec.ts`.

**The 15 new tests are red** (each failed twice, first run and retry, with the same message; the last did not run because
its group is serial and the first of the group failed). First assertion that fails, by test:

| New test | Fails on | Why it is red today |
|---|---|---|
| navigation at 1440 px | `the navigation` (`[data-admin="sidebar"]` not visible) | no sidebar hook, no ink column |
| navigation at 375 px | `the navigation` (same) | no top bar |
| sign-in in Spanish | `getByText('Cada respuesta enseña de dónde salió.')` not visible | no tagline |
| sign-in at 375 px | the same locator | no tagline |
| kit renders the devices | `wordmark`: `[data-kit="wordmark"]` count 0 | the kit has the six markers only |
| kit texts reach 4.5:1 | `the sampler reached the number of a citation mark` | no citation mark on the kit |
| reduced motion `/` | `/: the page carries the highlighter` (0 `.hl`) | no highlighter on the welcome |
| reduced motion `/kit` | `/kit: the page carries the highlighter` | no highlighter section |
| reduced motion, open citation | `[data-cited="citation"] .hl` has no text | the passage has a lime side stripe, not the highlighter |
| motion allowed control | `elements of / that start an animation when motion is allowed` is 0 | no motion exists yet |
| no business yet | `[data-public="band"]` not visible | no band |
| four questions at 375 x 812 | `[data-cited="turn"]` count 0 | no ledger entry hook |
| marks of an answer | `a citation mark is lime` (`rgba(0, 0, 0, 0)` received) | the inline marks are text-like chips, not lime |
| a business is configured (band) | `[data-public="band"]` not visible, after the branded server started, signed in and saved the business | no band |

The branded server did start, accept the sign-in and save the business in both attempts (the failure is inside the test,
at the band, not in the `beforeAll`), so that scenario fails on the design and not on the setup.

## Not proved by this report

- The new scenarios have been seen red and never green: there is nothing to make them green yet. Their measurements
  were exercised on synthetic markup (the sampler) and on the current pages (they run without throwing), but the first
  green run belongs to the integration step.
- The unit tests of the components (second half of 2.1) are not here.

## Hooks that decision 17 does not name, and that the specs rely on

I did not invent hooks; where decision 17 is silent the specs use the structure the design describes. If the
implementation chooses otherwise, the spec is the thing to adjust, not the other way around:

1. Inside `[data-kit="wordmark"]` a `[data-brand="wordmark"]`, inside `[data-kit="citation-mark"]` a
   `[data-brand="citation-mark"]`, inside `[data-kit="highlighter"]` a `.hl` (decisions 13, 17 and 4 together).
2. The sections of the panel navigation are `a` elements inside a `nav` inside `[data-admin="sidebar"]`, in the order
   Setup, Business, Documents, Conversations, each with the number of its mark first ("3 Documents"); the number of the
   current mark is a leaf element whose text is that number, and its color is lime (decision 7).
3. The tagline is one element whose whole text is `Cada respuesta enseña de dónde salió.` with one `.hl` of the last three
   words inside it; there is no `data-*` hook for it.
4. The ask form (`[data-cited="ask"]`) is the `form` element itself and its computed `position` is `sticky` (decision 11).
5. Every turn, including a refusal and a failure, is a `[data-cited="turn"]` (decision 10 says each turn is an `li`).
6. A source of the list is a button named `[n] <document>` that is lime or holds a lime element; the open inline mark
   (`aria-expanded="true"`) is ink with lime text (decision 3, `citationMarkClass("open")`).
7. The top bar's list of links has an ancestor inside `[data-admin="sidebar"]` with `overflow-x: auto` or `scroll`.
8. At 375 px the links of the navigation and the sign-out are at least 44 px tall (the craft rule for phones).
9. The language cookie of the panel and the public page is `cited-lang` (existing code, `lib/i18n/language.ts`).
10. `[data-public="band"]` holds the `h1` (business name), the language switch (role `group`, name `Language`) and, with no
    business, the wordmark; the band spans the width of the page.
