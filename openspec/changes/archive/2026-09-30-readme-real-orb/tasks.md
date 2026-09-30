Contract from Franc's own words (2026-09-30): "en el readme en voice usa el orb de elevenlabs". Written and carried out
by Claude in the session of the landing, at Franc's direct request; the adversarial review is still to be done (see the
report). A task is `[x]` only with evidence in `reports/2026-09-30-readme-real-orb.md`.

## 0. Step 0: the branch

- [x] 0.1 `feature/readme-real-orb`, created from `origin/main` at `8b0c77f`

## 1. The capture

- [x] 1.1 `scripts/render-readme-orb.mjs`: the panel of the test build, the agent speaking, eight frames frozen by
      `prefers-reduced-motion`, each shot over black and over white, a frame that still moves refused, the one with the
      least white kept; writes `docs/images/voice/orb.png` and `docs/images/voice/orb.json`

## 2. The teaser

- [x] 2.1 `scripts/readme-graphics/voice-teaser.html` lays the image where the SVG was; the graphics script embeds it
      and drops the styles of the drawing
- [x] 2.2 `node scripts/render-readme-graphics.mjs voice-teaser` renders both variants and passes its own checks

## 3. Checks

- [x] 3.1 `npx vitest run` (the README and design-system suites included), `npx eslint` on both scripts,
      `openspec validate --all --strict`, gitleaks on the staged files

## 4. Review and archive

- [ ] 4.1 Adversarial review of the change by a session that did not write it (not done: Franc accepted and asked for
      the merge before it)
- [x] 4.2 Franc accepts; archive the change (Franc, 2026-09-30, on pull request 3: "acepto, fusiona")
