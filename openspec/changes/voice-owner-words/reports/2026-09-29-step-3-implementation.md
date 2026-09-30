# Step 3: the implementation

- Date: 2026-09-29
- Change: `voice-owner-words`
- Branch: `feature/voice-owner-words`
- Agent: deepseek-harness
- Commit verified: the commit that carries this report (the routes and the log of 3.1, and the screen and its strings
  of 3.2)
- Tasks: 3.1 and 3.2 of `tasks.md`
- Red state it answers: `92542de` (the tests of step 2.1 alone)

## 3.1 The two routes and the log (decisions 1, 2 and 4)

### What changed

- `lib/voice/config.ts`: the three codes of the voice answers, `VOICE_NOT_CONFIGURED` (`voice_not_configured`),
  `VOICE_PROVIDER_FAILED` (`voice_provider_failed`) and `VOICE_UNAVAILABLE` (`voice_unavailable`), so the routes and
  the screen share one spelling.
- `lib/admin/guard.ts`: `writeOnce()` is exported. It is the helper the keys lane already uses for an unfinished
  installation, and the voice route writes the names of its own missing variables with it (decision 2).
- `app/api/admin/voice/route.ts`: `POST` answers
  `503 {"status": "unconfigured", "reason": "voice_not_configured"}` and writes
  `the voice agent is not configured: the environment of the server is missing <names>` to the log of the server once
  per process; when the provider fails it answers `503 {"status": "unavailable", "reason": "voice_provider_failed"}`
  and the text of the provider error (`outcome.message`) is no longer part of the answer, which is the rule of the keys
  lane. `GET` is untouched: its booleans (`key`, `toolSecret`) name no variable.
- `app/api/voice/signed-url/route.ts`: every answer that is not a signed URL carries a status and a reason code only.
  The missing key and the missing agent answer `503 {"status": "unavailable", "reason": "voice_unavailable"}` instead
  of `missing: ["ELEVENLABS_API_KEY"]` / `missing: ["ELEVENLABS_AGENT_ID"]`; a provider that fails and an answer
  without a signed URL answer the same code and never their message; the `429` of the cap answers
  `{"status": "limited", "reason": "below-session" | "spent"}` instead of carrying `limit` and the sentence that named
  `DAILY_VOICE_MINUTE_LIMIT`.

### An amendment to the test of step 2.1, and why

The red test of step 2.1 called `vi.resetModules()` before importing the route, the technique of
`tests/admin-unconfigured-words.test.tsx`, to start the set of `writeOnce()` empty. In this file that broke the module
identity: after a reset, the dynamically imported route carried its own copy of `lib/voice/transport.ts`, different
from the one the file imported statically, so `useVoiceTransport(double)` of the test never reached the route. With a
key and a secret in the environment, the route then went past the unconfigured answer and asked for **the real
`fetch`**, which tried to open `https://api.elevenlabs.io`. The run of `92542de` recorded the consequence (the double
saw no call, `expected [] to have a length of 1`) and the attempt never reached the provider.

The test no longer resets the modules. The "once" of the log is now proved with the one line no other test of this
file asks for (the key is set and only the secret of the tool is missing), so the set of the process starts without
that line and the two presses of the test are the only ones that can write it. And a `beforeEach` of the file installs
a global `fetch` that fails with `a test tried to reach the network`: a test that forgets to install the double now
fails instead of opening a socket. No test of the voice lane calls ElevenLabs.

### Command and output

