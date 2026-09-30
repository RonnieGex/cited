# Step 2.1: the tests first, red before the code

- Date: 2026-09-29
- Change: `voice-owner-words`
- Branch: `feature/voice-owner-words`
- Agent: deepseek-harness
- Commit of the red state: the commit that carries this report (the test file alone, before any line of the
  implementation)
- Tasks: 2.1

## The test file

`tests/voice-owner-words.test.ts` (design decision 5), written before the code:

- the walk: `import.meta.glob(["../app/api/admin/**/route.ts", "../app/api/voice/**/route.ts"], { eager: true })`,
  every exported method called with a signed-in request (`cookie: cited_admin=<token>` and `origin`) in an installation
  with the panel configured and no voice (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `DAILY_VOICE_MINUTE_LIMIT=30`, a
  temporary store, no `ELEVENLABS_*`), and its **status, its headers and its body** compared against every name read
  from `.env.example` itself. `GET /api/admin/setup` is the one answer that names them (the JSON that feeds "For the
  installer") and the test proves it is the only one: it asserts that this answer carries more than twenty names and
  that every other answer carries none.
- `POST /api/admin/voice`: the code `voice_not_configured` with no name in the body and the names written to
  `console.error` exactly once across two calls (with `vi.resetModules()` so the set of `lib/admin/guard.ts` starts
  empty, the same technique as `tests/admin-unconfigured-words.test.tsx`); and the code `voice_provider_failed` when
  the double of ElevenLabs refuses the secret, with the text of the provider out of the answer.
- `GET /api/voice/signed-url`: `voice_unavailable` for the missing key and for the missing agent, and the `429` of the
  cap (the limit below one session and a day that is spent) with no name of the template in its body.
- `VoiceAgent.tsx` in jsdom, with `fetch` stubbed: both codes in English and Spanish, each one in the words of the
  owner, the link "For the installer" (`/admin`) next to `voice_not_configured`, no name of the template in the
  rendered text and never the raw `error` of a payload.

## Command and output

```
$ npx vitest run tests/voice-owner-words.test.ts --reporter=verbose
 ✓ has names to look for, taken from the template 3ms
 × answers voice_not_configured from the route and writes the names to the log once 83ms
   → expected { status: 'unconfigured', …(2) } to deeply equal { status: 'unconfigured', …(1) }
 × answers voice_provider_failed when ElevenLabs refuses, and never the text of the provider 298ms
   → expected { status: 'unavailable', …(1) } to deeply equal { status: 'unavailable', …(1) }
 × answers voice_unavailable to a visitor, for the missing key and for the missing agent 6ms
   → expected { status: 'unconfigured', …(1) } to deeply equal { status: 'unavailable', …(1) }
 × keeps the name of the variable of the daily cap out of the 429 of a visitor 3ms
   → expected { status: 'limited', …(3) } to deeply equal { status: 'limited', …(1) }
 × answers every route of the panel and of the voice with no name of the template 78ms
   → POST http://localhost/api/admin/voice: {"status":"unconfigured","missing":["ELEVENLABS_API_KEY","VOICE_TOOL_SECRET"],"error":"the voice agent needs ELEVENLABS_API_KEY and VOICE_TOOL_SECRET in the environment of the server"}: expected [ 'VOICE_TOOL_SECRET', …(1) ] to deeply equal []
 × shows voice_not_configured in the words of the owner and links For the installer (en) 63ms
   Expected element to have text content: undefined
   Received: The server needs ELEVENLABS_API_KEY, VOICE_TOOL_SECRET to create the agent.
 × shows voice_provider_failed in the words of the owner and never the raw error (en) 10ms
   Expected element to have text content: undefined
   Received: The agent could not be created.
 × shows voice_not_configured in the words of the owner and links For the installer (es) 9ms
   Expected element to have text content: undefined
   Received: El servidor necesita ELEVENLABS_API_KEY, VOICE_TOOL_SECRET para crear el agente.
 × shows voice_provider_failed in the words of the owner and never the raw error (es) 9ms
   Expected element to have text content: undefined
   Received: No se pudo crear el agente.
 Test Files  1 failed (1)
      Tests  9 failed | 1 passed (10)
   Duration  10.14s (tests 66%, environment 14%, import 9%, transform 8%, setup 2%)
exit=1
```

The nine failures are the three answers that name a variable today, reproduced one by one before the first line of the
implementation:

1. `POST /api/admin/voice` answers `{status, missing, error}`, not `{status, reason}`, and its text carries
   `ELEVENLABS_API_KEY` and `VOICE_TOOL_SECRET`.
2. the same route answers the text of the provider error when ElevenLabs refuses.
3. `GET /api/voice/signed-url` answers `{status: "unconfigured", missing: ["ELEVENLABS_API_KEY"]}` instead of
   `{status: "unavailable", reason: "voice_unavailable"}`.
4. the `429` of the cap carries `limit` and an `error` that names `DAILY_VOICE_MINUTE_LIMIT`.
5. the walk finds `VOICE_TOOL_SECRET` and `ELEVENLABS_API_KEY` in the body of the voice route.
6. to 9. the screen prints the list of names and the raw error: the strings `voiceNotConfigured` and
   `voiceProviderFailed` do not exist yet, so the component test reads `undefined`.

`npm run typecheck` is red at this commit too, for the same reason the screen tests fail: the two properties do not
exist in `VoiceStrings` yet, the shape of the red the keys lane recorded for its own first tests.

```
$ npm run typecheck
> next typegen && tsc --noEmit
Generating route types...
✓ Types generated successfully
tests/voice-owner-words.test.ts(307,59): error TS2551: Property 'voiceNotConfigured' does not exist on type 'VoiceStrings'. Did you mean 'notConfigured'?
tests/voice-owner-words.test.ts(323,59): error TS2339: Property 'voiceProviderFailed' does not exist on type 'VoiceStrings'.
exit=2
```

## Verdict

Task 2.1 is done: the test of design decision 5 exists before the implementation, its red state is recorded with the
exact command and the real output, and the nine failures are exactly the answers the contract says name a variable of
the environment today.
