# The words of the voice answers

`docs/voice-agent.md` describes the whole voice lane: the one-click agent, the tool the agent calls, the signed URL,
the allowlist, the cap of minutes and the browser side. This document is the short contract of the answers of that
lane, written by the change `voice-owner-words`: which code a failure carries, and where the names of the environment
are read.

## 1. The codes

| Answer | Body | Who reads it |
|---|---|---|
| `POST /api/admin/voice` without the key of ElevenLabs or without the secret of the tool | `503 {"status":"unconfigured","reason":"voice_not_configured"}` | the owner, on the voice screen |
| `POST /api/admin/voice` when ElevenLabs refuses | `503 {"status":"unavailable","reason":"voice_provider_failed"}` | the owner, on the voice screen |
| `GET /api/voice/signed-url` without the key or without the agent | `503 {"status":"unavailable","reason":"voice_unavailable"}` | a visitor |
| `GET /api/voice/signed-url` with the day spent, or with a limit below one session | `429 {"status":"limited","reason":"spent"}` or `{"status":"limited","reason":"below-session"}` | a visitor |

No answer of the two voice routes carries any other text. The visitor reads a status and a reason code, and never a
name of a variable of the environment nor a hint of which piece of the configuration is missing: the body of a failure
is the code and nothing else.

The screen of the panel (`components/admin/VoiceAgent.tsx`) reads the reason and writes it in the words of the owner:
`voice_not_configured` is "Voice is not set up yet. The person who installs Cited turns it on." with the link "For the
installer" (`/admin`), and every other failure is "ElevenLabs did not answer. Try again in a minute.". The raw `error`
of a payload is never printed, and the list of names that the route used to send is gone from the screen.

## 2. Where the installer reads the names

An installation without voice writes the names of the variables that are missing to the log of the server, once per
process, with `console.error` and the helper `writeOnce()` of `lib/admin/guard.ts`, the same one the panel uses for an
installation that is not finished:

```
the voice agent is not configured: the environment of the server is missing ELEVENLABS_API_KEY, VOICE_TOOL_SECRET
```

The page "For the installer" (`/admin`) lists every variable of `.env.example` with its state, and it is the only place
of the panel where a variable is named. No answer of `/api/admin/*` and no answer of `/api/voice/*` names one:
`tests/voice-owner-words.test.ts` walks every `route.ts` of the two trees in an installation with the panel configured
and no voice and compares its status, its headers and its body against every name of the template, read from
`.env.example` itself.

## 3. The one module of the lane a browser may import

`lib/voice/client.ts` carries the three codes. It is the only module of `lib/voice/` that a file the browser runs may
import, because the rest of the lane names the variables of the server (`ELEVENLABS_API_KEY`, `VOICE_TOOL_SECRET`,
`DAILY_VOICE_MINUTE_LIMIT`); `tests/voice-secrets.test.ts` refuses that import inside a client file, and the guard is
what moved the codes to their own module.
