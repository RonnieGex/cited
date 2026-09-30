# voice-agent Specification

## Purpose
Let a business talk to its own documents: a protected server tool for the ElevenLabs agent, a signed URL that keeps the
key off the browser, the agent created in one click, a microphone with the Orb, and a daily cap of minutes.
## Requirements
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

`GET /api/voice/signed-url` SHALL request a signed URL with the key of ElevenLabs and the agent (from the environment or
the stored agent id) and return only the URL; when the key or the agent is missing it SHALL answer `503` with the code
`voice_unavailable`, naming no variable of the environment and not saying which piece of the configuration is missing,
and it SHALL answer `429` when the daily voice minute limit is reached for the UTC day.

#### Scenario: The key stays on the server

- **WHEN** the public page starts a voice session
- **THEN** no response to the browser and no bundle file contains the ElevenLabs key or an `xi-api-key` header

#### Scenario: Voice without a key or an agent

- **WHEN** a visitor asks `GET /api/voice/signed-url` and the key of ElevenLabs or the agent is missing
- **THEN** the answer is `503` with the code `voice_unavailable`, no name of `.env.example` appears in its status,
  headers or body, the answer is the same whichever piece is missing, and the widget hides the microphone

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

### Requirement: Voice works under the page's own security policy

Every script, worklet and audio processor the voice panel needs SHALL be served from the application's own origin, so
the Content Security Policy never needs a third-party script host; the policy SHALL allow only the ElevenLabs
connections the implemented session actually uses.

#### Scenario: A device that needs sample-rate conversion

- **WHEN** the voice session starts on a device whose audio sample rate differs from the agent's
- **THEN** the resampler loads from the application's own origin and no request goes to a CDN

### Requirement: The minute cap never lets a session exceed it

A voice session SHALL start only when its reservation of five minutes keeps the reserved total of the UTC day within
`DAILY_VOICE_MINUTE_LIMIT`; a limit below five SHALL allow no session and the panel SHALL say so.

#### Scenario: A limit of three minutes

- **WHEN** `DAILY_VOICE_MINUTE_LIMIT=3` and a visitor starts a voice session
- **THEN** `/api/voice/signed-url` answers `429` and no signed URL is requested

### Requirement: The cap is checked before the configuration

`GET /api/voice/signed-url` SHALL evaluate the daily minute cap before it checks the ElevenLabs configuration: a cap
below the five minutes of one session answers `429` whether or not the key and the agent are configured, and only then
does a missing key or agent answer `503` with the code `voice_unavailable`.

#### Scenario: A cap of three minutes with no key

- **WHEN** `DAILY_VOICE_MINUTE_LIMIT=3`, `ELEVENLABS_API_KEY` is empty and a visitor starts a voice session
- **THEN** the route answers `429` and no signed URL is requested

### Requirement: What is copied from a package keeps its notice

Every file the repository serves or ships that is a verbatim copy of a package SHALL sit next to the license text of
that package, byte for byte from the package, and SHALL be listed in `THIRD_PARTY_NOTICES.md` with its name, version,
license and origin.

#### Scenario: The resampler

- **WHEN** `public/voice/worklets/` is read
- **THEN** the license texts of `@alexanderolsen/libsamplerate-js` (MIT) and of the libsamplerate library it bundles
  (BSD 2-clause) are there, equal to the files of the package, and `THIRD_PARTY_NOTICES.md` names the resampler, its
  version `2.1.2` and both licenses
