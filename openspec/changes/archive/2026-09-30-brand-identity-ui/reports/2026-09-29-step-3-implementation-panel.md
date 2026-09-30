# Step 3, implementation: the panel workspace and the split sign-in (task 3.3)

Implementer: Sonnet 5.5. Date: 2026-09-29. Paths are relative to the repository; `<worktree>` is the checkout of `community-ui`.
Decisions 7 and 8 and the data hooks of decision 17 (`data-admin="sidebar"`, one switch, one sign-out, one `h1`).

| Commit | What |
|---|---|
| `253aaf6` | `lib/i18n/admin.ts` (`tagline`, `builtBy`, both languages), `components/admin/AdminNav.tsx` (the ink column / top bar), `components/admin/BuiltByKatalis.tsx`, `SignOutButton` as `ghost` `sm` |
| `d29e8eb` | `components/admin/AuthShell.tsx` (split shell), `app/admin/layout.tsx` (grid `240px 1fr`, sign-in and unconfigured in the shell), `LoginForm` without the `Panel`, `tests/brand-panel.test.tsx` (the `String.raw` fix of the regex) |
| `ec52194` | quiet marks with a hairline ring, current section scrolled into view on a phone |
| `dcd6381` | polish of the pages (below), a reachable scrolling table, `params` in the test call for `tsc` |

Every commit passed the hook: `INF no leaks found`.

## What was built

- `AdminNav` is one `aside[data-admin="sidebar"]` at every width, so there is exactly one switch and one sign-out. From 1024 px it is
  `sticky top-0 h-screen`, 240 px wide (the layout is `lg:grid lg:grid-cols-[240px_1fr]`); below it is an ink bar: wordmark, the list
  in a `nav` with `overflow-x-auto`, then switch and sign-out in one row (the flame line is hidden there). The links are an `ol` of
  `Link` with a `CitationMark` (number) and the name; `aria-current="page"` from `usePathname` (`/admin` only on itself, sections
  on their own path and below); current: paper text, `bg-paper/10`, the mark `state="open"` (ink with a lime number and a lime
  hairline ring); others: `text-paper/80` with the mark transparent, `text-paper/60` and a paper hairline ring. 44 px of height
  on phones (`max-lg:min-h-11`), lime focus outline drawn inside the link because the scroller would clip an outside outline.
- The foot: `LanguageSwitch tone="ink"` inside `data-testid="language-switch"` (only the switch is inside it now), the sign-out as
  `ghost sm`, and the silver flame `/brand/katalis-flame-64.png` with `Built by Katalis` in `text-paper/70`.
- `AuthShell` is the shell of the sign-in and of the unconfigured page: `main[data-admin="auth"]`, `lg:grid-cols-2`, ink half
  (wordmark `md`, `p[data-admin="tagline"]` with the last three words in `.hl .hl-sweep`, the flame line), paper half with the
  content in `max-w-[420px]`. `LoginForm` keeps its form, labels, names and messages, minus the `Panel` frame; the unconfigured
  content keeps its `Panel`, `h1` and message.
- Polish of the pages, styling only: table heads as the small ink-2 uppercase eyebrow, `tabular-nums` on numbers and dates, the
  row buttons of Documents as `size="sm"`, the buttons of the business form and Conversations `self-start` instead of a full-width
  bar, the logo panel and the chip narrower, the fields 560 px, the chips of the setup page lime with an ink border when set
  ("Set"/"Puesta") and ink-2 when missing (the state is still told in words), and the table panel of Conversations is a focusable
  labelled region (axe `scrollable-region-focusable` failed at 375 px without it).

## Verification

From `<worktree>`:

```
npx vitest run tests/admin-*.test.ts tests/admin-*.test.tsx tests/brand-panel.test.tsx
 Test Files  11 passed (11)
      Tests  87 passed (87)
npx eslint components/admin app/admin lib/i18n/admin.ts tests/brand-panel.test.tsx      (no output)
npx tsc --noEmit -p . | grep -E "components/admin|app/admin|lib/i18n/admin|brand-panel"  (no output)
```

Also the same files plus `tests/brand-static.test.ts` and `tests/design-system.test.ts`: 13 files, 130 tests passed (the bans over
`app/` and `components/`: no side stripe, no gradient text, no emoji, no glassmorphism).

Read on the dev server (`http://localhost:3300`, a throwaway Playwright script outside the repository, the password read from
`.env.local` and never printed), English and Spanish, 1440 and 375 px:

- sign-in in Spanish: one match of `Cada respuesta enseña de dónde salió.`, one `.hl` inside it, one `h1`, axe AA: no violations
  at 1440 and at 375 (`color-contrast` is reported as incomplete because of the lime block over a gradient image, see the notes);
- signed in, `/admin/documents` at 1440: column `rgb(23, 23, 23)`, box `[0, 0, 240, 900]`, content starting at x = 360, four links
  `1Setup`, `2Business`, `3Documents`, `4Conversations` with `aria-current` only on Documents, the current mark's number
  `rgb(221, 244, 105)` (lime), one switch, no horizontal scroll (1440 / 1440), one link named /Documents/ that is current;
- at 375: bar `[0, 0, 375, 181.6]` ink, the `nav` is `overflow-x: auto`, every link 44 px high, sign-out 44 px, one switch, no
  horizontal scroll (375 / 375);
- axe AA on `/admin`, `/admin/business`, `/admin/documents`, `/admin/conversations` at 1440 and 375: no violations (after the
  region fix on Conversations).

Reading of `e2e/admin.spec.ts` and `e2e/admin-brand.spec.ts` against the markup (they were not run): the single `getByRole("status")`
and the single `Español` button still hold (no new `role="status"`, one switch); the leaf whose text is `3` inside the link is the
mark itself (no wrapper with the same text), so its computed colour is lime; the `h1` is unique on every page; the link named
`/Documents/` and current is one; the setup, business, documents and conversations selectors do not touch the markup that changed.
The contrast sampler of the E2E was not run either: by hand the quiet numbers are 7.0:1 (`text-paper/60` over ink), the names 12:1
and the foot text about 9:1.

## Decisions taken while building

- The wordmark on the sign-in is not a link (a link to `/admin` from the page that is `/admin` is a loop); in the column it links to `/admin`.
- The tagline highlighter on ink is a solid lime block with ink text (`style` with `linear-gradient(var(--lime), var(--lime))`,
  which wins over the unlayered `.hl`): the marker of `.hl` under paper text would put paper text over lime, 1.1:1.
- The quiet marks use `bg-transparent!` and `text-paper/60!` because `CitationMark` already carries `bg-lime text-ink` and two
  utilities of the same property are ordered by the generated CSS, not by the class list.
- "Hecho por Katalis" in Spanish (the public page keeps "Built by Katalis" in both languages; the panel is complete in Spanish).
