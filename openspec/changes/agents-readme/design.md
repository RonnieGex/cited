# Assignment constraints

The design authority is Fable's 2026-10-09 assignment, Task B and common rules.

- Extend `scripts/render-readme-graphics.mjs` and `scripts/readme-graphics/manifest.mjs`.
- Produce `docs/images/agents-light.png` and `docs/images/agents-dark.png` for both READMEs.
- Use local Outfit, ink `#171717`, paper `#FAFAF9`, lime `#DDF469`, square corners and thin rules.
- Keep the agent results explicit: DeepSeek Harness searched and answered with a citation;
  Claude Code and Codex connected and listed the tools; Cursor is documented and untested.
- Use the archived MCP client verification as provenance; a new curl run verifies the endpoint,
  not additional client compatibility.
- Keep the roadmap, status data and generated record consistent with the added MCP status row.
- Do not open DeepSeek Harness desktop, alter its desktop profile, merge or deploy.
- Submit the PR to `main` with all eight required checks passing. Fable reviews and merges it.

## Decisions taken by the implementer

- Use a 1280 by 640 editorial composition: the cited DeepSeek result leads, with individual verification
  scopes for Claude Code, Codex and Cursor alongside it. Both languages share the image and have localized alt text.
- Keep the existing 720 px roadmap height with a wider available column, thin rules and 16 px minimum text.
- Let the manifest opt into flat paper and ink for the two touched graphics. Use the same background for rendering
  and blank-canvas measurement so the empty-band check measures content, not a palette difference.
- A selective render updates only selected record entries and runs the sample pipeline only when rendering `demo`.
  Preserve all unselected evidence and reject unknown graphic names before writing output.
