## Why

Franc, 2026-09-30, looking at the README on GitHub: "en el readme en voice usa el orb de elevenlabs". The teaser of the
voice agent (`docs/images/voice-teaser-*.png`) still draws the placeholder of `cited-identity-and-readme`: an Orb-like
sphere of SVG gradients with a sine wave on it, made before the voice agent existed. The voice agent now ships the real
Orb (`components/ui/orb.tsx`, the MIT Orb of ElevenLabs UI ported in this repository), so the teaser can show the thing
itself instead of a drawing of it, the same rule the captures of the panel already follow.

## What Changes

- `scripts/render-readme-orb.mjs` opens the voice panel of the test build (`npm run build:e2e`, the test SDK in place of
  `@elevenlabs/react`, no session with ElevenLabs), lets the agent speak, freezes the Orb with `prefers-reduced-motion`
  (the `reducedMotion` prop of the port) and shoots the same frame over black and over white. The two shots give back
  the alpha of every pixel exactly; of eight frozen frames it keeps the one with the least white, and writes
  `docs/images/voice/orb.png` with `docs/images/voice/orb.json` (component, colours, state, method).
- `scripts/readme-graphics/voice-teaser.html` lays that image where the SVG was; `scripts/render-readme-graphics.mjs`
  embeds it as a data URI (the pages are set with `setContent`) and drops the styles of the drawing.
- Both variants of the teaser are rendered again with `node scripts/render-readme-graphics.mjs voice-teaser`.

## Impact

- Files: the two scripts, the template, `docs/images/voice/orb.png`, `docs/images/voice/orb.json` and the two PNGs of
  the teaser. No code of the application, no dependency added (`sharp` is the optional library the graphics script
  already loads), no text of the README changes: its `alt` stays true.
