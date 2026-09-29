## ADDED Requirements

### Requirement: Anyone can ask on the public page

`/` SHALL show the business name, logo, primary color and welcome message from the settings (the Cited brand when none
are set), a question box that calls `/api/ask`, and the answer with its citations.

#### Scenario: An answer with its sources

- **WHEN** the sample corpus is ingested with the fake providers and a visitor asks the price of a bicycle tune-up
- **THEN** the answer appears with its `[1]` linked to a citation chip, and opening the chip shows the excerpt, the
  document and the heading

#### Scenario: A refusal

- **WHEN** the answer comes back `refused`
- **THEN** the page shows the refusal message, styled as such, with no citation chips

### Requirement: The answer is rendered safely

The page SHALL render the answer as Markdown with raw HTML disabled, links limited to `http` and `https`, and no script,
style or event attribute reaching the DOM.

#### Scenario: Injected HTML

- **WHEN** the answer text contains `<img src=x onerror=alert(1)>` and a `javascript:` link
- **THEN** neither the image with its handler nor the link reaches the DOM, and the text is shown escaped

### Requirement: A widget for the owner's site

`/widget.js` SHALL add a floating button to the page that loads it and open `/embed` in an iframe; `/embed` SHALL carry a
`Content-Security-Policy` whose `frame-ancestors` lists the app's own origin and the origins of `ALLOWED_ORIGINS`, and
nothing else.

#### Scenario: An allowed site

- **WHEN** a test page served from an origin in `ALLOWED_ORIGINS` loads `/widget.js` and the visitor opens it
- **THEN** the chat loads in the iframe and answers a question

#### Scenario: A site that is not allowed

- **WHEN** `/embed` is requested
- **THEN** its `frame-ancestors` does not include an origin that is not in `ALLOWED_ORIGINS`

### Requirement: A follow-up keeps its thread in the browser

The chat SHALL keep one `sessionId` per browser tab in session storage and send it with every question.

#### Scenario: Two questions in one tab

- **WHEN** a visitor asks two questions in the same tab
- **THEN** both requests carry the same `sessionId`, and a new tab sends a different one

### Requirement: The public page speaks English first

`/` and `/embed` SHALL open in the language of the business settings (English when there are none), SHALL offer the
switch `English | Español`, English first, kept in the cookie `cited-lang`, and SHALL show the welcome message of the
chosen language, falling back to the other when that one is empty.

#### Scenario: The demo opens in English

- **WHEN** `/` is opened with no cookie, a business whose language is `en`, and a browser that prefers Spanish
- **THEN** the page, the question box and the welcome message are in English with `lang="en"`
- **AND** after choosing `Español` they are in Spanish, and a question written in Spanish is answered in Spanish

### Requirement: The brand color is seen and the widget closes from inside

The primary color of the settings SHALL paint the ask button and the accents of `/` and `/embed` (the lime of Cited
when there is none or when it fails AA); `Escape` SHALL close the widget also when the focus is inside its iframe and
SHALL return the focus to the button; a tab opened from another SHALL start its own conversation.

#### Scenario: The color reaches the page

- **WHEN** the settings carry a primary color that passes AA
- **THEN** the computed background of the ask button of `/` and `/embed` is that color

#### Scenario: Escape inside the iframe

- **WHEN** the widget is open and the focus is on the question box inside the iframe, and `Escape` is pressed
- **THEN** the widget closes and the focus returns to its button

#### Scenario: A tab opened from the page

- **WHEN** a conversation has started and the page opens itself in a new tab with `window.open`
- **THEN** the new tab sends a different `sessionId`, and the first tab keeps its own
