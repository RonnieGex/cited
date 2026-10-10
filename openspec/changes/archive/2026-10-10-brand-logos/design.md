## Context

The approved round-seven brief extends existing static README/landing rendering. Existing transcripts are evidence, not authored marketing copy. No data model changes.

## Goals / Non-Goals

**Goals:** authentic marks, identical drawings across repositories, separate verification status, complete reproducible provenance, readable localized output.

**Non-Goals:** new integrations, revised compatibility claims, new model calls, desktop/profile access, production, runtime/API changes, dependency or lockfile updates.

## Decisions

### Asset contract

Use vendored files only. Existing landing `claude.svg` and `codex_dark.svg` are copied byte-for-byte wherever used. Claude matches simple-icons@13.21.0; Codex is verified against https://svgl.app/library/codex_dark.svg and retains the existing landing bytes, pinned by SHA-256 and retrieval date. New Simple Icons files are pinned to 16.34.0 (CC0), except OpenAI pinned to 13.21.0. DeepSeek, Cursor, ElevenLabs, Anthropic, Gemini (`googlegemini`), OpenRouter, Ollama, LM Studio (`lmstudio`), GitHub, Node.js (`nodedotjs`), npm, Next.js (`nextdotjs`), SQLite, Turso and Docker use their exact package SVGs. Groq uses https://groq.com/favicon.svg, pinned by retrieval date and SHA-256. Keep the original vendored SVG bytes unchanged; render it in monochrome ink/silver with distinct foreground and background paints appropriate to the theme, preserving every shape and the original geometry. No evidenced brand-guide restriction requires orange. libSQL uses https://raw.githubusercontent.com/libsql/libsql.github.io/3e0af61e03085fb7159a8d1f0a449d0feecdeac9/images/favicon/favicon.svg. Each repository vendors only its used marks; shared marks have identical file bytes. Record source URL, exact version/commit, SHA-256, license and nominative compatibility use in `docs/brand-logos.md`.

Render complete SVGs, preserving viewBox, path data, shapes, transforms, fill-rule and clip-rule. Do not extract only paths into a 24x24 wrapper. Presentation can change outer size, accessibility attributes and paint for ink/silver; preserve distinct foreground/background paints and all geometry. Prefix inline SVG definition IDs and their references uniquely without changing geometry. No runtime remote asset requests. Adjacent brand names provide accessible text; logos use aria-hidden and focusable=false. Equal optical containers with contain scaling align marks, with no distortion. Brand marks never substitute for status text.

### Exact coverage

The agents template replaces all four generic brand-position glyphs with DeepSeek, Claude Code, Codex and Cursor. Status remains separately stated: DeepSeek called and answered; Claude Code and Codex connected and listed tools; Cursor documented, not tested. The footer repeats all three states as text/chips. ElevenLabs is marked in reason-voice, voice-teaser and how-it-works. libSQL is marked in how-it-works. The roadmap capability rows mark libSQL, Turso, Ollama, ElevenLabs and Docker. The Docker image row retains its existing planned status. Vendor docker.svg from simple-icons@16.34.0 byte-identical to the landing asset and include Docker in docs/brand-logos.md with source, version, SHA-256, license and nominative-use note. Generate agents light/dark plus Spanish light/dark and both themes of each other affected graphic. Existing screenshots and raw evidence are not rewritten.

### Implementation boundary

Use docs/brand/logos for vendored files, a renderer helper under scripts/readme-graphics, existing templates and render-readme-graphics.mjs. Tests live in tests/readme.test.ts and focused brand-logo tests. Update docs/readme-assets.md and docs/development-guide.md.

### Validation and closure

Render only agents, reason-voice, voice-teaser, how-it-works and roadmap to avoid demo ingestion/model execution. Reuse checked-in evidence. Validate marks, separate status, geometry, local fonts, complete images and clipping using the renderer's headless Playwright inspection. Run required repository test/lint/type/build checks and strict OpenSpec validation. Branch docs/brand-logos is the explicit brief override of the standard feature branch. Open an unmerged PR with required checks green.

All validation uses Node >=24.15.0 <25.0.0. Capture read-only sample database state before and after tests, without initializing/migrating a database. Record absence when no local database exists; fixtures that create temporary state remain isolated. Do not substitute Git HEAD for database state. Reports live in this change's reports/YYYY-MM-DD-step-N-name.md and contain exact commands, output, base SHA, agent and verdict. Independent contract review precedes implementation; independent adversarial review follows verify and precedes archive/commit. Franc authorized completion of the entire brief; no merge/deploy is authorized.

## Risks / Trade-offs

- Altered SVG geometry can clip a mark: preserve the complete SVG tree/viewBox and compare against vendored asset geometry in tests.
- Text injection can alter evidence/commands: keep transcripts and pre/code excluded and run existing equivalence tests.
- Extra inline marks can overflow: wrap brand groups and inspect every required viewport/theme.
- Third-party marks are trademarks despite asset licensing: document nominative compatibility use without endorsement.

## Decisions taken by the implementer

None. Routine optical sizing follows the fixed containment, alignment and verification constraints above.

## Open Questions

None.
