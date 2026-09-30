## Decisions

1. **Codes.** `POST /api/admin/voice` answers `503 { "status": "unconfigured", "reason": "voice_not_configured" }`
   when the key of ElevenLabs or the tool secret is missing, and `503 { "status": "unavailable", "reason":
   "voice_provider_failed" }` when the provider fails; the text of a provider error never travels back (the rule of the
   keys lane). `GET /api/admin/voice` keeps its booleans (`key`, `toolSecret`), which name no variable.
2. **The log.** The names of the missing variables are written once per process with `console.error`, the same helper
   the keys lane uses for an unfinished installation, so the installer finds them in the log of the server.
3. **The screen.** `VoiceAgent.tsx` reads `reason` and shows `voiceNotConfigured` ("Voice is not set up yet. The person
   who installs Cited turns it on." / "La voz todavía no está activada. Quien instala Cited la enciende.") with a link
   to "For the installer", or `voiceProviderFailed` ("ElevenLabs did not answer. Try again in a minute." / "ElevenLabs
   no respondió. Inténtalo en un minuto."). The raw `error` of a payload is never printed.
4. **The public route.** `GET /api/voice/signed-url` answers a visitor `503 { "status": "unavailable", "reason":
   "voice_unavailable" }` for every missing piece; the widget already hides the microphone on an answer that is not 200.
5. **Tests.** `tests/voice-owner-words.test.ts` imports every `route.ts` under `app/api/admin` and `app/api/voice`,
   calls each exported method with a signed-in request in an environment with the panel configured and no voice, and
   checks that no name of `.env.example` appears in the status, the headers or the body. The browser suite keeps its
   `allow: [503]` for the voice route.
