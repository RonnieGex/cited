# Design

## Fixed decisions
1. Keep the original Spanish question in full under QUESTION · ORIGINAL SPANISH, followed by ANSWER EXCERPT without the repeated language suffix. The answer is exactly the first paragraph from canonical attempt-2, rendered safely in Outfit.
2. Remove the separate Passage 1 panel. The source column becomes TOOL RESULT · CITED_ASK EXCERPT, derived from the same result, with Sources: followed by chip 1, document, heading and position 2. Highlight only the exact returned bicycle tune-up price line in lime. The result excerpt may omit the answer text already shown in the answer column; it must label itself as an excerpt and preserve the returned source list.
3. Set the agents canvas to 1280x680 and bottom padding to at least 36px. Keep the status legend text inside this padding. Remove the in-image Markdown/transcript note because an image cannot contain the promised link. Preserve roadmap SVG status marks and all verification distinctions.
4. In each README order the section: MCP feature introduction, token command, image, compatibility table, plugin installation, one closing provenance paragraph. That paragraph contains the answer's source, bold two-of-three supported-price result, keyword search without embeddings, English retrieval refusal and false-claim context, transcript/compatibility links and a complete Markdown sentence.
5. English Markdown sentence: "The graphic renders the Markdown; the transcript keeps it raw." Spanish: "El gráfico muestra el Markdown con formato; la transcripción conserva el original." Exact agent and Cited model slugs reside in linked compatibility evidence.
6. Preserve separate DeepSeek MCP/native-plugin rows, concrete evidence links and "Merge after RonnieGex/dsh-cited#1" in PR #18.

## Validation
Use Node 24; add failing regressions before implementation, then review existing README tests and run the complete unit suite. Read-only sample database snapshots must precede and follow validation and retain every table's count/hash. No new model calls are justified by presentation changes. Use agent-executed curl on local built graphics/evidence and authenticated/unauthenticated MCP checks with secrets through stdin. Render both themes with node scripts/render-readme-graphics.mjs agents and use Playwright to verify canvas bounds, legend margin, local font requests and no clipping. Existing frontend E2E/CI must remain green. Record exact commands in the change reports and update docs/readme-assets.md and docs/development-guide.md.

## Contract supersession
R4 replaces the historical 1280x640 decision, Answer excerpt · original Spanish label, in-image Markdown note and separate-passage-panel interpretation. It preserves source fidelity, no unsupported verification claims and the full raw transcript.
