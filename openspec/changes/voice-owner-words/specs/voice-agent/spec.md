## MODIFIED Requirements

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

### Requirement: The cap is checked before the configuration

`GET /api/voice/signed-url` SHALL evaluate the daily minute cap before it checks the ElevenLabs configuration: a cap
below the five minutes of one session answers `429` whether or not the key and the agent are configured, and only then
does a missing key or agent answer `503` with the code `voice_unavailable`.

#### Scenario: A cap of three minutes with no key

- **WHEN** `DAILY_VOICE_MINUTE_LIMIT=3`, `ELEVENLABS_API_KEY` is empty and a visitor starts a voice session
- **THEN** the route answers `429` and no signed URL is requested