```
$ npx vitest run tests/voice-owner-words.test.ts --reporter=verbose
 ✓ has names to look for, taken from the template 5ms
 ✓ answers voice_not_configured from the route and writes the names to the log once 88ms
 ✓ answers voice_provider_failed when ElevenLabs refuses, and never the text of the provider 64ms
 ✓ answers voice_unavailable to a visitor, for the missing key and for the missing agent 52ms
 ✓ keeps the name of the variable of the daily cap out of the 429 of a visitor 58ms
 ✓ answers every route of the panel and of the voice with no name of the template 78ms
 × shows voice_not_configured in the words of the owner and links For the installer (en) 64ms
 × shows voice_provider_failed in the words of the owner and never the raw error (en) 11ms
 × shows voice_not_configured in the words of the owner and links For the installer (es) 9ms
 × shows voice_provider_failed in the words of the owner and never the raw error (es) 11ms
 Test Files  1 failed (1)
      Tests  4 failed | 6 passed (10)
exit=1

$ npm run lint
> eslint .
exit=0

$ npm run typecheck
tests/voice-owner-words.test.ts(315,59): error TS2551: Property 'voiceNotConfigured' does not exist on type 'VoiceStrings'. Did you mean 'notConfigured'?
tests/voice-owner-words.test.ts(331,59): error TS2339: Property 'voiceProviderFailed' does not exist on type 'VoiceStrings'.
exit=2
```

The six route tests of the file, the walk included, are green: the walk now finds no name of `.env.example` in the
status, the headers or the body of any answer of `/api/admin/**` and `/api/voice/**` except in the JSON of "For the
installer", and it reproduces the two codes (`voice_not_configured` and `voice_unavailable`). The four failures that
are left are the screen, which is task 3.2, and the typecheck is red for the same two strings.

## 3.2 The screen and its strings (decision 3)

### What changed

- `lib/i18n/voice.ts`: `agentMissing` ("The server needs {variables} to create the agent.") is gone, with the list of
  names it interpolated, and two strings arrive with the words of the design:
  `voiceNotConfigured` ("Voice is not set up yet. The person who installs Cited turns it on." / "La voz todavía no está
  activada. Quien instala Cited la enciende.") and `voiceProviderFailed` ("ElevenLabs did not answer. Try again in a
  minute." / "ElevenLabs no respondió. Inténtalo en un minuto.").
- `components/admin/VoiceAgent.tsx`: the outcomes `missing` (a list of variables) and `failed` (the raw `error` of the
  payload) are replaced by `not-configured` and `provider-failed`, read from `reason` (`VOICE_NOT_CONFIGURED` of
  `lib/voice/config.ts`). `voice_not_configured` shows the sentence of the owner and the link "For the installer"
  (`/admin`, the `navSetup` of `lib/i18n/admin.ts`: the same link and the same words as the screen of the keys), and
  every other failure (the `voice_provider_failed` code included) shows the sentence of the provider that did not
  answer. The raw `error` of a payload is no longer read, so it can never be printed, and the list of names it used to
  interpolate is gone. No style, no class and no other markup of the screen is touched.

### Command and output

```
$ npx vitest run tests/voice-owner-words.test.ts --reporter=verbose
 ✓ has names to look for, taken from the template 5ms
 ✓ answers voice_not_configured from the route and writes the names to the log once 110ms
 ✓ answers voice_provider_failed when ElevenLabs refuses, and never the text of the provider 80ms
 ✓ answers voice_unavailable to a visitor, for the missing key and for the missing agent 66ms
 ✓ keeps the name of the variable of the daily cap out of the 429 of a visitor 75ms
 ✓ answers every route of the panel and of the voice with no name of the template 93ms
 ✓ shows voice_not_configured in the words of the owner and links For the installer (en) 250ms
 ✓ shows voice_provider_failed in the words of the owner and never the raw error (en) 28ms
 ✓ shows voice_not_configured in the words of the owner and links For the installer (es) 32ms
 ✓ shows voice_provider_failed in the words of the owner and never the raw error (es) 12ms
 Test Files  1 passed (1)
      Tests  10 passed (10)
   Duration  6.02s (environment 37%, import 28%, transform 16%, tests 13%, setup 6%)
exit=0

$ npm run typecheck
> next typegen && tsc --noEmit
Generating route types...
✓ Types generated successfully
exit=0

$ npm run lint
> eslint .
exit=0
```

## Verdict

Tasks 3.1 and 3.2 are done. The three answers that named a variable of the environment no longer name one: the two
routes answer reason codes, the names of the missing variables go once to the log of the server (`console.error`) and
stay on the page "For the installer", and the screen of the voice agent translates both codes into the words of the
owner with the link to that page. The ten tests of the change are green, with the types and the lint.
