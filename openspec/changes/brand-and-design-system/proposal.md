## Why

Two defects of the first public face of Cited, found by Franc on 2026-09-29:

1. The README shows an invented Katalis logo (a "K" in a rounded square) at its foot, drawn by the render script,
   instead of the real Katalis flame that every Katalis product uses. The banner and the social preview carry no mark
   of the maker at all.
2. The app has no design system yet: the page is a bare heading. Every screen of the next changes (panel, public page,
   widget, voice) needs the same tokens, font and components as Construye, the reference Franc chose.

This is change 1 of the plan (`design-system-shared`), scoped so it does not wait for the licensing fix of
`@katalis/ui-tokens` (queue item 2j, which touches four other apps): Cited carries its tokens in the repository now and
moves to the shared package when v0.2.0 without licensed fonts exists.

## What Changes

- **The real flame.** `public/brand/` receives the Katalis flame copied byte for byte from Construye
  (`public/brand/katalis-logo-{64,192,512}.png`), plus an ink variant for light backgrounds rendered from the 512 px
  original by a committed script. The README foot, the banner and the social preview use the flame; the invented
  `docs/images/katalis-logo*.png` are deleted.
- **Design tokens** in `app/tokens.css`, reconciled with Construye's `app/globals.css`: ink `#171717`, lime `#DDF469`,
  coral `#FF6059`, the surfaces, the square corners, the motion curve `cubic-bezier(0.16,1,0.3,1)`, exposed to
  Tailwind v4 through `@theme`.
- **Outfit** (SIL Open Font License) self-hosted under `public/fonts/outfit/` with its license file, applied on `<html>`
  so every text uses it (the Construye defect of the font on `<body>` is not copied).
- **A small kit** in `components/ui/`: `Button` (primary, secondary), `Panel`, `Input`, `Chip`, `SectionTitle`, with a
  public `/kit` page that shows them, useful to anyone who forks.

## Impact

- New: `app/tokens.css`, `public/fonts/outfit/` with `OFL.txt`, `public/brand/katalis-flame-*.png`,
  `scripts/render-flame-variants.mjs`, `components/ui/*`, `app/kit/page.tsx`, their tests, `docs/design-system.md`.
- Changed: `app/layout.tsx` (font and tokens on `<html>`), the README foot and the two banners and the social preview,
  `docs/readme-assets.md`, the graphics records.
- Removed: `docs/images/katalis-logo.png`, `docs/images/katalis-logo-dark.png`.
- No licensed font enters the repository: Lufga stays out, as it must in a public repository.
