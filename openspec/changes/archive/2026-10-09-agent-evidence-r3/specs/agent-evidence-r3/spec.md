## ADDED Requirements

### Requirement: Canonical evidence and retrieval limitations
The bilingual READMEs and agents graphic SHALL use the same verified round-three evidence as the plugin and disclose all three natural-question outcomes.

#### Scenario: Verified source in one run
- **WHEN** canonical evidence contains an answer and its own passage
- **THEN** the graphic quotes that answer and exact passage with chip, document, section and position without paired-run labels.

#### Scenario: Reader assesses reliability
- **WHEN** either README is read
- **THEN** it states the actual cited-answer count out of three, keyword-only retrieval without embeddings, English-to-Spanish retrieval limits and separate agent/Cited model attribution.

#### Scenario: Irrelevant citations do not prove a price answer
- **WHEN** the English response has citation markers but falsely says the price is not stated
- **THEN** it is not counted as a supported price answer, which requires its own verified price passage and final price `380`, and the README states two successful price answers out of three.

#### Scenario: Explicit selection from canonical attempt-2
- **WHEN** the graphic displays the longer canonical run
- **THEN** it shows the complete question, exact own-source passage and exactly the first paragraph of the final answer labeled `Answer excerpt · original Spanish`, acknowledges the additional search and links the full raw record without changing canonical selection.

#### Scenario: Readable excerpt without silent truncation
- **WHEN** the final answer exceeds the existing 1280x640 graphic's readable capacity
- **THEN** only the paragraph before the first blank-line separator is displayed as the expressly labeled answer excerpt, without paraphrase or clipping, while the link retains the complete answer and every exchange.

#### Scenario: No complete replacement
- **WHEN** the new runs have no verified complete answer-and-passage record
- **THEN** prior paired evidence remains explicitly labeled as recorded search from the same document and the delivery identifies the unmet replacement.

### Requirement: Distinct verification levels
The agents graphic SHALL reuse roadmap SVG marks and distinguish called-and-answered, connected-and-listed and documented-only clients in text and legend.

#### Scenario: Connected client
- **WHEN** Claude Code or Codex appears in the graphic
- **THEN** its outlined SVG and label claim connection and tool listing only, without implying an answer test.

#### Scenario: DeepSeek routes
- **WHEN** the compatibility table renders
- **THEN** MCP configuration and native plugin have separate rows and separate concrete evidence links, with installation below the table.

### Requirement: Transparent Markdown presentation
The graphic SHALL render answer Markdown safely in Outfit and the README SHALL state that the linked transcript retains raw output.

#### Scenario: Styled quotation
- **WHEN** the exact answer contains Markdown emphasis or code
- **THEN** the graphic renders those styles without treating raw model HTML as markup, and its caption explains the transformation.
