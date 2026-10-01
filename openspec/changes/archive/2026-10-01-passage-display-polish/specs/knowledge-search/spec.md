## ADDED Requirements

### Requirement: A list keeps its lines in its passage

The chunker SHALL keep each item of a list (a line that starts with `- `, `* ` or a number followed by `. `) on its own
line of the passage text, joined to what comes before it with a line break; every other line SHALL be joined with a
space, as before. The keyword index and the ranking of the hybrid search SHALL not change for a passage without a
list.

#### Scenario: A Markdown list

- **WHEN** a Markdown document holds a paragraph followed by the items `- Espresso: 35 pesos.` and `- Café de olla: 45
  pesos.`
- **THEN** its passage text holds each item on its own line, starting with `- `, after the paragraph

#### Scenario: A list in a Word document

- **WHEN** a DOCX holds a bulleted list of two items
- **THEN** its passage text holds each item on its own line, starting with `- `

#### Scenario: Search does not move

- **WHEN** the searches of the existing search tests run on the sample corpus after this change
- **THEN** each one returns the same passages in the same order as before it
