## ADDED Requirements

### Requirement: The public page wears the business first

`/` SHALL open with a band painted in the primary color of the business (ink with the wordmark when no business is
configured) that carries its logo or the wordmark, its name and the language switch; SHALL show the welcome message
as the headline with its last words highlighted; SHALL show each answer as a ledger entry with its citation marks
inline and its sources beside it; and SHALL keep the question box in reach at the foot of the thread.

#### Scenario: The band of the business

- **WHEN** the settings hold a name and a primary color that passes AA
- **THEN** the computed background of the band is that color, the name of the business is the only `h1`, and the
  switch inside the band reads at 4.5:1 over it

#### Scenario: No business yet

- **WHEN** no settings exist
- **THEN** the band is ink, shows the wordmark, and the page still offers the question box

#### Scenario: A long thread keeps the box in reach

- **WHEN** four questions have been asked on a 812 px tall viewport
- **THEN** the question box is visible without scrolling to the end, and every answer keeps its `data-cited` markers,
  its citation buttons and its sources as today

#### Scenario: The marks of an answer

- **WHEN** an answer with two sources arrives
- **THEN** each `[n]` of the text is a lime citation mark button named `Citation n`, the sources list carries the two
  marks with their document names, and opening one shows the passage in the highlighter with the document and the
  heading
