# Step 2, public surface: the unit tests first (task 2.1, the part of the public page)

Implementer: Sonnet 5.5. Date: 2026-09-29. Paths are relative to the repository; `<worktree>` is the checkout of `community-ui`.

Commit of the new test file: `3daa791` "Add the failing tests of the public surface: the band, the ledger, the waiting bar, the sticky ask and the embed strip".
Commit of the existing tests changed before the code (also red, see step 4): `a9c05b3`.
The pre-commit hook (gitleaks) ran on both:

```
INF scanned ~23851 bytes (23.85 KB) in 178ms
INF no leaks found
INF scanned ~1574 bytes (1.57 KB) in 177ms
INF no leaks found
```

## What `tests/brand-public.test.tsx` covers (32 tests)

| Group | Tests |
|---|---|
| The band (decision 9) | ink band with the wordmark `aria-hidden` at 56 px in paper text and a visually hidden `h1` when there is no business; band in `bg-[var(--primary)] text-[var(--on-primary)]` with the name as the only visible `h1` (32 px, 40 px from `lg`, bold) and the switch in the brand tone (`text-current`); the ink tone (`text-lime` for the chosen one) on the ink band; one single switch in the page, inside the band, in the language of the visitor; the logo inside the band; one `main`, the question box and the ink flame named Katalis in the footer; the welcome under the band as the headline (`rise`, 28/36 px, `font-semibold`, `leading-[1.15]`, `max-w-[24ch]`) with the last three words in `.hl.hl-sweep` |
| The embed strip (decision 12) | `data-public="band"` with `py-4` and the primary color, the name as the only `h1` at 18 px, the switch in the brand tone, one switch; same chat, no footer, `--primary` on the `main` |
| The ledger (decision 10) | the chat renders no switch; each turn is an `li data-cited="turn"` with the label You asked / Preguntaste (`text-ink-2 uppercase`) and the question in `font-semibold`; each mark is a lime button named Citation n with the number, `--i` staggering and `mark-land`; only the newest turn lands its marks; the sources are an `aside data-cited="sources"` named Sources inside the turn, one button per source named `[n] document` (a single text node) with a lime mark inside and 44 px on phones; the margin column classes (`lg:grid-cols-[minmax(0,1fr)_220px]`, `lg:col-start-2`); the open citation with `note-in`, the excerpt in `.hl.hl-sweep`, the document and the heading as `dt`/`dd`, the close as secondary small, `aria-expanded`, `aria-controls`, and the open marks ink with lime text; no heading `dt` when the passage has none; the refusal with an ink square carrying an en dash and no side stripe; the failure as a `status` beside a coral square and no side stripe |
| Waiting and asking (decision 11) | the wait keeps its words in a `status` and adds `data-cited="waiting-bar"` painted `bg-[var(--primary)]` with `bar` and `h-0.5`, under the text, gone when the answer arrives; the ask form is not sticky until the thread exists and then is `sticky bottom-0 border-t bg-paper`; the label, the name `question`, the placeholder and the single brand button that contains "ask" do not change; the welcome headline with `rise` and `.hl` |
| Markdown | the marks are numbered, staggered with `--i` across paragraphs and land only with `landing`; the answer reads at 18 px, line 1.6 and at most 75ch |
| The bans, over the six files of the surface | no `border-l/r/s/e-*`, no `animate-*`, no `@keyframes` or `animation:`, no `bg-clip-text` or `backdrop-blur` |

The scenarios that need a browser (computed colors, the sticky position at 375 x 812, contrast, axe) are the ones of `e2e/brand.spec.ts`, which I did not edit and could not run (see the notes of the final answer).

## Red, before any implementation

```
$ npx vitest run tests/brand-public.test.tsx          (<worktree>, at 3daa791)
     × is ink with the wordmark, and the h1 is visually hidden, when there is no business yet
     × carries the color of the business, its name as the only visible h1 and the switch in the brand tone
     × uses the ink tone of the switch on the ink band
     × holds the only language switch of the page, in the language of the visitor
     × shows the logo the panel serves inside the band
     × puts the welcome under the band as the headline with its last words in the highlighter
     × is a slim strip in the primary color with the name at 18px and the switch in the brand tone
     × keeps its size, the same chat and no footer
     × does not render the language switch: the band owns it
     × makes each turn an entry with the question under a label, in both languages
     × paints each mark of the answer as a lime button named Citation n, with the stagger variable
     × lands the marks of the turn that just arrived and no earlier one
     × lists the sources in an aside beside the answer, one mark per source and the name unchanged
     × puts the sources in a margin column from 1024px and after the answer below
     × opens the passage in the highlighter under the answer, with the note motion, and inks the open marks
     × shows a refusal with a square marker carrying an en dash, and no side stripe
     × shows a failure as a status beside a coral square, and no side stripe
     × keeps the words of the wait in a status and adds one bar painted with the primary color
     × does not stick the ask form until the thread exists, then sticks it to the foot with a rule
     × shows the welcome as the headline with the rise motion and the highlighter
     × numbers the marks, staggers them and lands them only when told to
     × reads at 18px with a line of 1.6 and a measure of at most 75 characters
     × components/chat/Chat.tsx has no side stripe, no animation of its own and no gradient text
     × components/chat/CitationPanel.tsx has no side stripe, no animation of its own and no gradient text
     × components/chat/Marker.tsx has no side stripe, no animation of its own and no gradient text
     × motion is only named through the classes of app/brand.css
⎯⎯⎯⎯⎯⎯ Failed Tests 26 ⎯⎯⎯⎯⎯⎯⎯
 Test Files  1 failed (1)
      Tests  26 failed | 6 passed (32)
```
