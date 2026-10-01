## ADDED Requirements

### Requirement: A citation says where its own words start

Every citation of `POST /api/ask` SHALL carry `lead`, the number of characters at the start of its `excerpt` that
repeat the end of the passage before it in the same document (the overlap of the chunker), and `0` when there is none.
`lead` SHALL be the length of the longest prefix of the excerpt, at most 120 characters and followed by whitespace in
the excerpt, that is also a suffix of the text of the passage at `position - 1` of the same document. No other field
of a citation changes.

#### Scenario: The first passage of a section

- **WHEN** an answer cites the first passage of a section
- **THEN** its citation carries `lead: 0`

#### Scenario: A passage that continues the one before it

- **WHEN** an answer cites a passage whose text starts with the last words of the passage before it
- **THEN** its citation carries `lead` equal to the length of those words, and `excerpt.slice(lead)` starts with the
  first word of its own
