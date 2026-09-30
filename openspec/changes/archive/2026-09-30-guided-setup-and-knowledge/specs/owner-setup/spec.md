## ADDED Requirements

### Requirement: A guided setup from nothing to a published answer

The panel SHALL show, until the owner finishes or skips it, a guided setup of four steps (connect your AI, add your
information, try it, publish it), each opening in place with its state (to do, in progress, verified, needs attention);
the states SHALL be derived from the real configuration, and no environment variable name SHALL appear in it.

#### Scenario: A first visit

- **WHEN** the owner signs in with no AI connected and no document
- **THEN** the panel shows the welcome with "4 steps, about 5 minutes" and, after start, step 1 open and steps 2 to 4
  to do

#### Scenario: From zero to an answer

- **WHEN** the owner connects a provider through its test double, presses "Try it with a sample business", asks a
  suggested question and presses "This answer is right"
- **THEN** steps 1 to 3 show verified, and the answer shows its citation with the passage highlighted beside it

### Requirement: The owner sees what the system understood

Uploading SHALL accept several files at once and show, per file, its progress and its result in words (ready with its
number of passages, or the reason it failed and what to do); each document SHALL open as a page with its passages
grouped under their headings in reading order.

#### Scenario: A scanned PDF

- **WHEN** the owner uploads a PDF with no text layer
- **THEN** that file says it looks like a scan that is not supported yet, and the other files of the same upload are
  ingested

#### Scenario: A document page

- **WHEN** the owner opens a document of the sample business
- **THEN** the page lists its headings in order with their passages as stored

### Requirement: Try before publishing

The panel SHALL let the owner ask their own documents and see each cited passage highlighted inside its document,
SHALL suggest up to four questions from the headings of the documents without calling a model, and SHALL say "The
documents don't say" with a suggestion when the answer is a refusal.

#### Scenario: A refusal while trying

- **WHEN** the owner asks something no document covers
- **THEN** the panel shows the refusal in words and suggests adding a document about it

### Requirement: Publishing shows the page as visitors will see it

The publish step SHALL show the business form beside a live preview of the public page, the public link to copy and
open, and the widget code with its allowed sites.

#### Scenario: A change of color

- **WHEN** the owner saves a new primary color
- **THEN** the preview shows it on the ask button without reloading the panel

### Requirement: The public page is honest about its state and about AI

The public page and the widget SHALL say "This assistant is not ready yet" with a link for the owner when no AI is
connected, and SHALL always show that answers are written by AI from the business's documents and can be wrong, that
personal data should not be shared, and a link to a privacy page that names the providers in use and where they
process data, in the interface language.

#### Scenario: Not ready

- **WHEN** no chat provider is configured and a visitor opens `/`
- **THEN** the page says the assistant is not ready yet, offers no ask box, and links the panel for the owner

#### Scenario: The disclosure

- **WHEN** a visitor opens `/` or `/embed` in Spanish with a provider configured
- **THEN** the AI disclosure, the request not to share personal data and the privacy link are visible in Spanish
