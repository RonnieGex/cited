# Browser validation

`node scripts/render-readme-graphics.mjs agents` -> 2 PNGs, 1280x680; exact source-text comparison, one highlight/chip and measured footer clearance >=36px. `npm run test:e2e` -> 96/96 passed (2.6 minutes). Renderers use Playwright with local fonts; images were visually inspected. The recorded reports and logs contain executed measurements. No Fable art/UX score is invented.
