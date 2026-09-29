## ADDED Requirements

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
