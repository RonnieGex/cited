# Step 10: what the review of Codex reproduced

- Date: 2026-09-29
- Change: `public-page-and-widget`
- Branch: `feature/public-page-and-widget`
- Agent: deepseek-harness
- Contract: section 10 of `tasks.md`, amended by Fable after `revision-community-08`
- Review under repair: `katalis-dev/tasks/revision-community-08.md` (four Major reproduced) over `e1bd2d3`
- Rule of this section: tests first, red before each fix, reproducing exactly what the review reproduced. No test calls
  a real provider: the deterministic `fake` runs the whole battery.

## 10.1 `LanguageSwitch` takes the prop `current`

### The reproduction of the review

`revision-community-08` reproduced the type error of the real consumer of the parallel lane
(`components/admin/AdminNav.tsx`: `<LanguageSwitch current={lang} />`) against the owner module, which declared
`{ lang: Lang }`:

```text
adversarial-interface.tsx(3,53): error TS2322:
Type '{ current: string; }' is not assignable to type 'LanguageSwitchProps'.
Property 'current' does not exist on type 'LanguageSwitchProps'.
INTERFACE_TYPECHECK_EXIT=2
```

### The red state, before the fix

The interface of the owner is pinned in `tests/i18n.test.tsx` by a component that renders exactly what the panel
renders (`AdminNavLanguage`) and by the exported type of the props. Both the runtime and the type check were red at
`b487ac1` with the new tests:

```powershell
npm test
npm run typecheck
```

```text
 FAIL  tests/i18n.test.tsx > the language of the public page > is the module the parallel lane consumes: the one prop is current
TypeError: Cannot read properties of undefined (reading 'language')

 FAIL  tests/i18n.test.tsx > the language of the public page > takes the chosen language from the consumer, in Spanish too
TypeError: Cannot read properties of undefined (reading 'language')

 Test Files  4 failed | 22 passed (26)
      Tests  10 failed | 261 passed (271)
```

```text
tests/i18n.test.tsx(17,26): error TS2322: Type '{ current: Lang; }' is not assignable to type 'IntrinsicAttributes & LanguageSwitchProps'.
  Property 'current' does not exist on type 'IntrinsicAttributes & LanguageSwitchProps'.
tests/i18n.test.tsx(151,42): error TS2353: Object literal may only specify known properties, and 'current' does not exist in type 'LanguageSwitchProps'.
tests/i18n.test.tsx(153,18): error TS2339: Property 'current' does not exist on type 'LanguageSwitchProps'.
```

The same diagnostic as the review, with the `IntrinsicAttributes` of a JSX call site in front of the type. Full log:
`katalis-dev/tasks/_community-08-step10-red-unit.log` and `_community-08-step10-red-typecheck.log`.

### The fix

`components/i18n/LanguageSwitch.tsx` declares the one prop of design decision 8 as amended:
`LanguageSwitchProps = { current: Lang; reload?: () => void; className?: string }`, and the body reads `current`
everywhere the prop used to be named `lang`. The chat that consumes it (`components/chat/Chat.tsx`) calls
`<LanguageSwitch current={lang} />`. The exported type keeps its name, so the stand-in of the parallel lane can be
replaced by this file without touching that lane.

```powershell
npx vitest run tests/i18n.test.tsx
npm run typecheck
```

```text
 Test Files  1 passed (1)
      Tests  9 passed (9)
```

```text
✓ Types generated successfully
TYPE_CHECK_EXIT=0
```

## 10.2 The primary color paints the ask button and the accents

### The reproduction of the review

The review measured the computed styles of a build whose only change was a business fixture with
`primaryColor: "#1d4ed8"`: the document received the variable and no descendant used it.

```text
{"primary":"#1d4ed8","used":[]}
Expected: used.length > 0
Received: 0
PRIMARY_E2E_EXIT=1
```

### The red state, before the fix

`tests/public-page.test.tsx` renders the page with the same fixture and `tests/chat.test.tsx` pins that the chat
consumes the two variables; `e2e/public-chat.spec.ts` measures the computed color of the ask button of `/` and
`/embed` in Chromium. Red at `b487ac1`, before any fix of this section:

