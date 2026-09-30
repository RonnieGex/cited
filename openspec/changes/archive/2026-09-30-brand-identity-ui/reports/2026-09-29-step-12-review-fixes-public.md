# Step 12, review fixes: public area

Branch `feature/brand-identity-ui`. The area covers `app/page.tsx`, `app/embed/page.tsx`, `components/chat/`,
`lib/i18n/public.ts`, `lib/public/`, the public unit tests and `e2e/public-chat.spec.ts`, `e2e/widget.spec.ts` and
`e2e/home.spec.ts`. I read `PRODUCT.md`, `design.md` and the three spec deltas before changing anything.

## Commits

| Commit | What |
| --- | --- |
| `5832484` | Add the failing tests of the public findings of the step 12 review (`tests/brand-public.test.tsx`) |
| `ab64483` | Paint the embed strip ink when there is no business yet (`app/embed/page.tsx`) |
| `4375005` | Keep the focus, the question and the new entry in view on the public chat (`components/chat/Chat.tsx`, `components/chat/Markdown.tsx`, `lib/i18n/public.ts`, `tests/markdown.test.tsx`) |
| `b72cf2f` | Add the E2E cases of the public findings (`e2e/public-chat.spec.ts`, `e2e/home.spec.ts`) |

Gitleaks ran in the hook on each commit and printed `no leaks found` every time, for example:

```
INF 0 commits scanned.
INF scanned ~10285 bytes (10.28 KB) in 215ms
INF no leaks found
```

## Tests first

Baseline before any change:

```
$ npx vitest run tests/chat.test.tsx tests/public-page.test.tsx tests/embed.test.tsx tests/markdown.test.tsx tests/brand-public.test.tsx
 Test Files  5 passed (5)
      Tests  68 passed (68)
```

The fourteen new cases go in the `describe("the review of step 12")` block of `tests/brand-public.test.tsx`. Red run
with the new cases, before the fix:

```
$ npx vitest run tests/brand-public.test.tsx
      Tests  13 failed | 34 passed (47)
AssertionError: the focus is back on the mark, not on the body: expected <body><div>…(1)</div></body> to be <button …>
AssertionError: expected <body><div>…(1)</div></body> to be <button type="button" …(2)>…(2)</button>
AssertionError: expected <div id="citation-_r_19_" …(4)>…(3)</div> to be null          (Escape does not close)
AssertionError: the live region exists before any question: expected null not to be null
AssertionError: the pending entry: expected null not to be null
AssertionError: expected "vi.fn()" to be called with arguments: [ { block: 'nearest' } ]
AssertionError: expected 'flex items-stretch gap-3' to match /(^|\s)flex-col(\s|$)/
AssertionError: expected <p data-cited="welcome" …(1)>…(1)</p> to be null
AssertionError: no longer inside the answer column: expected <div data-cited="answer" …(1)>…(2)</div> to be null
AssertionError: expected 'bg-[var(--primary)] py-4 text-[var(--…' to contain 'bg-ink'
```

The fourteenth case, "keeps the welcome of the public page and its visible label once the thread exists", is a guard
that the widget-only changes stay in the widget, so it was green from the start. On the first red run the test "gives
the focus back to the source" passed for the wrong reason: the click on Close never moved the focus. I fixed the test so
that it focuses Close before clicking it, and then it failed as it should.

One existing assertion changed. In `tests/markdown.test.tsx`, `expect(onCitation).toHaveBeenCalledWith(1)` became
`toHaveBeenCalledWith(1, marker)`. The handler now also receives the mark that was pressed, so that the chat can give
the focus back to it. The new assertion checks more than the old one did.

Green, after the fix:

```
$ npx vitest run tests/chat.test.tsx tests/public-page.test.tsx tests/embed.test.tsx tests/markdown.test.tsx tests/brand-public.test.tsx
 Test Files  5 passed (5)
      Tests  82 passed (82)
$ npx tsc --noEmit -p .        (no output)
$ npx eslint components/chat app/page.tsx app/embed/page.tsx lib/i18n/public.ts tests/brand-public.test.tsx tests/markdown.test.tsx e2e/public-chat.spec.ts e2e/home.spec.ts        (no output)
```

## Measured on the dev server

The dev server on :3300 had used up its 30 questions per hour (`429 ... more than RATE_LIMIT_PER_IP_PER_HOUR (30)`).
So I used a Playwright script outside the repository that mocks `/api/ask` in the page, the same way
`e2e/brand.spec.ts` does. It asks four questions, presses Tab 40 times from the top of the page and measures how much of
each focused element the sticky form covers. Then it opens `Citation 2` with Enter, tabs to Close, and presses Enter
and Escape.

