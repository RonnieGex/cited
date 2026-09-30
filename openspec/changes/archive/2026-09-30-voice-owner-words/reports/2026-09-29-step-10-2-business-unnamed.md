# Step 10.2: a business without a name has its own code

- Date: 2026-09-29
- Change: `voice-owner-words`
- Branch: `feature/voice-owner-words`
- Agent: deepseek-harness
- Commit verified: `ac9d3b6` (the last commit before this report)
- Task: 10.2 (design decision 7, the scenario "A business without a name" of `specs/provider-settings/spec.md`)

## The red, first

The tests were written before the code and committed alone in `9204784`; over that tree,
`npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/voice-owner-words.test.ts` answered:

```
 ❯ tests/voice-owner-words.test.ts (13 tests | 3 failed) 1176ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
 FAIL  tests/voice-owner-words.test.ts > an installation with the panel configured and no voice > answers
       business_unnamed, with no press on ElevenLabs, when the business has no name
AssertionError: expected 503 to be 409 // Object.is equality
- Expected
+ Received

    219|     expect(response.status).toBe(409);
    220|     expect(JSON.parse(text)).toEqual({ status: "incomplete", reason: "…
 FAIL  tests/voice-owner-words.test.ts > the screen of the voice agent > shows business_unnamed in the words of the
       owner and links Business (en)
Expected element to have text content:
  undefined
Received:
  ElevenLabs did not answer. Try again in a minute.
 FAIL  tests/voice-owner-words.test.ts > the screen of the voice agent > shows business_unnamed in the words of the
       owner and links Business (es)
Expected element to have text content:
  undefined
Received:
  ElevenLabs no respondió. Inténtalo en un minuto.

 Test Files  1 failed (1)
      Tests  3 failed | 10 passed (13)
exit=1
```

The first failure is the whole Major 3 of the review: with the key and the secret present and no business row, the route
answered `503 voice_provider_failed` although the double of ElevenLabs had received nothing, and the screen said that
ElevenLabs did not answer. The other two are the two languages of the screen, where the sentence of the business did not
exist yet.

## The code

| File | What changed |
| --- | --- |
| `lib/voice/client.ts` | the fourth code, `BUSINESS_UNNAMED = "business_unnamed"`, next to the three that were already there |
| `lib/voice/agent.ts` | `ProvisionOutcome` gains `{ status: "unnamed" }`; `provisionVoiceAgent()` answers it when the business is `null` or its name is empty, before the origin of the panel is read and before the transport is used, so no request reaches ElevenLabs |
| `app/api/admin/voice/route.ts` | the `unnamed` outcome answers `409 { "status": "incomplete", "reason": "business_unnamed" }`; the diagnostics of the installer and the log are untouched |
| `lib/i18n/voice.ts` | `voiceBusinessUnnamed`: "Give your business a name first: the agent introduces itself with it." / "Primero ponle nombre a tu negocio: el agente se presenta con él." |
| `components/admin/VoiceAgent.tsx` | a fourth outcome, `business-unnamed`, read from the `409` and its reason, with the link to "Business" (`/admin/business`) and the classes of the other links of the panel |

`voice_provider_failed` is left for an answer of the provider, which is what decision 7 asks, and the missing key or
secret still answers `voice_not_configured` before anything reads the business: the scenario of the spec is voice that
is set up.

## The green

```
$ npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/voice-owner-words.test.ts
 Test Files  1 passed (1)
      Tests  13 passed (13)
   Duration  17.78s
exit=0
```

The three new tests are green, and with them the ten of the file: the route answers `409` with
`{"status":"incomplete","reason":"business_unnamed"}`, the double of ElevenLabs records zero calls, no name of
`.env.example` appears in the body, the body never says "ElevenLabs", and the screen shows the sentence of the owner in
English and Spanish with a link named "Business" / "Negocio" to `/admin/business` and never the sentence of the provider
that did not answer.

The route test is the proof of "no request to the double of ElevenLabs": the transport of
`tests/fakes/elevenlabs-api.ts` records every call and the test asserts `double.calls` is empty. The global `fetch` of
the file still fails with "a test tried to reach the network" if any test forgets the double, so no test of this report
opened a socket.

## Verdict

Task 10.2 is done: red first in `9204784` with the three failures of the missing code, then green with the fourth code,
the `409` of the route and the sentence and the link of the screen in the two languages.
