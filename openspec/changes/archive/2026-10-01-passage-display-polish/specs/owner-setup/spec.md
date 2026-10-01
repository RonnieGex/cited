## ADDED Requirements

### Requirement: The owner sees a passage as the visitor does

Try it and the document page SHALL show a passage with the rules of "A cited passage reads as its document says it"
of `public-chat`. Beside a passage that an answer cited, Try it SHALL show the citation mark with that citation's
number; the document page, which shows passages without an answer, SHALL show no citation mark, and its labels for
screen readers SHALL count passages from 1.

#### Scenario: The number beside a cited passage

- **WHEN** the owner asks Try it a question and the answer cites one passage
- **THEN** the mark beside the highlighted passage reads `1`, as the mark in the answer does, and never the passage's
  position

#### Scenario: The document page

- **WHEN** the owner opens the page of a document
- **THEN** its passages show no citation mark, the first one is labelled passage 1 for screen readers, and each passage
  shows its heading once and its lists as lists

### Requirement: Suggestions speak the language of the panel

The suggested questions of Try it SHALL come first from the headings of the documents written in the language of the
panel, as the detector of the answers reads the text of each document, and only then from the other documents, up to
four unique headings, without calling a model.

#### Scenario: The Spanish panel with the samples

- **WHEN** the panel is in Spanish and the sample business is loaded with its English and its Spanish documents
- **THEN** the four suggestions name `Café La Horquilla`, `Horario`, `Precios` and `Políticas`, the headings of
  `cafe-la-horquilla.md`, and none names a heading of `bike-workshop-policies.md`

#### Scenario: The English panel with the samples

- **WHEN** the panel is in English with the same documents
- **THEN** the four suggestions name headings of `bike-workshop-policies.md`