| Page and size | Focused elements under the form | Close under the form | Focus after Close | Focus after Escape | Last answer top < form top |
| --- | --- | --- | --- | --- | --- |
| `/` 1440x900 | none | 0% (698-736, form 777) | `Citation 2` | `Citation 2` | 580 < 777, every time |
| `/` 1024x768 | none | 0% (566-604, form 645) | `Citation 2` | `Citation 2` | 448 < 645 |
| `/` 375x812 | none | 0% (548-592, form 633) | `Citation 2` | `Citation 2` | 275 < 633 |
| `/embed` es 335x560 | none | 0% (336-380, form 421) | `Cita 2` | `Cita 2` | 34 < 421 |
| `/embed` es 400x560 | none | 0% | `Cita 2` | `Cita 2` | 62 < 421 |

Other measurements from the same script:

- The field on phones is 327 px wide at 375 and 272 px at 320. In the 335 px embed it is 303 px, up from 184, 129
  and 161 px.
- Opening source 2 at 375 in Spanish moves that source to y 282. The passage then takes 342-617, above the form at 633.
- The live region reads `Answer with 2 sources` and `Respuesta con 2 fuentes`.
- A failed request (mocked 500) shows `TRY AGAIN` under the kept question. Pressing it turns the entry into the pending
  entry with the question and the waiting bar. The live region then reads
  `Question sent. Looking it up in the documents.`
- The flame check of `e2e/home.spec.ts`, run with the same logic against :3300: `/` en `Built by Katalis` and `/` es
  `Hecho por Katalis` each have a flame. `/embed` shows no signature in either language.
- No console error or warning came up on `/` while asking and opening a passage.

I opened these PNGs with the Read tool: the thread at 375, the embed at 335, the source passage at 375 es, the empty
page at 320 es, the open passage at 1440, the failure and the pending entry at 375.

## Findings

1. **accessibility major: the sticky form hides the focused element (2.4.11).** Fixed in `4375005`. While the form is
   sticky, `Chat` sets `scroll-padding-bottom` on `<html>` to the height of the form plus 16 px. A ResizeObserver
   updates it when the form changes size, and it is cleared when the thread goes away. Focus scrolling and
   `scrollIntoView` now stop above the form. The unit test checks that the value is set and then cleared. The E2E test
   in `e2e/public-chat.spec.ts` tabs through a four-answer thread at 375x812 and asserts that no focused element
   overlaps `[data-cited=ask]`. The table above has the measurements.
2. **accessibility major: closing a citation loses the focus, and Escape does nothing.** Fixed in `4375005`.
   `AnsweredTurn` remembers the mark or source that opened the passage (`Markdown` now passes the pressed button). Close
   gives the focus back to it. Escape inside the entry closes the passage and gives the focus back the same way. In the
   widget, the Escape that closed a passage no longer closes the frame too: the entry calls `preventDefault` and the
   frame listener skips an event whose default was prevented. Three unit tests and the E2E test cover it.
3. **accessibility major: no live region for answers.** Fixed in `4375005`. A `<p role="status" aria-live="polite"
   class="sr-only" data-cited="announcer">` is present from the first render. It says
   `Question sent. Looking it up in the documents.` while the answer loads, then `Answer with N source(s)`,
   `Not in the documents: <answer>` or `No answer. <message>`, and the same in Spanish. The visible `role="status"`
   blocks stay, because decisions 10 and 11 require them. The announcer uses different wording, so no text appears twice
   in the DOM.
4. **critique major: new answers land below the fold, and the waiting block sits after the list.** Fixed in `4375005`.
   The question becomes a pending entry of the ledger (`li[data-cited="pending"]`) that contains the waiting status and
   bar. After a question is sent and after its answer lands, that entry is scrolled into view with
   `{ block: "nearest" }`, and the reserved scroll padding keeps it above the form. The pending entry does not use
   `data-cited="turn"`, so `toHaveCount` in `e2e/brand.spec.ts` still counts only finished turns.
5. **critique major: the question disappears while waiting and a failure has no retry.** Fixed in `4375005`. The pending
   entry shows the question. A failed entry keeps its question and gets a `Try again` / `Intentar de nuevo` button
   (`variant="secondary" size="sm"`) that asks the same question again, and the answer replaces the failed entry. When
   the button is activated from the keyboard, the focus moves to the question field. A tap leaves the focus alone, so a
   phone does not open its keyboard.
6. **critique major: Close is hidden behind the form, and the passage is cut at 1024.** Fixed in `4375005`, together
   with finding 1. An opened passage is also scrolled into view with `{ block: "nearest" }`. At 1024x768, Close sits at
   566-604 and the form starts at 645.
