# agent-evidence-r3 Specification

## Purpose
TBD - created by archiving change agent-evidence-r3. Update Purpose after archive.
## Requirements
### Requirement: Canonical evidence and retrieval limitations
The bilingual READMEs and agents graphic SHALL use the same verified round-three evidence as the plugin, disclose all three natural-question outcomes and link exact model attribution in compatibility evidence.

#### Scenario: Verified source in one run
- **WHEN** canonical evidence contains an answer and its own passage
- **THEN** the graphic quotes the answer and returned source in a labeled TOOL RESULT excerpt with chip, document, heading and position, without a separate Passage 1 panel.

#### Scenario: Reader assesses reliability
- **WHEN** either README is read
- **THEN** one closing provenance paragraph states the actual supported-answer count out of three, keyword-only retrieval without embeddings and English-to-Spanish retrieval limits, and links evidence identifying agent/Cited models separately.

#### Scenario: Irrelevant citations do not prove a price answer
- **WHEN** the English response has citation markers but falsely says the price is not stated
- **THEN** it is not counted as a supported price answer, which requires its own verified price passage and final price 380, and the README states two successful price answers out of three.

#### Scenario: Explicit selection from canonical attempt-2
- **WHEN** the graphic displays the canonical run
- **THEN** it shows the complete question under QUESTION · ORIGINAL SPANISH, the exact own-source result excerpt and exactly the first paragraph of the final answer under ANSWER EXCERPT, while linked provenance retains the additional search and unchanged full raw record.

#### Scenario: Readable excerpt without silent truncation
- **WHEN** the answer is displayed on the 1280x680 graphic
- **THEN** only the paragraph before the first blank-line separator is displayed as the expressly labeled answer excerpt without paraphrase or clipping, and the link retains the complete answer and every exchange.

#### Scenario: No complete replacement
- **WHEN** new evidence lacks a verified complete answer-and-passage record
- **THEN** canonical attempt-2 remains unchanged and no presentation edit fabricates provenance.

### Requirement: Distinct verification levels
The agents graphic SHALL reuse roadmap SVG marks and distinguish called-and-answered, connected-and-listed and documented-only clients in text and legend.

#### Scenario: Connected client
- **WHEN** Claude Code or Codex appears in the graphic
- **THEN** its outlined SVG and label claim connection and tool listing only, without implying an answer test.

#### Scenario: DeepSeek routes
- **WHEN** the compatibility table renders
- **THEN** MCP configuration and native plugin have separate rows and separate concrete evidence links, with installation below the table.

### Requirement: Transparent Markdown presentation
The graphic SHALL render answer Markdown safely in Outfit and the README SHALL explain in a complete sentence that the linked transcript retains raw output.

#### Scenario: Styled quotation
- **WHEN** the exact answer contains Markdown emphasis or code
- **THEN** the graphic renders those styles without treating raw model HTML as markup, the README explains the transformation, and no unlinked transcript note appears inside the graphic.

