## ADDED Requirements

### Requirement: Authentic source-preserving logos

The renderer SHALL use locally vendored authentic marks from the fixed source/version mapping in design.md, preserving full source geometry and viewBox. Shared files SHALL be byte-identical across participating repositories. Provenance SHALL include exact source/version, hash, license and nominative-use note.

#### Scenario: Logo rendered from a verified source
- **WHEN** a specified brand is rendered
- **THEN** its local mark retains source geometry and accessible adjacent brand text, with theme-appropriate paint and equal optical alignment
- **AND** the documentation identifies the reproducible asset source and hash

### Requirement: Complete scoped coverage and truthful status

The output SHALL satisfy this exact coverage: The agents template replaces all four generic brand-position glyphs with DeepSeek, Claude Code, Codex and Cursor. Status remains separately stated: DeepSeek called and answered; Claude Code and Codex connected and listed tools; Cursor documented, not tested. The footer repeats all three states as text/chips. ElevenLabs is marked in reason-voice, voice-teaser and how-it-works. libSQL is marked in how-it-works. The roadmap capability rows mark libSQL, Turso, Ollama, ElevenLabs and Docker. The Docker image row retains its existing planned status. Vendor docker.svg from simple-icons@16.34.0 byte-identical to the landing asset and include Docker in docs/brand-logos.md with source, version, SHA-256, license and nominative-use note. Generate agents light/dark plus Spanish light/dark and both themes of each other affected graphic. Existing screenshots and raw evidence are not rewritten.

#### Scenario: All prescribed variants render
- **WHEN** the renderer builds the required localized/theme outputs
- **THEN** every specified authored brand mention has its authentic mark and no generic status glyph replaces it
- **AND** the documented verification levels, Katalis identity and raw evidence remain unchanged

### Requirement: Deterministic accessible offline validation

The implementation SHALL pass the validations and closure boundaries defined here: Render only agents, reason-voice, voice-teaser, how-it-works and roadmap to avoid demo ingestion/model execution. Reuse checked-in evidence. Validate marks, separate status, geometry, local fonts, complete images and clipping using the renderer's headless Playwright inspection. Run required repository test/lint/type/build checks and strict OpenSpec validation. Branch docs/brand-logos is the explicit brief override of the standard feature branch. Open an unmerged PR with required checks green.

#### Scenario: Validation of finished outputs
- **WHEN** the agent executes the tests, rendering, local curl and browser checks
- **THEN** commands and actual outcomes are recorded under the change reports, missing evidence remains unchecked, and blockers prevent archive
- **AND** no desktop profile, external model call, production change or lockfile modification occurs
