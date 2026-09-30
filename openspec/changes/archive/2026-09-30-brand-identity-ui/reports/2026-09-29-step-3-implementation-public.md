# Step 3, public surface: the implementation (task 3.4, decisions 9 to 12 and the hooks of 17)

Implementer: Sonnet 5.5. Date: 2026-09-29. Paths are relative to the repository; `<worktree>` is the checkout of `community-ui`.

## Commits

| Commit | What |
|---|---|
| `65567b5` | `lib/i18n/public.ts` (new key `asked`: You asked / Preguntaste), `lib/public/brand.ts` (`branded`), `components/chat/Marker.tsx` (new), `CitationPanel.tsx` (excerpt in `.hl.hl-sweep`, `note-in`, close as secondary small, no side stripe), `Markdown.tsx` (lime numbered marks, `--i`, `landing`, 18 px / 1.6 / 65ch) |
| `fb7a2c2` | `components/chat/Chat.tsx` (headline, ledger, aside of sources, waiting bar, sticky ask, no switch), `app/page.tsx` (band, wordmark, switch, footer), `app/embed/page.tsx` (strip) |
| `fe73e3d` | the question and the ask button on one row on phones (the sticky form took too much of a 375 px screen when stacked) |

The pre-commit hook (gitleaks) ran on each commit:

```
INF scanned ~3327 bytes (3.33 KB) in 209ms
INF no leaks found
INF scanned ~8536 bytes (8.54 KB) in 183ms
INF no leaks found
INF scanned ~203 bytes (203 bytes) in 179ms
INF no leaks found
```

## Green

```
$ npx vitest run tests/chat.test.tsx tests/public-page.test.tsx tests/embed.test.tsx tests/markdown.test.tsx tests/i18n.test.tsx tests/brand-public.test.tsx   (<worktree>, at fe73e3d)
 Test Files  6 passed (6)
      Tests  76 passed (76)
```

Per file: `chat` 13, `public-page` 10, `embed` 2, `markdown` 10, `i18n` 9, `brand-public` 32.

Also green with them: `tests/brand-static.test.ts` (the bans, the keyframes and the tokens over `app/` and `components/`) and `tests/personal-paths.test.ts`.

```
$ npx vitest run tests/chat.test.tsx tests/public-page.test.tsx tests/embed.test.tsx tests/markdown.test.tsx tests/i18n.test.tsx tests/brand-public.test.tsx tests/brand-static.test.ts tests/personal-paths.test.ts
 Test Files  8 passed (8)
      Tests  107 passed (107)
$ npx eslint app/page.tsx app/embed/page.tsx components/chat lib/i18n/public.ts lib/public tests/brand-public.test.tsx tests/chat.test.tsx tests/public-page.test.tsx tests/markdown.test.tsx
(no output: clean)
$ npx tsc --noEmit
tests/brand-panel.test.tsx(41,35): error TS2345 ... (a file of the panel lane, not of this area; nothing in the public surface)
```

## What was built, by decision

- **9, the band.** `app/page.tsx` renders `main > header[data-public="band"]` across the page: `bg-[var(--primary)] text-[var(--on-primary)]` when a business is configured, `bg-ink text-paper` without one; `py-10 lg:py-14`; a row `max-w-[880px]` with the logo (when there is one), the name as the `h1` (32 px, 40 px from `lg`, Outfit 700) and `LanguageSwitch` at the end (`tone="brand"`, or `"ink"` on the ink band). Without a business the wordmark `lg` on ink (inside a `span aria-hidden`) is the visible name and the `h1` "Cited" is `sr-only`. `readPublicBrand` gained `branded: business !== null` for this; `name`, `hasLogo`, `primary`, `onPrimary` and `welcome` are untouched. The `main` keeps `--primary` and `--on-primary` inline. The footer keeps the one `img` named Katalis with the ink flame. The chat no longer renders a switch (the band owns it).
- **9, the headline.** `p[data-cited="welcome"]` with `rise`, 28 px (36 px from `lg`), `font-semibold`, `leading-[1.15]`, `tracking-[-0.02em]`, `max-w-[24ch]`, and `HighlightedTail` (`highlightLast`) with `sweep` on the last three words. In the embed the headline is 22 px.
- **10, the ledger.** Each turn is `li[data-cited="turn"]`: a `grid lg:grid-cols-[minmax(0,1fr)_220px]` with a hairline `border-t border-rule` above it; the label (`text-[11px] uppercase tracking-[0.18em] text-ink-2`, You asked / Preguntaste) and the question (18 px, semibold); `div[data-cited="answer"]` with `Markdown` (18 px, `leading-[1.6]`, `max-w-[65ch]`) whose marks are `citationMarkClass` buttons with the number, `--i` and `mark-land` only for the newest turn; the open citation as `CitationPanel` under the answer; the sources as `aside[data-cited="sources"]` (labelled by its visible "Sources" text) in the right column from 1024 px (`lg:col-start-2 lg:row-start-2`) and after the answer below. Each source is a button with a `CitationMark` (ink when open, the color of the business on hover through `group-hover`) and the document name, both `aria-hidden`, plus one `sr-only` text node `[n] document`, so its accessible name is unchanged. Refusal: `Panel[data-cited="refusal"]` with an ink square carrying an en dash (`components/chat/Marker.tsx`) and the label and text. Failure: `role="status"` beside a coral square with `!`; the coral side stripe is gone.
- **11, waiting and asking.** The wait is `div[role="status"]` with the text and, under it, a 2 px bar (`data-cited="waiting-bar"`, `bar h-0.5 bg-[var(--primary)]`) on a `bg-rule` track. The ask form is `form[data-cited="ask"]`, `sticky bottom-0 z-10 border-t border-rule bg-paper` (with the safe-area inset) once the thread exists or a question is loading; label, placeholder, `name="question"` and the `brand` button are unchanged. The input and the button share a row at every width.
- **12, the embed.** `header[data-public="band"]` with `py-4`, the primary color, the name at 18 px as the only `h1` and the switch in `tone="brand"`; the rest is the same `Chat` (`variant="embed"`), without the double padding it had before.

## Looked at on the dev server (`http://localhost:3300`, the business "Cafe La Horquilla" with a green primary)

Captured with a short Playwright script kept outside the repository (nothing committed): empty at 1440, 1024 and 375 in English and Spanish; an answer with an open citation at 1440, 1024 and 375; a refusal ("Do you sell submarines?") at 1440 and 375; a thread of three questions at 1440 and 375 (top and bottom); the embed at 420 px empty, waiting (a delayed `/api/ask`) and answered.

What I saw and fixed: at 375 the sticky form (label, input and button stacked) took about a fifth of the screen, so the input and the button now share a row. At 1024 the sources sit in the margin column, at 375 they follow the answer. The unbranded (ink) band was NOT looked at in a browser: the dev server has a business and I may not change its store; it is covered by the unit tests only.
