# The voice agent of Cited

The documents of the business, answered out loud. A visitor taps **Talk to it** on the public site or in the widget,
and ElevenLabs opens a voice session whose agent answers from the same documents and the same pipeline as the written
chat. The owner creates the agent once, with one button of the panel, and never opens the dashboard of the provider.

## 1. The one-click agent

`/admin/business` carries the voice screen. **Create my voice agent** asks `POST /api/admin/voice`, which does four
things through the API of ElevenLabs (`https://api.elevenlabs.io`, see section 3) and stores the ids in the store:

1. the workspace secret that holds `Bearer <VOICE_TOOL_SECRET>`;
2. the webhook tool that points at `/api/voice/tool` of this installation, with that secret in its `Authorization`
   header and the `conversation_id` of the call bound to `system__conversation_id`;
3. the client tool `mostrar_fuentes`, `expects_response: false`, which is what draws the citation chips in the browser;
4. the agent itself: the name of the business, its language first, the other of English and Spanish in
   `language_presets`, the `language_detection` system tool, the multilingual model `eleven_flash_v2_5` and the
   allowlist of section 5.

The second press finds the four ids in `voice_agent` and sends `PATCH` instead of `POST`: the same secret, the same two
tools and the same agent are updated, and nothing new is created. An installation that had an agent before keeps its
id, and `ELEVENLABS_AGENT_ID` still wins when the panel never created one.

## 2. The prompt, and the lesson of Construye

The prompt of the agent is written in the language of the business. It tells the agent to call the server tool for
every question, to answer in one or two short spoken sentences, never to read a URL out loud, to pass every source the
tool returned to `mostrar_fuentes`, and then to say nothing more.

That last rule is not cosmetic. `@elevenlabs/client` always sends a `client_tool_result` to the agent when a client
tool finishes, even when the tool declares `expects_response: false`, and the agent used to repeat its whole answer
after the chips appeared. The lesson was measured in a real session of Construye on 2026-09-29 and the rule is what
fixes it, with no code.

## 3. The server tool

`POST /api/voice/tool` is the door the agent uses. It requires `Authorization: Bearer <VOICE_TOOL_SECRET>`, compared in
constant time, and takes `{question, conversation_id}`. The id of the conversation becomes the `sessionId` of the
answering pipeline, so a follow-up inside one call keeps its thread and two calls never share one. The answer comes
back as plain text, which is what the agent can speak and copy:

```
answer: A tune-up of a bicycle costs 380 pesos. [1]
sources:
1. title: cafe-la-horquilla.md · Precios
   url: /#cita-1
```

The URL is relative on purpose: an agent hands a webhook tool's URLs back unchanged, so a relative URL can only ever
become a chip of this site, and `validateSources` drops anything whose origin is not the origin of the document. When
the documents do not answer, the tool answers `sources: none` with a refusal in words, and the agent is told there is
nothing to read out instead of being given something to invent.

The route carries the same guards as `/api/ask`: the ceiling of the question, the rate limit of the address, the daily
ceiling of model calls, the retention of the conversations and the forbidden topics of the settings.

## 4. The signed URL and the key

The browser never sees the key of ElevenLabs. The panel asks `GET /api/voice/signed-url`, which asks the provider for a
short-lived URL with `ELEVENLABS_API_KEY` and returns `{"url": "..."}` and nothing else. The route is the only place
where the key is read, it answers `503` naming the missing variable when the key or the agent is missing, and no
response to the browser and no file of the client carries the key or the header `xi-api-key`
(`tests/voice-secrets.test.ts`).

The session of the panel is the private WebSocket one of `@elevenlabs/react`: a signed URL opens it, and a text-only
session never asks for the microphone, which is the path of whoever cannot or does not want to speak.

## 5. The allowlist

The agent only starts a conversation from the origins the installation declares: the origin the panel is served from
plus every origin of `ALLOWED_ORIGINS`, by hostname and with no port. Anything else is refused by ElevenLabs before
the session opens. The list is written on every press of the button, so adding a site to `ALLOWED_ORIGINS` and
pressing again is the whole operation.

