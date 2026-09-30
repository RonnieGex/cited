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

## Amendment after the review of Codex (2026-09-29, `katalis-dev/tasks/revision-community-15.md`)

6. **The delta of `voice-agent` is `MODIFIED`.** The first contract added a requirement next to two that still ordered
   the signed URL to answer "naming the missing variable"; archived, the spec in force would hold both. The delta now
   modifies "The browser never sees the ElevenLabs key" and "The cap is checked before the configuration" in full, and
   adds nothing. With no `## ADDED Requirements` in the change, the guard of `tests/readme.test.ts` is right as it was:
   it goes back to its text at `2f9a75b`, and the suite is green with it.
7. **A business without a name has its own code.** `POST /api/admin/voice` answers `409 { "status": "incomplete",
   "reason": "business_unnamed" }` before any request to ElevenLabs. The screen shows `voiceBusinessUnnamed` ("Give
   your business a name first: the agent introduces itself with it." / "Primero ponle nombre a tu negocio: el agente se
   presenta con él.") with a link to the page "Business" (`/admin/business`). `voice_provider_failed` is only for an
   answer of the provider.
8. **The booleans of `GET /api/admin/voice` stay** (decision 1). That route is behind the panel session, the booleans
   name no variable, and the page "For the installer" already shows the same person which piece is missing, by name.
   The rule that no answer says which piece is missing is for the visitor (`voice-agent`), not for the signed-in owner.
9. **The suite is stable on Windows.** A test that removes a folder holding a store closes the store first and removes
   with `rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })`; every test of the voice cap
   uses its own temporary folder. `npm test` passes twice in a row on Windows with Node 24.15 or newer (the engine of
   `package.json`; if the Node of the system is older, the run uses `npx -y -p node@24 ...` and the report shows
   `node -v`), and once in a `node:24` Linux container.
10. **The link of the voice screen.** The link to "For the installer" and to "Business" carries the classes of the
    other links of the panel; that is the only style this change touches, and the delivery says so.
