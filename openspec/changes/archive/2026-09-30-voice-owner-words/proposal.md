## Why

`provider-keys-in-panel` brought the requirement "The owner never reads a variable name in an answer of the panel"
into `main`, which already carried `elevenlabs-voice-agent`. The voice lane was built before that requirement and, on
the merged tree, three answers break it: `POST /api/admin/voice` answers an installation without voice with
`missing: ["ELEVENLABS_API_KEY", "VOICE_TOOL_SECRET"]` and the text "the voice agent needs ELEVENLABS_API_KEY and ...";
the panel screen `components/admin/VoiceAgent.tsx` prints that list to the owner; and the public
`GET /api/voice/signed-url` hands `missing: ["ELEVENLABS_API_KEY"]` or `["ELEVENLABS_AGENT_ID"]` to any visitor. Found
by Fable while merging the keys lane on 2026-09-29; the merge stays local until this change lands.

## What Changes

- The panel route answers with the reason code `voice_not_configured` and owner words; the names reach the server log
  once and the page "For the installer", nowhere else.
- The panel screen maps each code of the voice route to a sentence in the owner's words and links "For the installer".
- The public route answers a visitor with `503` and the reason code `voice_unavailable`, with no name of any variable
  and no hint of what is missing.
- A test walks every route of `/api/admin/**` and `/api/voice/**` in an installation with the panel configured and no
  voice, and checks every answer against every variable name of `.env.example`.

## Impact

- Code: `app/api/admin/voice/route.ts`, `app/api/voice/signed-url/route.ts`, `components/admin/VoiceAgent.tsx`,
  `lib/i18n/admin.ts`, the tests of the voice routes, the list of the browser suite.
- No table, no new dependency, no change to the widget script or the CSP.
