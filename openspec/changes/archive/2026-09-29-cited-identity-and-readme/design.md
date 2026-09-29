## Context

Change 2 (`core-hybrid-search`) is merged: ingestion of PDF, DOCX, Markdown and text with limits, passages with their
heading, embeddings through an OpenAI-compatible API, Ollama or a deterministic fake, hybrid search on libSQL (FTS5 and
native vectors) fused with Reciprocal Rank Fusion, a remote libSQL database with its token, and the `ingest` and
`search` scripts. The answer with an LLM, the panel, the public page, the widget and the voice agent are the next
changes of the plan (`tasks/plan-rag-abierto.md`, section 7). The repository is private until the launch.

The Construye README of `docs-readme-visual-identity` is the model for the head: the banner is the `<h1>`, badges,
navigation, all of it checked by a contract test. Cited follows the same discipline with its own identity.

## Decisions

1. **The name in the repository.** `Cited` as the product, `Katalis` as the maker. The package name is `cited`. The
   old name disappears from every tracked file except the archived changes; the paid service `Katalis Responde` can be
   named as such where the docs contrast the two.
2. **The banner.** `scripts/render-readme-banner.mjs` renders `scripts/readme-banner.html` with Playwright at
   1280 × 320 in two variants and writes the two PNGs and `docs/images/readme-banner.json`.
   - The wordmark is `Cited` in Outfit (OFL, the free font Franc chose for the public edition), with a superscript
     citation mark `[1]` in lime `#DDF469`: the mark of the product is the citation.
   - Under it, the tagline: `Ask your own documents. Get the passage and where it came from.` and, smaller,
     `by Katalis`. (Amended by Fable after `revision-community-03.md`: the first tagline promised "answers" with "the
     page", but the answer is planned and the passages keep their document, heading and position, not a page.)
   - Dark variant: ink `#171717` background, off-white text. Light variant: off-white background, ink text, the lime
     mark with an ink outline so it stays visible.
   - The script loads Outfit from Google Fonts at render time; no font file is added in this change (the design system
     change adds Outfit with its license).
3. **Head of the README, in order.** The `<h1>` banner; the tagline as a centered line; the badges (license
   Apache-2.0, Node, Next.js, TypeScript, libSQL, status `early development`, and the CI workflow badge, which renders
   only for readers with access while the repository is private); the language switch `English · Español`.
4. **Body, in order.**
   - `Why Cited`: three reasons, each one sentence: answers only from your documents; every answer shows its source;
     text today and voice with ElevenLabs next. The third says "next", because the voice agent is planned.
   - `Status`: the table of decision 5.
   - `How it works`: the flow graphic of decision 8, then the Mermaid version of the same flow inside `<details>`, its
     planned nodes carrying `(next)` in their label.
   - `See it answer`: the demo graphic of decision 8, right before the quick start that reproduces it.
   - `Roadmap`: the roadmap graphic, next to the status table; `Voice`: the teaser, marked `Next`.
   - `Quick start`: `npm ci`, `cp .env.example .env`, `npm run ingest -- samples/`, and one `npm run search` with the
     deterministic provider, plus the expected shape of the output.
   - `Configuration`: a table of the variables the owner sets today and the ones reserved for the next changes, with
     what each one is for and `read today: yes/no`.
   - `Security`: keys only in the server environment, the private reporting channel of `SECURITY.md`, the threat model
     in `docs/security.md`.
   - `Contributing`: OpenSpec, `CONTRIBUTING.md`, the checks that must pass.
   - `License`: Apache-2.0, `LICENSE`, `NOTICE`, then the centered footer with the 64 px Katalis logo and
     `Built by Katalis`.
5. **The status table.** Rows, with their state and their link:
   - Ingestion of PDF, DOCX, Markdown and text with limits — Available — `openspec/specs/knowledge-search/spec.md`
   - Hybrid search (full text and vectors, RRF) — Available — same spec
   - Embeddings through an OpenAI-compatible API or Ollama — Available — same spec
   - Local libSQL file or Turso — Available — same spec
   - Answers with citations from any model provider, spend limits — Planned — `pluggable-models-and-ask`
   - Admin panel, public page and widget in Spanish and English — Planned — `admin-and-public-ui`
   - Voice agent with ElevenLabs, created in one click — Planned — `elevenlabs-voice-agent`
   - Shared design system — Planned — `design-system-shared`
   - Security hardening and abuse tests — Planned — `security-hardening`
   - One-click deploys, Docker image and bilingual docs — Planned — `docs-deploy-and-launch`
6. **The Spanish twin** is a translation, not a summary: same sections, same code blocks, same variables, same rows.
   Mexican Spanish, `tú`.
7. **Copy rules.** English and Spanish without em dashes; no emoji in headings; no superlatives without evidence
   ("fast", "best") unless a measured number backs them.
8. **An announcement, with graphics (Franc, 2026-09-29).** The README reads like an ad in the figurative sense: a hero,
   benefit-led headlines, one graphic per section and a clear call to action ("Run it in three minutes", "Star the
   repository"). `scripts/render-readme-graphics.mjs` renders, from HTML templates in `scripts/readme-graphics/` with
   the same tokens as the banner, in light and dark:
   - three reason cards (`reason-sources`, `reason-citations`, `reason-voice`), 400 × 300 each, laid out as a
     three-column table; the voice card carries `Next`;
   - the flow of `How it works`, 1280 × 480: documents, passages, libSQL with full text and vectors, RRF, the answer
     with numbered citations, the web widget and the voice agent, the last two marked `Next`;
   - the demo, 1280 × 560: a terminal with the real commands and output of the quick start, captured by the script
     when it runs them;
   - the roadmap, 1280 × 360, generated from the same rows as the status table;
   - the voice teaser, 1280 × 360: an Orb-like shape in the brand colors, "Talk to your documents", `Next`;
   - the social preview, 1280 × 640.

   Every text a graphic shows is recorded in `docs/images/readme-graphics.json`, which is what the test compares with
   the README. PNGs are optimized so the whole set stays at 3 MB or less.
9. **Verification of the rendering** as in Construye: GitHub's public Markdown API (no token) renders both files, the
   HTML is opened with the images pointed at the local files, and Playwright captures the first screen at 1280 and
   400 px in light and dark.

10. **Art direction, second pass (Fable, after looking at the first renders).** The first set was correct and plain:
    every "dark" graphic except the banner rendered on a white background (mean luminance 0.92 to 0.98), the cards
    were nearly invisible, the whole flow carried a `Next` tag, and the social preview was a small logo on white. The
    graphics must look like the banner, which is the reference:
    - **Theme:** a dark variant has the ink background `#171717` with the subtle radial lime glow of the banner; a light
      variant has the off-white background. Measured: the mean luminance of every `*-dark.png` and of
      `social-preview.png` is 0.30 or less, and of every `*-light.png` is 0.80 or more.
    - **Type:** Outfit; headlines in weight 700 at 44 px or more on the 1280 px graphics and 30 px or more on the reason
      cards; no text under 16 px; body text with a contrast ratio of 4.5 or more against its background.
    - **Fill:** the content occupies the canvas: no band of empty background taller than a quarter of the height.
    - **Reason cards:** a bold benefit headline, an illustration that takes at least 40% of the card, one line of copy,
      and a visible card surface (a border or fill that contrasts with the page). Headlines: `Only your documents.`,
      `Every passage keeps its source.`, and `Talk to it.` with `Next` on the voice card.
    - **How it works:** the five steps as cards with a visible surface joined by a lime line; only the answer step and
      the two branches after it (web widget, voice agent) carry `Next`; no `Next` on the whole graphic.
    - **Demo:** a terminal is dark in both themes; commands in lime, output in off-white, no outline or stroke effect on
      the text; the first result and its heading highlighted in lime; headline
      `Ask a question. Get the passage and where it came from.`
    - **Roadmap:** two columns with bold headers; `Available now` rows with a lime check, `Next` rows with an outlined
      `Next` tag and the name of the change.
    - **Voice teaser:** a large Orb-like sphere in lime and ink gradients, the headline `Talk to your documents.` and a
      `Next · ElevenLabs` tag.
    - **Social preview:** full-bleed ink with the lime glow, the wordmark at 180 px or more with its `[1]` mark, the
      tagline, `by Katalis` and a lime rule; the text block is at least half of the canvas height.

11. **Corrections after `revision-community-03.md` (Fable).**
    - Nothing outside a `Next` tag says "answer", "respuesta" or "page": the search returns passages with their
      document, heading and position, and that is what the copy promises until `pluggable-models-and-ask` lands.
    - The roadmap graphic is 1280 px wide and as tall as its rows need, 720 px at most; decision 8's 360 px could not
      hold ten legible rows.
    - The voice teaser reads `Voice with ElevenLabs arrives in an upcoming release.` instead of a sentence about the
      graphic itself.
    - The terminal of the demo is dark in both themes: its mean luminance is 0.30 or less inside the terminal area of
      `demo-light.png` too.
    - `README.es.md` is translated, not only mirrored: its headings, the status words (`Disponible`, `Siguiente`) and
      the yes/no of the configuration (`sí`, `no`) are Spanish; code, commands, variable names, file paths and the
      product and change names stay as they are.

## Risks / Trade-offs

- **An honest status table makes the product look early.** It is early; saying so is what makes the rest credible, and
  the table becomes the changelog of the launch.
- **The CI badge does not render for anonymous readers while the repository is private.** It will at the launch.
- **Two READMEs can drift.** The contract test compares them.

## Testing Strategy

- `tests/readme.test.ts` asserts every scenario of `project-readme`, and a test asserts both scenarios of
  `product-identity`. Tests first: they run red against the current README and names.
- The existing tests that name the product (`tests/home.test.tsx`, `e2e/home.spec.ts`) change only where they assert
  the old name.
- Manual: the quick start runs on a clean clone of the branch in a `node:24` container; `curl.exe` of the shields
  badges and of the Markdown API.
