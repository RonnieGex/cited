# Step 3, foundation: tokens, brand.css, brand components and the kit (tasks 3.1 and 3.2)

Implementer: Sonnet 5.5. Date: 2026-09-29. Paths are relative to the repository; `<worktree>` is the checkout of `community-ui`.
Decisions 1 to 6, 13 and the parts of 17 that name these files.

| Commit | What |
|---|---|
| `fc33b85` | `app/tokens.css` (`--ink-2`, `--rule`, `--dur-fast/base/slow`, `--color-ink-2`, `--color-rule`), `app/brand.css` (`.hl`, `.hl-sweep`, `.mark-land`, `.note-in`, `.rise`, `.bar`, the five keyframes, the reduced-motion block), `app/globals.css` imports it |
| `69bd79b` | `lib/brand/highlight.ts`, `components/brand/` (`Wordmark`, `CitationMark`, `citationMarkClass`, `Highlight`, `HighlightedTail`, `index.ts`) |
| `0867d16` | `Button` `variant="ghost"` and `size="sm"`, `SectionTitle` eyebrow `text-ink-2`, `LanguageSwitch` `tone`, `state` prop of `CitationMark` |
| `4b8745a` | `app/kit/page.tsx`: three new sections and the six existing markers, and the comment line of `app/globals.css` |

Every commit passed the hook: `INF no leaks found` (the tests commit `21e7484` is in the step 2 report).

## Decisions taken while building (each is inside the interface of decision 17 or additive to it)

- `Highlight` and `HighlightedTail` (`components/brand/Highlight.tsx`) are additive: they are the `.hl` span and `highlightLast` in a component, so
  the screens do not hand-write the class. `CitationMark` also takes an optional `state: "rest" | "open"` (ink with a lime number, for the
  current place of the panel and the open source). The required props of decision 17 are unchanged.
- `citationMarkClass(state)` is the class of the interactive marks: the look of the static span plus the focus ring of the kit and
  `hover:bg-[var(--primary)] hover:text-[var(--on-primary)]`. Use it only where `--primary` is declared (the public page and the embed);
  the static `CitationMark` span has no hover, so the navigation of the panel (no `--primary`) cannot lose its fill.
- `.hl`, `.mark-land` and the other classes of `app/brand.css` are top-level rules, not inside a Tailwind layer, because `tests/brand-static.test.ts`
  reads the rules at the top level. Consequence: they beat Tailwind utilities on the same element (for example `.hl` fixes its own padding).
- The reduced-motion block is `*, *::before, *::after { animation: none !important; transition: none !important }` plus the highlighter at
  `100% 100%`: it also turns off the 400 ms colour transitions of the kit under `prefers-reduced-motion`, which is the intent of the spec.
- `Button size="sm"` is `px-4 py-2 max-lg:min-h-11`: 36 px on a laptop and 44 px on a phone (the panel E2E measures 44 px on the sign-out).
  `LanguageSwitch` buttons also get `max-lg:min-h-11` and `px-1`, and their chosen/other colours are now exclusive classes (before, `text-ink/60`
  and `text-ink` were both on the chosen one and the winner depended on the generated CSS order).
- The wordmark is a link only when `href` is given; its mark sits inside a `contents` span with `aria-hidden="true"`, so the accessible name is `Cited`.

## Tasks 3.1 and 3.2: the tests, green

```
$ npx vitest run tests/brand-foundation.test.tsx     (<worktree>, at 4b8745a)     Tests  54 passed (54)
$ npx vitest run tests/brand-static.test.ts                                        Tests  1 failed | 23 passed (24)
$ npx vitest run tests/design-system.test.ts                                       Tests  19 passed (19)
$ npx vitest run tests/i18n.test.tsx                                               Tests  9 passed (9)
$ npx vitest run tests/admin-i18n.test.tsx                                         Tests  3 passed (3)
$ npx vitest run tests/chat.test.tsx                                               Tests  13 passed (13)
$ npx vitest run tests/admin-ui.test.tsx                                           Tests  12 passed (12)
```