```text
 FAIL  tests/public-page.test.tsx > the public page > carries the name, the primary color and the welcome of the business
AssertionError: the ask button takes the fill of the settings: expected 'inline-flex items-center justify-cent…' to contain 'bg-[var(--primary)]'

 FAIL  tests/chat.test.tsx > the chat of the public page > paints the ask button and the accents with the primary color of the settings
AssertionError: the fill of the ask button: expected 'inline-flex items-center justify-cent…' to contain 'bg-[var(--primary)]'
```

The measured E2E red of the two pages is in the section "The red run of the browser" below.

### The fix

- `components/ui/Button.tsx` gains the variant `brand`: `bg-[var(--primary)] text-[var(--on-primary)]`. The kit keeps
  its own variants (`primary` is still the ink fill of the design system and `/kit` is untouched), and the fill of the
  business is the token pair the two public pages declare.
- `components/chat/Chat.tsx` turns the ask button into `<Button type="submit" variant="brand">` and paints two
  accents with the same variable: the left edge of the loading state (`border-[var(--primary)]`) and the hover of the
  source chips (`hover:border-… hover:bg-[var(--primary)] hover:text-[var(--on-primary)]`).
- `components/chat/Markdown.tsx` gives the `[n]` button inside the answer the same accent, so the chip of the answer
  and the chip of the source list behave alike.

The text over the fill is `--on-primary`, which `lib/public/brand.ts` computes with `textOn` so that it is legible on
the color the settings accepted.

```powershell
npx vitest run tests/chat.test.tsx tests/public-page.test.tsx tests/theme.test.ts tests/design-system.test.ts
npx playwright test e2e/public-chat.spec.ts -g "the color reaches the page"
```

```text
 Test Files  1 failed | 3 passed (4)
      Tests  the only failure is the red test of 10.3, still unfixed
```

```text
/: --primary is #ddf469, the ask button is rgb(221, 244, 105) with the text rgb(23, 23, 23), and with a business color rgb(29, 78, 216) with the text rgb(255, 255, 255)
/embed: --primary is #ddf469, the ask button is rgb(221, 244, 105) with the text rgb(23, 23, 23), and with a business color rgb(29, 78, 216) with the text rgb(255, 255, 255)
1 passed (3.2s)
```

Chromium now paints the primary color of the settings on the ask button of `/` and `/embed`, and follows it when the
variable carries the accepted business color of the fixture (`#1d4ed8`), with the legible text on top. Full logs:
`katalis-dev/tasks/_community-08-step10-102-green.log` and `_community-08-step10-102-e2e-green.log`.

## 10.3 `Escape` inside the iframe

### The reproduction of the review

```text
frames after Escape: 1
Expected iframe count: 0
Received: 1
```

### The red state, before the fix

`tests/widget.test.ts` runs the built script the way a browser runs it and dispatches the message a document inside the
iframe would post; `tests/chat.test.tsx` pins that the chat of `/embed` posts it to its parent and that the public page
posts nothing. Red at `b487ac1`:

```text
 FAIL  tests/widget.test.ts > the widget script > closes when the embed asks it to, and only through its own protocol and origin
AssertionError: its own embed closes it: expected <iframe …(4)></iframe> to be null

 FAIL  tests/chat.test.tsx > the chat inside the widget > asks its parent to close when Escape is pressed inside the iframe
AssertionError: expected [] to deeply equal [ { data: { …(2) }, target: '*' } ]
```

The E2E red, with the focus inside the iframe, is in the section "The red run of the browser" below.

### The fix

- `lib/widget/messages.ts` carries the one protocol of the two halves: `EMBED_SOURCE = "cited-embed"`,
  `CLOSE_TYPE = "close"` and `CLOSE_MESSAGE`.
- `components/chat/Chat.tsx` listens to `keydown` while it is the chat of `/embed` and, when the key is `Escape` and
  the document is framed, posts `CLOSE_MESSAGE` to its parent. The public page posts nothing.