`platform_settings.auth.allowlist` of this project carries the hostnames of the installation and nothing else. The
agent of Construye also allows `elevenlabs.io`, which is what keeps the dashboard's own talk-to link working; this
change follows the spec, which asks for the app's origin plus `ALLOWED_ORIGINS`, and an owner who wants the talk-to
link adds that hostname to `ALLOWED_ORIGINS`.

## 6. The cap of voice minutes

Voice costs money, so the day has a ceiling: `DAILY_VOICE_MINUTE_LIMIT`, 30 minutes by default. The route of the signed
URL reserves five conservative minutes per session before it asks for the URL, whether or not the visitor uses them,
and answers `429` for the rest of the UTC day when the ceiling is reached. The counter is one row per day in
`voice_minutes` of the store, and the day starts at 00:00 UTC.

The five minutes are a reservation and not a measurement: a session that lasts twenty minutes spends five in the
counter, which is why the ceiling has to be read as "sessions of a day" and not as an exact bill. Measuring the real
duration needs the end of a call to reach the server, and the change that adds it can subtract the difference.

## 7. The variables

| Variable | What it is for | Required |
| --- | --- | --- |
| `VOICE_TOOL_SECRET` | the Bearer the server tool expects, at least a long random string of the installation | yes, to create the agent and to answer it |
| `ELEVENLABS_API_KEY` | the key of the owner, with ElevenAgents (write), Voices (read) and User (access) | yes, to create the agent and to ask for a signed URL |
| `ELEVENLABS_AGENT_ID` | pins an agent created by hand; without it the panel uses the id it stored | no |
| `ELEVENLABS_VOICE_ID` | the voice of the agent; without it the default voice of the account, which speaks the second language with the multilingual model | no |
| `DAILY_VOICE_MINUTE_LIMIT` | the voice minutes of one UTC day, 30 by default | no |
| `ALLOWED_ORIGINS` | the origins allowed to embed the widget, which are also allowed to start a conversation | no |

A key is never written in the repository, in a log or in an answer: an empty value is an absent value, and the routes
name the variable instead of its value.

## 8. The privacy note

The panel shows it under the question box, in the language of the site:

> ElevenLabs, the provider of the agent, processes your voice. Do not say personal data. The answers come from the
> documents, and the sources above are documents of this site.

What that means in practice: the audio of the visitor goes to ElevenLabs, which transcribes it and runs the agent; the
question and the answer travel to this server through `/api/voice/tool`, which stores the turn in the conversation of
the call exactly as the written chat does (with the retention of `CONVERSATION_RETENTION_DAYS`, 30 days by default);
and the citations the visitor sees are documents of this site and nothing else.

## 9. The browser side

`components/voice/` is a port of `components/voice/` of Construye, read only, and each file names its origin in a
header comment:

- `VoicePanel.tsx` is the panel: the launcher button, the state in words, the live transcript with the written question
  echoed once, the citation chips named by document and section, the written question as the path of whoever has no
  microphone, and `prefers-reduced-motion` for the animation.
- `voice-orb.tsx` loads the Orb on demand: three.js and the whole react-three tree arrive with their own chunk when the
  panel opens, and `e2e/voice.spec.ts` measures that the first load of the document does not carry them.
- `ui/orb.tsx` is the MIT component of ElevenLabs UI with its license header, served with the local texture
  `public/voice/perlin-noise.png` that `npm run texture:orb` writes byte for byte.
- `voice-state.ts` maps the states of the SDK to the four states of the Orb; `sources.ts` validates the payload of
  `mostrar_fuentes`.

## 10. The tests, and why no test calls ElevenLabs

```
npm test          # the unit, route and panel tests, with the double of the API
npm run test:e2e  # the browser suite, over the build of the test SDK
```

`npm run test:e2e` runs `npm run build:e2e`, which sets `KATALIS_VOICE_FAKE_SDK=1`: `next.config.ts` resolves
`@elevenlabs/react` to `tests/fakes/elevenlabs-react.tsx`, a deterministic double driven from
`window.__katalisVoiceFake`, and `scripts/verify-no-test-sdk.mjs` fails the build if the output of the browser carries
the real package instead of the double. The same guard fails a production build whose output carries a marker of the
double:

```
npm run build && npm run verify:no-test-sdk
```

The double of the API is `tests/fakes/elevenlabs-api.ts`: it records every call and answers the shapes of this
document, so the provisioning, the signed URL and the tool are tested without a socket.
