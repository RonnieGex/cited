# Step 3 — the implementation of the voice agent

- Date: 2026-09-29
- Change: `elevenlabs-voice-agent` (OpenSpec)
- Branch: `feature/elevenlabs-voice-agent`
- Agent: deepseek-harness
- Tasks: 3.1, 3.2 and 3.3
- Verified against: `2181813`, `afee387` and `5d35aca`, over the red tests of `2ec961e`

## What the task asks

3.1 the server tool and the signed URL with the minute cap (decision 5); 3.2 the provisioning from the panel
(decisions 2, 3 and 4); 3.3 the ported panel and Orb on the public page and in the widget, and the build guard
(decision 1).

## 3.1 The server tool and the signed URL — `2181813`

| File | What it is |
| --- | --- |
| `lib/voice/config.ts` | the endpoint of ElevenLabs, the five minutes a session reserves, the ceiling of the day, and `declared()`, which answers a variable and never its value |
| `lib/voice/secret.ts` | the Bearer of the tool, compared with `timingSafeEqual`; an installation without a secret refuses every call |
| `lib/voice/minutes.ts` | `reserveSession()`: one row per UTC day in the store, five minutes per session |
| `lib/voice/transport.ts` | the only seam to `https://api.elevenlabs.io`; the tests install the double here |
| `lib/voice/tool.ts` | the answer of `answering` with its guards written as plain text for the agent, and the relative URL of every citation |
| `app/api/voice/tool/route.ts` | `POST`, Bearer in constant time, `{question, conversation_id}`, `text/plain` |
| `app/api/voice/signed-url/route.ts` | `GET`, `503` naming the missing variable, `429` at the cap, and `{url}` alone |
| `lib/store/index.ts` | two tables and five methods, additive: `voice_minutes` and the counter of the day, `voice_agent` with the four ids |

The store keeps the counter and the ids, as decision 5 and the "second click" scenario ask; the two tables are created
with the same `CREATE TABLE IF NOT EXISTS` block as the rest of the schema, so an installation that upgrades gets them
on the next open.

## 3.2 The one-click agent — `afee387`

`lib/voice/agent.ts` creates or updates, in this order, the workspace secret, the webhook tool, the client tool
`mostrar_fuentes` and the agent, and stores the four ids. The second press finds them in the store and sends `PATCH`
instead of `POST`, which is exactly what the scenario "A second click updates" measures.

The languages are the ones of the current documentation of ElevenLabs, which the report quotes:

- [Language](https://elevenlabs.io/docs/eleven-agents/customization/voice/customization/language): "Set
  `conversation_config.agent.language` for the primary language and add entries to `conversation_config.language_presets`
  for each additional language. Each preset can override the first message and other conversation config fields per
  language". The agent of an English business is created with `language: "en"` and one preset, `es`, that carries the
  Spanish welcome of the business; a business in Spanish gets the other way round. The same page records that
  "Additional languages switch the agent to use the v2.5 Multilingual model", which is why the TTS model is
  `eleven_flash_v2_5` of the playbook.
- [Language detection](https://elevenlabs.io/docs/eleven-agents/customization/tools/system-tools/language-detection):
  the system tool `language_detection` is what switches the output to the language of the caller, and it has to be
  added to the agent explicitly ("This system tool is not enabled automatically"). The request carries it as
  `conversation_config.agent.prompt.built_in_tools.language_detection` with
  `params.system_tool_type: "language_detection"`, the shape of the API reference. The same page recommends "enabling
  all languages for an agent and enabling the language detection system tool"; this change enables the two languages
  of the product, because they are the two the business writes in.

`ELEVENLABS_VOICE_ID` was added to `.env.example`, empty, for an owner who wants a voice trained in Spanish: the
documentation's best practice is to pick a voice per language, and without the variable the agent keeps the default
voice of the account, which speaks the second language through the multilingual model.

`app/api/admin/voice/route.ts` is the guarded route behind the session of `/admin`, and
`components/admin/VoiceAgent.tsx` is the one button, on the business screen, where the name and the language the agent
takes live. The panel navigation of `components/admin/AdminNav.tsx` was not touched: the other lane of this round is
working on it.

## 3.3 The panel, the Orb and the guard — `5d35aca`

Ported from Construye, read only, each file with the header that names its origin:

| File | Origin |
| --- | --- |
| `components/ui/orb.tsx` | `components/ui/orb.tsx`, the MIT component of ElevenLabs UI, with its header and the three documented changes of this copy |
| `components/voice/voice-orb.tsx` | `components/voice/voice-orb.tsx` |
| `components/voice/voice-state.ts` | `components/voice/voice-state.ts`, with the words in the two languages of Cited |
| `components/voice/sources.ts` | `components/voice/sources.ts`, adapted to the relative URLs this server returns |
| `components/voice/VoicePanel.tsx` | `components/voice/voice-panel.tsx`, with the signed URL instead of a public agent id |
| `scripts/verify-no-test-sdk.mjs` | `scripts/verify-no-test-sdk.mjs` |
| `public/voice/perlin-noise.png` | the texture of `public/voice/`, and `scripts/generate-orb-texture.mjs` reproduces it byte for byte (SHA-256 `8bd5a97c056a46fb3ac554f5887985db4588e321341926be271bd32f28925780` in both repositories) |

What changed with respect to Construye, and why:

- The session starts with a signed URL over `websocket`. In `@elevenlabs/react@1.16.0` the type
  `PrivateWebSocketSessionConfig` is the one that accepts a `signedUrl`; `PrivateWebRTCSessionConfig` needs a
  `conversationToken`, which this change does not ask for. A signed URL is what the spec and `docs/security.md` ask for.
- The words travel in `lib/i18n/voice.ts`, in English and in Spanish, because the product is English first with a
  Spanish twin; Construye is Spanish only.
- The chips are named by the section: the server tool writes `title: <document> · <section>` and a relative
  `url: /#cita-<n>`, the validator drops anything that is not of this origin, and when the title carries no section the
  anchor names it.
- `ELEVENLABS_*` never appears in a file the browser runs: `tests/voice-secrets.test.ts` reads the whole client tree
  and the panel only knows `/api/voice/signed-url`.

The build guard works in both orders:

- `npm run build` → `npm run verify:no-test-sdk`: no marker of the test SDK anywhere in `.next`, and the real package
  present in the browser output.
- `npm run build:e2e` (which sets `KATALIS_VOICE_FAKE_SDK=1` and resolves `@elevenlabs/react` to
  `tests/fakes/elevenlabs-react.tsx`) runs the guard itself with `--expect-test-sdk`: the marker is in the browser
  output and the real package is not, or the build fails and the browser suite never starts.
- Both modes also fail when the browser output carries `xi-api-key`, the header of the provider.

The scope of the marker of the real package is the browser output (`.next/static`) and not the whole tree, because the
server of this project legitimately names `api.elevenlabs.io`: that is the API its routes call. The marker of the test
SDK is looked for in the whole output, because a leak anywhere is a leak. This is written in the script.

`lib/headers/csp.ts` gained three directives, and each one has a reason: `connect-src` names
`https://api.elevenlabs.io` and `wss://api.elevenlabs.io`, the endpoints of the session this server hands out;
`worker-src 'self' blob:` is where the SDK loads its audio worklet when no path is given (`createWorkletModuleLoader`
reads the source from a blob); `media-src 'self' blob:` is the audio the agent plays. `docs/security.md` records the
change and `tests/csp.test.ts` pins it (step 4). The policy of `script-src` was not touched: `strict-dynamic` with the
nonce of Next stays as it was.

## Commands and real output

### The voice suite, green

```
$ npx vitest run tests/voice-sources.test.ts tests/voice-state.test.ts tests/voice-tool.test.ts \
    tests/voice-signed-url.test.ts tests/voice-provision.test.ts tests/voice-panel.test.tsx \
    tests/voice-build-guard.test.ts tests/voice-secrets.test.ts

 Test Files  8 passed (8)
      Tests  78 passed (78)
   Start at  13:26:26
   Duration  10.12s (tests 84%, setup 6%, environment 4%, import 3%, transform 2%)
```

The first run of the server three was 29 tests green (`_community-09-step3-1-unit.log`); the panel file needed two
iterations of its own tests, which step 4 records.

### Type check and lint

```
$ npm run typecheck

> cited@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
(no diagnostic)

$ npm run lint

> cited@0.1.0 lint
> eslint .
(no diagnostic)
```

The ported Orb needed one documented adaptation to pass the type check of this repository, which is stricter than
Construye's: the uniforms of the shader are read through the named shape `OrbUniforms`, because this project type
checks with `noUncheckedIndexedAccess`. The header of the MIT copy records it, and the drawn result is the same. The
lint of this repository also enables four React Compiler rules (`immutability`, `purity`, `refs`,
`preserve-manual-memoization`) that a three.js component cannot satisfy, and the same header disables those four and
nothing else.

### The production build and its guard

```
$ npm run build
(a full route table, /api/voice/tool and /api/voice/signed-url among the dynamic routes)

$ npm run verify:no-test-sdk
verify-no-test-sdk: mode=production roots=.next, .next\static
OK: no marker of the test SDK in the output; the real package is in 1 file(s).
```

### The end-to-end build and its guard, and the browser suite

```
$ npm run build:e2e
verify-no-test-sdk: mode=test-build roots=.next, .next\static
OK: the test SDK is in the browser output (1 file(s)) and the real package is not.

$ npx playwright test e2e/voice.spec.ts --project=public --reporter=list
the texture of the Orb: before the panel opens false, after it true, in 9 scripts
the voice panel: axe 0 violations, 24 rules passed
  7 passed (7.2s)
```

The voice panel of the browser is the panel of the real product: the test SDK replaces the package and the signed URL
comes from a route of Playwright, but the panel, the ported Orb, the chips and the words are the ones that ship.
Chromium is launched with its fake capture device, so no test depends on the hardware of the machine.

The whole browser suite of the repository, which is the evidence of step 4 and 7, ended `28 passed (14.4s)` in
`_community-09-step4-e2e.log`.

## Verdict

Tasks 3.1, 3.2 and 3.3 are done: every red test of step 2 is green, the whole voice suite passes without a socket to
ElevenLabs or to a model provider, the production build carries the real package and no marker of the test SDK, and the
end-to-end build carries the test SDK and not the real package.

## Commits

- `2181813` — the server tool, the signed URL and the store of the counter.
- `afee387` — the one-click agent, the route of the panel and its button.
- `5d35aca` — the ported panel and Orb, the texture, the build guard, the policy and the two pages.