- `lib/widget/script.ts` inlines the same object (the built file has no imports) and closes when a `message` arrives
  from its own origin and with that shape. Any other origin or any other shape is ignored; the focus returns to the
  button through the `close()` it already had.
- `public/widget.js` is rebuilt: 2466 bytes of the 5120 the decision allows.
- `docs/widget.md` says that `Escape` closes the widget from the page and from inside the chat.

```powershell
npm run build:widget
npx vitest run tests/widget.test.ts tests/chat.test.tsx
npx playwright test e2e/widget.spec.ts -g "Escape inside the iframe"
```

```text
wrote public/widget.js (2466 bytes)
```

```text
 Test Files  2 passed (2)
      Tests  22 passed (22)
```

```text
1 passed (1.9s)
```

Chromium opens the widget on the allowed origin, puts the focus on the question box inside the iframe, presses
`Escape`, finds no iframe and finds the focus back on the button. Full logs:
`katalis-dev/tasks/_community-08-step10-103-green.log` and `_community-08-step10-103-e2e-green.log`.

## 10.4 A tab opened from another starts its own session

### The reproduction of the review

```text
{"first":"8a679cd4-7d56-4ac4-a0ec-0bdfe732e2cf",
 "copied":"8a679cd4-7d56-4ac4-a0ec-0bdfe732e2cf"}
Expected copied not to be first
```

### The red state, before the fix

`tests/session-opened-tab.test.ts` pins the owner mark of the tab and the rule of `sessionId`; `e2e/public-chat.spec.ts`
opens a real second tab with `window.open` from the page and reads what the two tabs send. Red before this fix:

```powershell
npx vitest run tests/session-opened-tab.test.ts
```

```text
 FAIL  tests/session-opened-tab.test.ts > the mark of the tab > reads and writes its own mark inside window.name, next to what the page already carries
TypeError: tabOwner is not a function

 FAIL  tests/session-opened-tab.test.ts > the session of a tab opened from another > starts its own conversation although the session storage came copied
TypeError: tabOwner is not a function

 FAIL  tests/session-opened-tab.test.ts > the session of a tab opened from another > keeps the id the tab already carries when the mark says the tab owns it
TypeError: tabOwner is not a function
```

The E2E red of the opened tab, measured by Chromium, is in the section "The red run of the browser" below.

### The fix

- `lib/chat/session.ts`: `sessionId(storage, owner, create?)` believes the stored id only when the mark of the tab
  agrees with it, and writes both when it does not. `tabOwner(window)` is the mark `cited-tab=<id>` inside
  `window.name`, read and written next to whatever the page already carries there; a new tab of `window.open` inherits
  neither the mark nor, therefore, the thread.
- `components/chat/Chat.tsx` passes `owner ?? tabOwner(window)`, so the browser keeps its own mark and the tests can
  inject one.
- `tests/session.test.ts` and the test of the chat that kept a thread now hand the owner its mark: the id of the
  storage alone is no longer evidence of ownership, which is the defect the review reproduced. The assertions of both
  tests are the same as before.
- `docs/widget.md` says how the tab keeps its thread.

```powershell
npx vitest run tests/session.test.ts tests/session-opened-tab.test.ts tests/chat.test.tsx
npm run typecheck
npx playwright test e2e/public-chat.spec.ts -g "a tab opened from the page"
```

```text
 Test Files  3 passed (3)
      Tests  25 passed (25)
```

```text
✓ Types generated successfully
TYPE_CHECK_EXIT=0
```

```text
the opener tab carries 0c345a87-c0d5-4971-a9f4-491fb9c86b2e; the tab it opened carries e443dd8b-e0ae-4e78-8346-2d98e38dd93f and asked with e443dd8b-e0ae-4e78-8346-2d98e38dd93f
1 passed (2.9s)
```

The tab opened from the page carries its own id and asks with it, and the first tab keeps the thread it had. Full logs:
`katalis-dev/tasks/_community-08-step10-104-green.log`, `_community-08-step10-red-session.log` and
`_community-08-step10-104-e2e-green.log`.

## The red run of the browser, for 10.2, 10.3 and 10.4

