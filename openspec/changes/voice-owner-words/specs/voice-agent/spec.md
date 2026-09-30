## ADDED Requirements

### Requirement: A visitor never learns how the server is configured

The public voice routes SHALL answer a visitor with a status and a reason code only, and SHALL NOT name any variable of
the environment or say which piece of the configuration is missing.

#### Scenario: Voice without a key or an agent

- **WHEN** a visitor asks `GET /api/voice/signed-url` and the key of ElevenLabs or the agent is missing
- **THEN** the answer is `503` with the code `voice_unavailable`, no name of `.env.example` appears in its status,
  headers or body, and the widget hides the microphone
