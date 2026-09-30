# Step 3: the implementation

- Date: 2026-09-29
- Change: `voice-owner-words`
- Branch: `feature/voice-owner-words`
- Agent: deepseek-harness
- Commit verified: the commit that carries this report (the routes and the log of 3.1)
- Tasks: 3.1 of `tasks.md` (3.2 writes its own section of this report)
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

## Verdict

Task 3.1 is done: the two routes answer reason codes, the names of the missing variables go once to the log of the
server and the walk of every route of the panel and of the voice finds no name of the template outside the JSON of
"For the installer".
