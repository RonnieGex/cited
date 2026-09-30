# admin-panel Specification

## Purpose
Let the owner of a business run Cited from a password-protected panel: configure it once, describe the business,
upload its documents, see its conversations, English first with Spanish.
## Requirements
### Requirement: The panel is protected

`/admin` and every `/api/admin/*` route SHALL require a valid session obtained with `ADMIN_PASSWORD`. Without
`ADMIN_PASSWORD` or `ADMIN_SESSION_SECRET` the panel SHALL answer `503` naming the missing variable. The session SHALL be
a signed cookie with `httpOnly`, `secure` (outside `localhost`), `sameSite=strict` and an expiry of twelve hours; the
password SHALL be compared in constant time. `ADMIN_PASSWORD` SHALL have at least 16 characters, or the panel SHALL
answer `503` saying so. When the address of the visitor is known (`TRUST_PROXY` set), five failed attempts from one
address in fifteen minutes SHALL lock the login of that address for fifteen minutes; when it is not known, no attempt
SHALL lock anyone else out, and every failed attempt SHALL take at least one second before it answers (amended by
Fable after `revision-community-07`: a lock shared by every visitor let anyone keep the owner out).

#### Scenario: No password configured

- **WHEN** `ADMIN_PASSWORD` is empty and `/admin` is requested
- **THEN** the response is `503` and names `ADMIN_PASSWORD` without any value

#### Scenario: Locked after five failures

- **WHEN** one IP fails the login five times within fifteen minutes
- **THEN** the sixth attempt, even with the right password, answers `429` with `Retry-After`

#### Scenario: One visitor cannot lock out another

- **WHEN** `TRUST_PROXY=1` and one address fails five times, and another address logs in with the right password
- **THEN** the second address gets its session
- **AND** without `TRUST_PROXY`, twenty failed attempts never make the right password answer `429`, and each failure
  takes at least one second

#### Scenario: A short password

- **WHEN** `ADMIN_PASSWORD` has fewer than 16 characters
- **THEN** `/admin` answers `503` saying the password is too short, without its value

#### Scenario: Every admin route checks the session

- **WHEN** any `/api/admin/*` route is called without a valid session cookie
- **THEN** it answers `401` and changes nothing

### Requirement: The owner sees what is configured, never a value

The setup page SHALL list every variable of `.env.example` grouped by purpose as set or missing, and SHALL offer a test
of the chat model and of the embeddings that makes one minimal call and reports success or the provider's error message
with any key removed.

#### Scenario: Values never leave the server

- **WHEN** the setup page and its API responses are fetched with every variable set
- **THEN** no value of any variable appears in the HTML or the JSON

### Requirement: The business is described once and used everywhere

The panel SHALL store the business name, logo, primary color, tone, language (English by default), forbidden topics and
the welcome message in English and in Spanish; the
logo SHALL be PNG, JPEG or WebP of 512 KB or less, checked by its bytes; the answer prompt SHALL include the tone, the
language and the forbidden topics.

#### Scenario: An SVG or a renamed file

- **WHEN** the owner uploads an SVG, or a text file renamed to `.png`
- **THEN** the upload is refused and the stored logo does not change

#### Scenario: A forbidden topic

- **WHEN** the forbidden topics include "precios de la competencia" and a question asks about them
- **THEN** the prompt sent to the model carries that topic among its rules

### Requirement: Documents are managed from the panel

The panel SHALL upload documents through the same ingestion as `npm run ingest`, with its type and size checks, list
each document with its passages, delete a document with its passages, and re-ingest it.

#### Scenario: Upload, list, delete

- **WHEN** the owner uploads a Markdown file of the sample corpus, then deletes it
- **THEN** the list shows it with its passage count after the upload, and after the delete neither the document nor its
  passages remain in the store

### Requirement: Conversations can be reviewed and erased

The panel SHALL list the latest conversations with the question, the status and the citations, and SHALL delete all of
them on request.

#### Scenario: Delete all

- **WHEN** the owner deletes all conversations
- **THEN** the conversations table of the store is empty and the counters of spend are untouched

### Requirement: The panel speaks English first

The panel SHALL open in English and SHALL offer a visible switch `English | Español`, English first, whose choice is kept
in the cookie `cited-lang` and applies to every page of the panel.

#### Scenario: A first visit and a switch

- **WHEN** `/admin` is opened with no cookie and a browser whose `Accept-Language` prefers Spanish
- **THEN** the page is in English with `lang="en"`
- **AND** after choosing `Español` every page of the panel is in Spanish with `lang="es"` until the choice changes

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
