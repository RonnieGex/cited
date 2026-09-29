## ADDED Requirements

### Requirement: The agent asks through a protected server tool

`POST /api/voice/tool` SHALL require `Authorization: Bearer <VOICE_TOOL_SECRET>` compared in constant time, SHALL take
`{ question, conversation_id }`, SHALL answer through the pipeline of `answering` with its guards using the
conversation id as the session, and SHALL return the answer and its citations as plain text.

#### Scenario: Without the secret

- **WHEN** the tool is called without the Bearer or with a wrong one
- **THEN** it answers `401` and makes no model call

#### Scenario: One thread per call

- **WHEN** two questions arrive with the same `conversation_id` and a third with another
- **THEN** the first two share a session and the third does not

### Requirement: The browser never sees the ElevenLabs key

`GET /api/voice/signed-url` SHALL request a signed URL with `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` (or the stored
agent id) and return only the URL; it SHALL answer `503` naming the missing variable when the key or the agent is
missing, and `429` when `DAILY_VOICE_MINUTE_LIMIT` is reached for the UTC day.

#### Scenario: The key stays on the server

- **WHEN** the public page starts a voice session
- **THEN** no response to the browser and no bundle file contains the ElevenLabs key or an `xi-api-key` header

### Requirement: The voice agent is created in one click

With `ELEVENLABS_API_KEY` set, the admin panel SHALL create or update, through the ElevenLabs API, the workspace secret
holding `Bearer <VOICE_TOOL_SECRET>`, the webhook tool, the client tool `mostrar_fuentes`, and the agent with the
business name, the business language as its first language and the other of English and Spanish as a second one, a
multilingual model and the allowlist of the app's origin plus `ALLOWED_ORIGINS`, and SHALL
store the agent id; the prompt SHALL tell the agent not to repeat its answer after `mostrar_fuentes` returns.

#### Scenario: A second click updates

- **WHEN** the button is pressed twice against a double of the ElevenLabs API
- **THEN** the second press updates the same agent and tools and creates nothing new

#### Scenario: English first, Spanish too

- **WHEN** the agent is created for a business whose language is `en`, against the double of the ElevenLabs API
- **THEN** the request makes English its first language and adds Spanish as a second one

#### Scenario: The prompt carries the lesson of Construye

- **WHEN** the agent is created
- **THEN** its prompt tells it to call the server tool for every question and not to repeat its answer after
  `mostrar_fuentes` returns

### Requirement: The microphone with the Orb

The public page and the widget SHALL offer a voice panel with the Orb (local texture, loaded on demand), the state in
words, the live transcript with the written questions echoed once, and the citation chips named by section; the test
SDK used by the E2E SHALL never be part of a production build.

#### Scenario: A production build

- **WHEN** `npm run build` runs after an E2E build
- **THEN** no marker of the test SDK is present in the output, checked by a script that fails the build
