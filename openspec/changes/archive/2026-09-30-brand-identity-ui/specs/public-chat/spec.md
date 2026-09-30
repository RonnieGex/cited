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
- **THEN** each `[n]` of the text is a lime citation mark button named `Citation n` that sits against its word with no
  space before it and never starts a line alone, the sources list carries the two marks with the heading of each
  passage and, on a second smaller line, its document name, and opening one shows the passage in the highlighter with
  the document and the heading

#### Scenario: A failure in the words of the visitor

- **WHEN** `/api/ask` answers `429` or `503`, or the network fails, on the page in English and in Spanish
- **THEN** the entry shows the sentence of that kind of failure in the language of the page, the announcer says it
  once, and no text written by the server (no name of `.env.example`, no English on the Spanish page) reaches the page

#### Scenario: Storage that cannot be read

- **WHEN** reading or writing `sessionStorage` throws and the visitor asks
- **THEN** the question still ends in an answer or in a failure entry, and no entry stays waiting

#### Scenario: A short or zoomed screen

- **WHEN** the thread holds four answers on a viewport of 512x384 or 320x256 px (200% and 400% zoom)
- **THEN** the text of the last answer is visible above the question box, which is not sticky below 560 px of height;
  on a phone the threaded box shows its field and its button on one row with a label for screen readers only

#### Scenario: The page names the business and Cited

- **WHEN** `/` is opened with a business named in the settings
- **THEN** the title of the document is the name of the business, the placeholder of the box reads `Type your question`
  / `Escribe tu pregunta`, and the footer carries the small wordmark, `Answers by Cited` / `Respuestas de Cited` and the
  flame with `Built by Katalis` / `Hecho por Katalis`
