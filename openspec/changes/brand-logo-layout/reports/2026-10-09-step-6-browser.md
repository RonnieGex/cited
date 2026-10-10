# Browser and visual validation

`node scripts/render-readme-graphics.mjs agents` -> exit 0, four EN/ES light/dark PNGs. Measured row heights: 168.578125 / 168.59375 / 168.59375 px; equal intervals within 0.02 px; column top/bottom difference 0 px; legend count 0; footer clearance 36 px. Full geometry output is versioned in step-2-render.txt. `npm run test:e2e` -> exit 0, 96/96 passed. The changed graphics were visually inspected in both themes and languages.
