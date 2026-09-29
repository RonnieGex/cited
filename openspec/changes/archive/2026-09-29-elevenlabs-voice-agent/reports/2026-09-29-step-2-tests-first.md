# Step 2 — the red tests of the voice agent

- Date: 2026-09-29
- Change: `elevenlabs-voice-agent` (OpenSpec)
- Branch: `feature/elevenlabs-voice-agent`
- Agent: deepseek-harness
- Tasks: 2.1 and 2.2
- Verified against: `aa84069` ("Record the green battery of the base in the report of step 1")

## What the task asks

2.1 red unit and route tests for every scenario of `specs/voice-agent/spec.md` with the API double; 2.2 a red E2E with
the test SDK: the microphone button, the Orb loaded on demand, the four states, the written question echoed once, the
chips, and the production-build guard.

## What was written, before any line of the feature

| File | What it pins |
| --- | --- |
| `tests/fakes/elevenlabs-react.tsx` | the test SDK: the slice of `@elevenlabs/react` the panel uses, driven from `window.__katalisVoiceFake`, no network and no timer |
| `tests/fakes/elevenlabs-api.ts` | the double of the ElevenLabs API: it records every call and answers the shapes of the playbook and of `POST /v1/convai/agents/create` |
| `tests/voice-sources.test.ts` | the validator of `mostrar_fuentes` and the label of a chip, named by section |
| `tests/voice-state.test.ts` | the four states in words, the idle one, the text-only one and `prefers-reduced-motion` |
| `tests/voice-tool.test.ts` | `POST /api/voice/tool`: 401 without the Bearer and no model call, one thread per call, the plain text with its citations, the guards of the pipeline |
| `tests/voice-signed-url.test.ts` | `GET /api/voice/signed-url`: the URL alone, 503 naming the missing variable, 429 at the daily cap of minutes, a bucket per UTC day |
| `tests/voice-provision.test.ts` | the one-click agent: secret, webhook tool, client tool, agent; the second press updates; English first with Spanish second; the prompt; the allowlist |
| `tests/voice-panel.test.tsx` | the launcher, the four states, the question echoed once, the chips, the refused microphone, 429, 503 |
| `tests/voice-build-guard.test.ts` | `scripts/verify-no-test-sdk.mjs` over fixture trees, in both build orders |
| `tests/voice-secrets.test.ts` | the key is read by the server only and never reaches a file the browser runs |
| `e2e/voice.spec.ts` | the browser: the microphone button, the Orb on demand, the four states, the echo once, the chips, the widget and axe |

## Commands and real output

### The unit and route tests, red

```
$ npx vitest run tests/voice-sources.test.ts tests/voice-state.test.ts tests/voice-tool.test.ts \
    tests/voice-signed-url.test.ts tests/voice-provision.test.ts tests/voice-panel.test.tsx \
    tests/voice-build-guard.test.ts tests/voice-secrets.test.ts

 FAIL  tests/voice-panel.test.tsx [ tests/voice-panel.test.tsx ]
 FAIL  tests/voice-provision.test.ts [ tests/voice-provision.test.ts ]
 FAIL  tests/voice-secrets.test.ts [ tests/voice-secrets.test.ts ]
 FAIL  tests/voice-signed-url.test.ts [ tests/voice-signed-url.test.ts ]
 FAIL  tests/voice-sources.test.ts [ tests/voice-sources.test.ts ]
 FAIL  tests/voice-state.test.ts [ tests/voice-state.test.ts ]
 FAIL  tests/voice-tool.test.ts [ tests/voice-tool.test.ts ]
 FAIL  tests/voice-build-guard.test.ts > the guard of the test SDK > fails a production build whose output carries a marker of the test SDK
 ...
 Test Files  8 failed (8)
      Tests  7 failed | 1 passed (8)
```

Seven of the eight files fail at collection because they import a module this change has not written yet
(`@/components/voice/sources`, `@/lib/voice/tool`, `@/app/api/voice/tool/route`, `@/lib/i18n/voice`, …). The eighth,
`tests/voice-build-guard.test.ts`, runs: its seven tests fail because `scripts/verify-no-test-sdk.mjs` and
`scripts/build-e2e.mjs` do not exist, and the one that passes is the fixture without any build output, which is exactly
what a missing script looks like.

The whole log is `katalis-dev/tasks/_community-09-step2-unit-red.log`.

### The browser tests, red

The production build of this state cannot type check, because the red tests import modules that do not exist yet, so
`npm run build` fails and neither of the two servers of `playwright.config.ts` can start. The red of 2.2 was taken
against the development server instead, and the temporary configuration used for it was deleted before this commit:

```
$ npm run dev -- --port 3100        (EMBEDDINGS_PROVIDER=fake, CHAT_PROVIDER=fake, DATABASE_URL=.data/e2e-voice-red.sqlite)
$ npx playwright test --config playwright.red.config.ts

  7 failed
    [public] › e2e\voice.spec.ts:78:5 › the microphone button opens the panel and the Orb arrives on demand
    [public] › e2e\voice.spec.ts:102:5 › the panel shows the four states in words
    [public] › e2e\voice.spec.ts:127:5 › a written question is echoed once
    [public] › e2e\voice.spec.ts:138:5 › the chips are named by section and somebody else's page is dropped
    [public] › e2e\voice.spec.ts:163:5 › the widget offers the same microphone
    [public] › e2e\voice.spec.ts:171:5 › the signed URL of the server names the missing variable and the browser never gets the key
    [public] › e2e\voice.spec.ts:201:5 › the voice panel passes axe at level A and AA
```

Every one of the seven fails for the reason the feature is missing: `getByTestId('voice-launcher')` never resolves, and
`/api/voice/signed-url` answers `404` instead of `503`. The whole log is
`katalis-dev/tasks/_community-09-step2-e2e-red.log`.

### The dependencies the tests need

`npm ci` at step 0 installed the base. The test SDK replaces `@elevenlabs/react` at build time and the panel draws the
Orb with three.js, so the four packages the ported panel needs were added before the red run, with
`npm install @elevenlabs/react@^1.16.0 three@^0.186.1 @react-three/fiber@^9.8.1 @react-three/drei@^10.7.9`:
187 packages added, 0 vulnerabilities, and the same `EBADENGINE` warnings of the machine (node v24.11.0 against the
`>=24.15.0` of the project) that step 0 already recorded. The versions are the ones Construye runs in production.

The real `@elevenlabs/client@1.26.0` that arrives with the React package carries the string `https://api.elevenlabs.io`
in its browser bundle, which is what the build guard uses as the marker of the real package; the guard's own markers
are `__katalisVoiceFake`, `failNextStart` and `failEveryStart` of the test SDK.

## Verdict

Tasks 2.1 and 2.2 are done: every scenario of the spec has a test that fails on this commit for the reason the feature
is absent, and no test of this change can reach ElevenLabs or a model provider.

## Commit

The tests, the fakes and the two packages files travel in the commit that closes step 2.
