## ADDED Requirements

### Requirement: Authentic English evidence
The repository SHALL use English evidence captured from the three fixed natural customer questions over bike-workshop-policies.md using a main-installed plugin in temporary headless state on port 3246. The canonical record SHALL include a supported 90 day guarantee answer and its own Guarantee passage from one matched exchange. Failed attempts SHALL remain recorded and SHALL not count as supported answers.

#### Scenario: Canonical selection and provenance
- **WHEN** the three English capture records are validated
- **THEN** the first supported cited_ask record is canonical, with the first supported cited_search record as fallback only when no supported ask exists
- **AND** the saved source installation, runtime/model metadata, complete events, raw transcript and exact returned source remain verifiable

#### Scenario: Unsupported evidence fails validation
- **WHEN** source text, matching call ID, event order, completion state, cited number or raw transcript differs from the captured record
- **THEN** validation rejects the record without publishing a fabricated canonical example

### Requirement: Faithful quotation and authored typography
Captured model events, raw transcripts and quoted displays SHALL preserve authentic punctuation, including U+2014. Authored copy SHALL contain no em dash. Tests SHALL enforce these as separate boundaries and SHALL retain complete transcript and excerpt equality against captured evidence. Typography SHALL NOT cause an additional model call, a changed evidence byte, a shortened answer paragraph or a weakened layout check.

#### Scenario: Captured answer contains an em dash
- **WHEN** an authentic model answer contains U+2014
- **THEN** the event, raw transcript and quoted display retain that character unchanged
- **AND** the typography assertion checks authored markup outside the transcript subtree while a separate equality assertion validates the complete quoted content
- **AND** browser geometry is measured using the full captured paragraph without truncation

### Requirement: Locale-specific example and unchanged Spanish evidence
The repository SHALL preserve the complete historical Spanish evidence byte for byte and SHALL select English for English and Chinese public surfaces, Spanish for Spanish public surfaces. Highlighted text and source chip 1 SHALL remain within the corresponding TOOL RESULT.

#### Scenario: A reader selects a language
- **WHEN** a reader views an English surface
- **THEN** the question, answer, own passage, caption and raw transcript reference correspond to the English capture
- **AND** the Spanish surface retains its Spanish example and Chinese README graphics use English evidence

### Requirement: Accurate batch limits
All maintained language variants SHALL state the historical Spanish-example batch outcome of 2 of 3 and the validated English batch outcome N of 3. They SHALL identify keyword search without embeddings and the possibility that an English question misses a Spanish document. They SHALL not describe the historical batch as three Spanish questions.

#### Scenario: Success denominator is audited
- **WHEN** published counts are compared with complete saved attempts
- **THEN** each numerator equals supported answers according to the appropriate guarantee/price contract and each denominator equals every attempted natural question in its batch

### Requirement: Measured English agents layout
The English agents graphic SHALL render the complete answer paragraph in 22px Outfit and SHALL lay out .agents-clients as a flex column with space-between justification. The Spanish variants SHALL preserve their previous PNG hashes. The source excerpt SHALL retain 20px Outfit and all existing canvas, clearance, column-bottom and no-clipping limits SHALL remain enforced.

#### Scenario: Both languages are rendered
- **WHEN** the agents graphics are rendered for English and Spanish
- **THEN** browser assertions verify the English computed styles and complete content bounds
- **AND** Spanish PNG hashes equal their preserved baseline

### Requirement: Reproducible isolated delivery
The change SHALL pass the repository-specific TDD, existing regressions, read-only database checks, curl, browser checks, documentation and independent review defined in design.md and tasks.md. It SHALL archive before commit, scan secrets before every commit and record actual final-SHA CI status where a PR exists. It SHALL not modify desktop state, merge or deploy.

#### Scenario: Closure is verified
- **WHEN** the change is delivered
- **THEN** its reports contain executed commands and outcomes, locale-specific artifacts, database before/after state, review findings and final commit/PR details
- **AND** ports 3240 and 3243 have no task-owned listener, all temporary servers are stopped and actual issues are classified honestly