One build of the branch with the fix of 10.1 only (the build type checks the tests, and the red tests of 10.1 do not
compile), served by `npm run start` with the deterministic providers, and one run of the three new browser tests before
any fix of the color, the `Escape` or the opened tab:

```powershell
npx playwright test e2e/public-chat.spec.ts e2e/widget.spec.ts -g "the color reaches the page|a tab opened from the page|Escape inside the iframe"
```

```text
/: --primary is #ddf469, the ask button is rgb(23, 23, 23) with the text rgb(255, 255, 255), and with a business color rgb(23, 23, 23) with the text rgb(255, 255, 255)
the opener tab carries 384f0183-bb2f-4ba9-9755-37c4c05bd9c9; the tab it opened carries 384f0183-bb2f-4ba9-9755-37c4c05bd9c9 and asked with 384f0183-bb2f-4ba9-9755-37c4c05bd9c9
  3 failed
    [chromium] › e2e\public-chat.spec.ts:133:5 › the color reaches the page: the ask button is painted with the primary color of the settings
    [chromium] › e2e\public-chat.spec.ts:193:5 › a tab opened from the page starts its own conversation
    [chromium] › e2e\widget.spec.ts:64:5 › Escape inside the iframe closes the widget and returns the focus to its button
```

The three reproductions of the review, measured by Chromium: the variable is declared and nobody paints it
(`rgb(23, 23, 23)` is the ink the button keeps); the tab opened from the page carries the id of its opener, which is
the `{"first": …, "copied": …}` of the review; and the iframe survives `Escape` (`frames after Escape: 1`). Full log:
`katalis-dev/tasks/_community-08-step10-red-e2e.log`.

## 10.5 The battery, and the round in the delivery

The whole battery of the branch with the four Major closed, on Windows 11 with Node v24.11.0, against the application
served by `npm run start` with the deterministic providers:

| Command | Result |
| --- | --- |
| `npm test` | 27 files, **277 tests, 0 failures**, exit 0 |
| `npm run typecheck` | `✓ Types generated successfully`, exit 0 |
| `npm run lint` | exit 0, no findings |
| `npm run test:e2e` | **15 tests, 0 failures**; axe 0 violations on `/` (24 rules), `/embed` (23) and `/kit` (21) |
| `node scripts/build-widget.mjs` | `public/widget.js`, **2466 bytes** (the bound is 5120) |
| `npm run secrets:scan` | 246 commits, 2.66 MB, `no leaks found` |
| `openspec validate --all --strict` | 9 passed, 0 failed (9 items) |
| `git diff --check main...HEAD` | exit 0 |

The three new end-to-end tests are green in the same run as the twelve that already existed, and the axe check of the
two public pages still reports no violation with the fill of the brand on the ask button. The suite went from 264 to
277 tests and the browser from 12 to 15.

One thing had to be corrected in the battery itself: the new widget test first served its site from the same port as
the first test of the file, and the tests of a file run in parallel, so one of them lost the port
(`EADDRINUSE: address already in use 127.0.0.1:3210`). The test now has its own allowed origin
(`http://127.0.0.1:3212`, named in `ALLOWED_ORIGINS` of `playwright.config.ts` next to the existing `3210`), which is
what `e2e/widget.spec.ts` already did for the refused site: one test, one port. With that, the whole file passes.

The round is written in `katalis-dev/tasks/entrega-community-08.md`, in Spanish, with its own `## Issues`, and
`LOOP_STATE.md` closes in `DONE`.

### The commits of this section

```text
a40927e Open the round of the review of Codex: LOOP_STATE in RUNNING
0850f7c Reproduce the four Major of the review with tests that are red at b487ac1
17a6182 Name the one prop of the language switch current, as the panel calls it
e3eef0c Paint the ask button and the accents with the primary color of the settings
8047f31 Close the widget from Escape inside the iframe, and only through its own protocol
8ab05c6 Give the tab the mark of its own window, so an opened tab starts its own thread
```

The closing commit carries this section, `LOOP_STATE.md` in `DONE` and the `[x]` of 10.5.
