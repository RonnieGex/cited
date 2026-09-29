## Decisions

1. **Port, do not reinvent.** The panel, the Orb (MIT header kept), the texture script, the state mapping, the source
   validator and label, the echo by count and the test-SDK guard come from Construye's `components/voice/` and
   `scripts/verify-no-test-sdk.mjs` at `master` `0d1b555`, adapted to the kit and the settings of the business. Each
   ported file names its origin in a header comment. Construye is read only.
2. **ElevenLabs API** (`https://api.elevenlabs.io`), the shapes proven in `~/.claude/playbooks/elevenlabs-agentes.md`:
   `POST /v1/convai/secrets` (value `Bearer <secret>`), `POST /v1/convai/tools` webhook with the secret in its
   `Authorization` header and `conversation_id` bound to `system__conversation_id`, `POST /v1/convai/tools` client tool
   `mostrar_fuentes` with `expects_response: false`, `POST /v1/convai/agents/create` with `eleven_flash_v2_5`, then
   `PATCH` for updates; `platform_settings.auth.allowlist` with hostnames only. A property with `constant_value` carries
   no `description`.
3. **Languages** (Franc, 2026-09-29, English first): the agent's first language is the business language (English by
   default) and the other of English and Spanish is added as a second language with the language detection that the
   current ElevenLabs documentation describes, so a caller who speaks Spanish is answered in Spanish; the implementer
   cites the page of the documentation it followed, and Fable checks both languages in the real session.
4. **Prompt of the agent**, in the business language: answer only with the server tool, one short spoken answer, call
   `mostrar_fuentes` with the citations, never repeat the answer after it returns (the lesson of Construye's real
   session of 2026-09-29).
5. **Voice minutes** counted per UTC day from the start of each signed URL with a conservative five minutes per
   session until the call ends; the counter lives in the store.
6. **Tests** use a double of the ElevenLabs API and a test SDK; no test reaches ElevenLabs. Fable runs one real session
   against a real agent after the review, from the local build.
