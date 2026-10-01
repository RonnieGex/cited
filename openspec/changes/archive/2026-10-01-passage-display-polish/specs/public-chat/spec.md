## ADDED Requirements

### Requirement: A cited passage reads as its document says it

When a visitor opens a citation on the public page or in the widget, the passage SHALL show its heading exactly once,
on the section line of the panel, and never above the passage nor at the start of its text; SHALL show a list as a list with one item per line; SHALL show the words it
repeats from the passage before it in the muted text colour and outside the highlighter; and SHALL paint the
highlighter under each line of the passage from its first own word.

#### Scenario: The heading is shown once

- **WHEN** the sample corpus is ingested and an answer cites the first passage of the section `Café La Horquilla` of
  `cafe-la-horquilla.md`
- **THEN** the panel shows the text `Café La Horquilla` exactly once, on its section line, and its highlighted text
  starts with `Somos un café`

#### Scenario: A list is shown as a list

- **WHEN** an answer cites the passage of the section `Precios` of `cafe-la-horquilla.md`
- **THEN** the opened passage shows one list element, and only one, with five items, from `Espresso: 35 pesos.` to `Cambio de cámara:
  120 pesos.`, each item highlighted on its own line

#### Scenario: Repeated words stay outside the highlighter

- **WHEN** an answer cites a passage that starts with the last words of the passage before it in its document
- **THEN** those words are shown in the muted text colour and outside the highlighter, and the highlighter starts at
  the first word that follows them

#### Scenario: The highlighter starts on the first line

- **WHEN** an opened passage runs over several lines at 1440 px and at 375 px
- **THEN** the top of the highlighter's first band is level with the first line of the passage's own words, and every
  further line has its own band
