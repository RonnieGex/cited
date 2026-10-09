# agent-presentation-r4 Specification

## Purpose
TBD - created by archiving change agent-presentation-r4. Update Purpose after archive.
## Requirements
### Requirement: Source located in its tool result
The agents graphic SHALL label the returned source TOOL RESULT · CITED_ASK EXCERPT and show exactly two source-derived lines at 20px, without a separate Passage 1 panel or orphan period after chip 1.

#### Scenario: Source examination
- **WHEN** the same-run source is rendered in either theme
- **THEN** the first line contains chip 1 and ` · cafe-la-horquilla.md · Precios (position 2)`, the second contains only `Afinación de bicicleta: 380 pesos.` with lime emphasis, and no Sources: prefix, standalone heading or other price line appears in that excerpt.

#### Scenario: Faithful selective excerpt
- **WHEN** source data is loaded
- **THEN** both displayed lines are derived from the canonical cited_ask source, and the full raw transcript retains the unmodified price list and every call.

### Requirement: Complete and comfortable graphic bounds
The agents graphic SHALL remain 1280x680 with at least 36px of bottom padding and no in-image transcript-link instruction, while keeping readable and balanced proof columns.

#### Scenario: Footer layout
- **WHEN** either themed graphic is rendered
- **THEN** the legend remains at least 36px from the canvas bottom without clipping and the original question has a QUESTION · ORIGINAL SPANISH eyebrow.

#### Scenario: Readable balanced proof
- **WHEN** either themed graphic is measured in the browser
- **THEN** the three proof eyebrows each have 22px margin-top, proof padding-top is 22px, the tool-result has no separating border, both excerpt lines use 20px Outfit without wrapping, each right client row has 24px vertical padding, and the excerpt bottom differs from the final right-row content bottom by no more than 70px.

### Requirement: Feature-first README section
The bilingual agent sections SHALL explain the feature before proof and place concise provenance last.

#### Scenario: Reading the section
- **WHEN** either README is read in document order
- **THEN** feature introduction, token command, image, compatibility table and installation precede one closing provenance paragraph containing the bold two-of-three result, language limit and concrete evidence links.
