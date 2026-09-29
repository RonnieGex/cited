## Why

Voice is the differentiator Franc asked for from the start: a business that forks Cited should get a voice agent that
answers from its own documents, created in one click, with no visit to the ElevenLabs dashboard. Katalis already runs
this in production for Construye ("Habla con el libro", Worker `37ff04ca`), so this change ports what was proven there,
including the lessons of its real sessions. It is change 5 of the plan (`elevenlabs-voice-agent`).

## What Changes

- **A server tool for the agent**: `POST /api/voice/tool`, protected by `Authorization: Bearer <VOICE_TOOL_SECRET>`,
  answers the agent's question through the same pipeline as `/api/ask` (guards included) and returns the answer with its
  citations as text the agent can speak. The ElevenLabs conversation id becomes the `sessionId`, so a follow-up works
  within a call and two calls never share a thread.
- **A signed URL for the browser**: `GET /api/voice/signed-url` asks ElevenLabs for a short-lived URL with the owner's
  `ELEVENLABS_API_KEY`; the key never reaches the browser.
- **"Create my voice agent" in the panel**: with `ELEVENLABS_API_KEY` set, one button creates, through the ElevenLabs API,
  the workspace secret with the tool's Bearer, the webhook tool pointing at `/api/voice/tool`, the client tool
  `mostrar_fuentes`, and the agent with the business name, language, a multilingual voice and the allowlist of the
  app's origin plus `ALLOWED_ORIGINS`; it stores the `agent_id`. A second click updates instead of duplicating.
- **The microphone on the public page and in the widget**, with the Orb (MIT, copied from Construye with its local
  texture), the state in words, the live transcript and the citation chips, as in Construye after its polish.
- **A daily cap of voice minutes** (`DAILY_VOICE_MINUTE_LIMIT`) enforced by the signed-URL route.

## Impact

- New: `app/api/voice/**`, `lib/voice/` (tool, signed URL, provisioning), `components/voice/` (panel and Orb, ported),
  `public/voice/perlin-noise.png`, tests and E2E with a test SDK that never reaches a production build,
  `docs/voice-agent.md`.
- Changed: the admin panel (the button and the agent status), the public page and the widget (the microphone), the
  README (status row, a capture and a section).
