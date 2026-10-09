# Design

## Fixed decisions
1. Derive TOOL RESULT · CITED_ASK EXCERPT from the same canonical cited_ask result. Display exactly two logical lines: source chip `1` followed by ` · cafe-la-horquilla.md · Precios (position 2)`; then `Afinación de bicicleta: 380 pesos.` with the existing lime highlight. Remove the Sources: line, standalone Precios heading and other price rows from this image only. The linked transcript remains complete and byte-identical.
2. Set the excerpt to Outfit 20px with line-height 1.35. Both logical lines must fit without wrapping at the existing canvas dimensions. Preserve the complete question and exact first answer paragraph.
3. Set margin-top to 22px on each of the three proof eyebrows: QUESTION · ORIGINAL SPANISH, ANSWER EXCERPT and TOOL RESULT · CITED_ASK EXCERPT. Remove the tool-result border-top and padding-top that create its extra hairline/gap. Set proof column padding-top to 22px. The header eyebrow stays unchanged.
4. Set every right-column client row to padding 24px 0, including the first row; remove its old first-child padding override. Keep the existing grid proportions and 52px gap. In both themes, the absolute difference between the bottom of the left excerpt and the bottom of the last right row content must be at most 70px. Measure actual content bounding rectangles, not stretched grid container bottoms. This is a verification threshold, not permission for unrelated layout changes.
5. Keep the 1280x680 canvas, at least 36px legend clearance from the bottom, status SVGs, verification claims, safe answer Markdown and local fonts. Remove the orphan period after the source chip in generated markup. Source metadata is derived from the canonical result; no invented source text.
6. Modify only the agents template, related renderer/assertions/tests, two agents PNGs and maintenance docs. No README prose edits and no unrelated graphics changes. Preserve PR #18's dependency on dsh-cited PR #1.

## Validation
Add failing regressions before edits. Update the old full-source-list equality check to assert exactly the two source-derived lines, 20px computed font, all three computed 22px margins, no result border, 24px row padding, <=70px column-end difference, no wrapping/clipping and >=36px legend clearance. Render both themes with node scripts/render-readme-graphics.mjs agents and inspect the actual PNGs. Run existing unit/lint/type checks and frontend E2E under Node 24.21.0, agent-executed local curl, read-only database snapshots before/after and final-SHA PR #18 CI. No model call or product runtime change.

## Supersession
R5 replaces R4's Sources: prefix and complete returned price-list rendering inside the agents graphic with the explicitly labeled two-line excerpt. The archived R4 contract remains historical; active agent-presentation-r4 requirements are updated through this change's delta. All unrelated R4 requirements remain in force.