The single failure of `tests/brand-static.test.ts` is `has no colored side stripe`: `components/chat/Chat.tsx` and
`components/chat/CitationPanel.tsx` still carry the coral side stripe that decision 10 removes. Both belong to the public-page agent; no file
of the foundation is listed. The other 23 checks are green (keyframes, only transform/opacity/background-size, 150 to 700 ms, reduced motion
for every class, highlighter final state, tokens, `text-ink-2`, import order, the seven contrast ratios, no dependency, emoji, gradient text,
glassmorphism). No item of that test contradicts `design.md`.

No existing test changed: `tests/design-system.test.ts`, `tests/i18n.test.tsx`, `tests/admin-i18n.test.tsx`, `tests/chat.test.tsx` and
`tests/admin-ui.test.tsx` pass untouched. `e2e/design-system.spec.ts` was read (its `/kit` scenarios need one `Buscar` button, one textbox, one
`h1`, the lime focus ring of the primary button and axe; the new kit page keeps all of them) but not run, by the concurrency rule.

`npx tsc --noEmit` printed nothing (no type error in the worktree). `npx eslint app/kit lib/brand components/brand components/ui
components/i18n tests/brand-foundation.test.tsx`: no error, no warning.

## The kit on the dev server (http://localhost:3300/kit), read from captures, nothing committed

- 1440 px and 375 px: no console error, no horizontal scroll (`scrollWidth` 1440 and 375).
- The first capture showed the three wordmark sizes wrapping badly inside a half-width box; fixed to `lg:grid-cols-[3fr_2fr]` (in `4b8745a`) and
  re-captured: the three sizes sit on one row beside the ink box; at 375 px they wrap and stay legible.
- axe (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) run in Chromium against `/kit`: 0 violations, 22 rules passed, with motion allowed and with
  `prefers-reduced-motion: reduce`. Under reduced motion: 0 elements with an animation and both `.hl` at `100% 100%`. With motion allowed, 2
  elements animate (the two highlighters) and end at `100% 100%`; the citation mark paints `rgb(221, 244, 105)`.
- The dev server needed a content change in `app/globals.css` (a comment line) before it recompiled after `brand.css` appeared: a stale
  resolution error, not a defect of the files. The server was not restarted.

## Issues

- BROKEN: none in the foundation.
- RISK: `tests/brand-static.test.ts` stays at 1 failure until `components/chat/Chat.tsx` and `components/chat/CitationPanel.tsx` drop their
  side stripe (public-page agent).
- RISK: `citationMarkClass` hovers with `--primary`; a surface that is not the public page or the embed must use the static `CitationMark`
  (or its `state` prop), never the button class.
- NOT DONE: the browser E2E (`e2e/brand.spec.ts` kit scenarios, `e2e/design-system.spec.ts`) was not run here by the concurrency rule; the
  integration agent runs it in `community-e2e`. The contrast of the kit was verified with axe (which includes `color-contrast`), not with the
  E2E sampler.
- UNKNOWN: the mark inside the wordmark at 56 px looks heavy (1.3em of 0.72em); it follows decision 3 literally and was not changed.

## For the surface agents (what to use and what moved)

- `import { Wordmark, CitationMark, citationMarkClass, Highlight, HighlightedTail } from "@/components/brand"`; `highlightLast` in `@/lib/brand/highlight`.
- Classes of `app/brand.css`: `.hl`, `.hl-sweep`, `.mark-land` (set `style={{ "--i": index }}` on each mark), `.note-in`, `.rise`, `.bar`.
- Interactive marks: `className={citationMarkClass(open ? "open" : "rest")}` plus `data-brand="citation-mark"`.
- `Button size="sm"` and `variant="ghost"` exist; `LanguageSwitch tone="ink" | "brand"` exists.
- Nothing in `tests/chat.test.tsx` or `tests/admin-ui.test.tsx` moved because of the kit change.
