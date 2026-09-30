## ADDED Requirements

### Requirement: The panel is a workspace with the identity

The panel SHALL show an ink side navigation from 1024 px with the wordmark, every section numbered with a citation
mark, the current section marked with `aria-current="page"` and the lime mark, the language switch, the sign-out and
"Built by Katalis" with the flame at its foot; below 1024 px the same navigation SHALL become an ink top bar that
scrolls sideways; the sign-in SHALL be a split screen with the wordmark and the tagline on ink and the form on paper;
every date the panel shows SHALL be formatted in the language of the panel.

#### Scenario: The navigation at 1440 px

- **WHEN** `/admin/documents` is opened signed in at 1440 px
- **THEN** the link of Documents carries `aria-current="page"`, its mark reads 3, the navigation sits in an ink column
  on the left, and every text of the column reaches 4.5:1 over ink

#### Scenario: The navigation at 375 px

- **WHEN** the same page is opened at 375 px
- **THEN** the navigation is a top bar, every link is reachable by scrolling it sideways, and no horizontal scroll
  appears on the page itself

#### Scenario: Dates read like dates

- **WHEN** `/admin/conversations` lists a conversation in Spanish
- **THEN** its date cell is a `time` element whose `dateTime` is the stored ISO value and whose text is the date and hour
  formatted for `es`, with no `T` and no `Z` in the visible text

#### Scenario: The sign-in

- **WHEN** `/admin` is opened signed out in Spanish
- **THEN** the tagline `Cada respuesta enseña de dónde salió.` is visible with its last words highlighted, the form
  keeps its label, its button and its messages, and the page passes axe at level AA

#### Scenario: Every page has its own title

- **WHEN** the sign-in and each page of the panel are opened in English and in Spanish
- **THEN** each has its own document title in the language of the panel, such as `Documents · Cited` /
  `Documentos · Cited`

#### Scenario: The panel speaks Spanish whole

- **WHEN** `/admin` is opened in Spanish and the owner tests a provider
- **THEN** every group title, every detail and the result of the test are in Spanish, and no token of the server (such
  as `NO_ANSWER`) and no text of a provider is printed

#### Scenario: A delete asks first

- **WHEN** the owner presses Delete on a document, or Delete all on the conversations
- **THEN** an inline group asks with a sentence, a Delete button and a Keep button, the focus moves to Keep, nothing is
  deleted until the second press, and no modal opens

#### Scenario: The sections that came from main

- **WHEN** the panel is opened after `main` is merged into this change
- **THEN** "AI and keys" / "IA y llaves" is a numbered section of the ink navigation, and the screen of the voice agent
  wears the workspace like the other pages