7. **critique major: the field and the button share one row on phones, so the placeholder is cut.** Fixed in
   `4375005`. The row is now `flex flex-col gap-3 sm:flex-row sm:items-stretch`, and the button is
   `w-full shrink-0 sm:w-auto` without `max-sm:px-5`. This reverses `fe73e3d`, which had put them on one row to save
   height. The reserved scroll padding and the smaller widget chrome (finding 10) make up for the extra height. At 320
   the longest Spanish placeholder still loses its last word ("de bicicleta?"), and the field is 272 px wide instead of
   129.
8. **critique major: the highlighter lands on "and workshop policies."** Not fixed, because it contradicts the design.
   Decisions 4 and 17 give the rule and the interface: `highlightLast` wraps the last three words when the text has six
   or more, and the welcome headline carries it. `lib/brand/highlight.ts` and `HighlightedTail` belong to the foundation
   area. Skipping a leading function word, or letting the owner mark the phrase, would be a change to the design for
   Fable to decide.
9. **critique major: `max-w-[24ch]` sometimes locks to the fallback font.** Not fixed, because it contradicts the
   design. Decision 9 names the class `max-w-[24ch]`, and `tests/brand-public.test.tsx` checks it. I also saw the
   four-line wrap at 1440 on the dev server. The cause the review found is that the font loads without a preload
   (`app/tokens.css`, `font-display: swap`). A `<link rel="preload">` in the layout would fix it without touching the
   measure, but the tokens and the layout belong to the foundation area. The alternative, switching to `em`, needs a
   change to the design first.
10. **critique major: the widget chrome takes up the frame.** Fixed in `4375005`. For `variant="embed"`, once the
    thread exists the welcome is no longer rendered, the label becomes `sr-only` (the `<label>` and its text stay), and
    the form uses `pt-3` and `pb-[max(0.75rem,env(safe-area-inset-bottom))]`. The button stacks under the field (finding
    7) and the new entry is scrolled into view (finding 4). The public page keeps its welcome and its visible label; a
    unit test guards that. At 335x560 the form starts at 421 and the last answer at 34.
11. **critique major: on a phone, a source opens its passage above itself.** Fixed in `4375005`. `CitationPanel` now
    comes after the sources `aside` in the DOM, inside a cell `min-w-0 lg:col-start-1 lg:row-start-3`. On a phone it
    opens below the source that was pressed. From 1024 px it takes the row under the answer, which matches decision 10.
    The tab order follows the DOM: mark, sources, then Close. It is scrolled into view when it opens.
12. **compliance major: the `/kit` paragraph names Katalis without a flame, and the E2E does not cover every route.**
    Only partly in my area. `app/kit/page.tsx` and `e2e/brand.spec.ts` belong to other areas, so the `/kit` paragraph
    is still unfixed. In `b72cf2f` I added the check for the two public documents to `e2e/home.spec.ts`: `/` and
    `/embed`, in `en` and `es`. It ignores `script`, `style`, `noscript` and `template`: the router payload contains
    the meta description "Cited, by Katalis", which a first version of the check flagged on the dev server.
13. **compliance major: `/embed` without a business paints its band lime.** Fixed in `ab64483`. It now works like
    `app/page.tsx`: `bg-ink text-paper` and `LanguageSwitch tone="ink"` when `brand.branded` is false, and the brand
    tone otherwise. A unit test covers it. On :3300 a business exists, so there the band stays `rgb(31, 95, 74)`.
14. **engineering major: the sticky form hides the focused element.** This is the same defect as findings 1 and 6, and
    the same change fixes it. I did not add the rule to `app/brand.css`, which is outside my area. The padding is set
    from `Chat`, measured from the real form, and only while the form is sticky. The E2E test they asked for (Tab to the
    last Close at 375x812 and check that it ends above the form) is in `e2e/public-chat.spec.ts`.

## Issues

- **BROKEN:** none known in this area.
- **RISK:** The rules of this step did not allow me to run the new E2E cases in Playwright. The reintegration agent
  runs them. I ran the same logic against :3300 with scripts outside the repository and it passed (tables above).
- **RISK:** On screen readers that do announce a `role="status"` inserted together with its text, the wait and a
  failure can be read twice: once by the announcer and once by the visible status that decisions 10 and 11 keep.
- **NOT DONE:** finding 8 (design decisions 4 and 17, foundation area), finding 9 (design decision 9 and its test,
  foundation area) and the `/kit` half of finding 12 (kit area).
- **UNKNOWN:** How `scroll-padding` behaves on Safari when focus moves. The measurements were taken in Chromium only.
