# Step 10 — what the review of Codex reproduced

- Date: 2026-09-29
- Change: `elevenlabs-voice-agent` (OpenSpec)
- Branch: `feature/elevenlabs-voice-agent`
- Agent: deepseek-harness
- Contract: section 10 of `tasks.md`, amended by Fable after `katalis-dev/tasks/revision-community-09.md`
- The sections 0 to 9 of the contract are untouched: this report only answers the three Major and the Minor the review
  reproduced.

## 10.1 The state of the store before and after

**Task.** Major of the review: the standard asks for the state of the store before and after a change, with the tables
and their row counts, and the two tables this change adds empty before and as expected after. The reports of steps 1
and 8 recorded the suite, the typecheck, the lint, OpenSpec and Git, and no state of the database.

**What was added.** `scripts/store-state.ts` prints every table of a store and the row count of each one, and it can
read the schema of another revision without checking it out (it takes the path of the store module as its second
argument). `tests/voice-store-state.test.ts` is the executable form of the same evidence.

**Commands and real output.** The path of the database is elided as `%TEMP%`: it is a throwaway file of the run, and no
personal path belongs in a versioned file.

The store of the base of the change, `21ad3b9`, which has no table of the voice:

```powershell
$repo = (Get-Location).Path
$before = "$env:TEMP\katalis-voice-state-before"
New-Item -ItemType Directory -Force $before | Out-Null
# The module of the base resolves `@libsql/client` from the node_modules of the worktree through this junction.
New-Item -ItemType Junction -Path "$before\node_modules" -Target "$repo\node_modules" | Out-Null
cmd /c "git show 21ad3b9:lib/store/index.ts > %TEMP%\katalis-voice-state-before\base-store.ts"
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/store-state.ts "$before\before.sqlite" "$before\base-store.ts"
```

```text
database: %TEMP%\katalis-voice-state-before\before.sqlite
tables: 13
  business: 0 rows
  conversations: 0 rows
  documents: 0 rows
  login_attempts: 0 rows
  model_calls: 0 rows
  passages: 0 rows
  passages_fts: 0 rows
  passages_fts_config: 1 rows
  passages_fts_content: 0 rows
  passages_fts_data: 2 rows
  passages_fts_docsize: 0 rows
  passages_fts_idx: 0 rows
  rate_limits: 0 rows
exit=0
```

Thirteen tables and neither `voice_minutes` nor `voice_agent`: the change adds them. The two shadow tables of the
full-text index (`passages_fts_config`, `passages_fts_data`) carry the internal rows the index writes when it is
created, and no document.

The store this code creates, before any voice flow runs:

```powershell
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/store-state.ts "$env:TEMP\katalis-voice-state-after.sqlite"
```

```text
database: %TEMP%\katalis-voice-state-after.sqlite
tables: 15
  business: 0 rows
  conversations: 0 rows
  documents: 0 rows
  login_attempts: 0 rows
  model_calls: 0 rows
  passages: 0 rows
  passages_fts: 0 rows
  passages_fts_config: 1 rows
  passages_fts_content: 0 rows
  passages_fts_data: 2 rows
  passages_fts_docsize: 0 rows
  passages_fts_idx: 0 rows
  rate_limits: 0 rows
  voice_agent: 0 rows
  voice_minutes: 0 rows
exit=0
```

Fifteen tables, the two of the voice among them, and every table of data empty.

The same store after the two flows of the change — the reservation of a session and the agent the panel stores:

```powershell
$env:STATE_DB = "$env:TEMP\katalis-voice-state-flows.sqlite"
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --input-type=module -e "const { openStore } = await import('./lib/store/index.ts'); const { reserveSession } = await import('./lib/voice/minutes.ts'); const store = await openStore(process.env.STATE_DB); const room = await reserveSession(store, { environment: { DAILY_VOICE_MINUTE_LIMIT: '30' } }); await store.saveVoiceAgent({ agentId: 'agent_del_estado', secretId: 'secret_1', toolId: 'tool_1', sourcesToolId: 'tool_2', language: 'en' }); store.close(); console.log('reservation:', JSON.stringify(room));"
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/store-state.ts "$env:TEMP\katalis-voice-state-flows.sqlite"
```

```text
reservation: {"ok":true,"minutes":5}
exit=0
database: %TEMP%\katalis-voice-state-flows.sqlite
tables: 15
  business: 0 rows
  conversations: 0 rows
  documents: 0 rows
  login_attempts: 0 rows
  model_calls: 0 rows
  passages: 0 rows
  passages_fts: 0 rows
  passages_fts_config: 1 rows
  passages_fts_content: 0 rows
  passages_fts_data: 2 rows
  passages_fts_docsize: 0 rows
  passages_fts_idx: 0 rows
  rate_limits: 0 rows
  voice_agent: 1 rows
  voice_minutes: 1 rows
exit=0
```

One reservation of five minutes and one agent, and nothing else moves: the flows of the voice write only their two
tables.

The executable form of the same evidence, which asserts the tables, the counts and the row of the day:

```powershell
npx vitest run tests/voice-store-state.test.ts
```

```text
 Test Files  1 passed (1)
      Tests  2 passed (2)
   Duration  527ms
```

**Note on "tests first".** This task is evidence, not a fix: the two tables and their methods landed with the tasks 3.1
to 3.3, which the sections 0 to 9 already verified. The test was green from its first complete run; its first red was
the list of tables, which missed the shadow table `passages_fts_content`, and it is recorded here because the standard
asks for the assertion and not only for a dump.

**Verdict.** 10.1 is done: the tables and their row counts are recorded before and after, the two tables of the voice
are empty before and hold exactly one row each after the flows.

**Commit.** `23f5cc0` carries the script and the test; the mark and this report travel together.

## 10.2 The resampler and the worklets, served from this origin

**Task.** Major of the review: the frontend started the session without `workletPaths` or `libsampleratePath`, so
`@elevenlabs/client` 1.26.0 built the processors from a `blob:` and, when the browser cannot pin the sample rate or
delivers another one, asked
`https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js@2.1.2/dist/libsamplerate.worklet.js` for the resampler.
`AudioWorklet.addModule` is governed by `script-src`, and the policy of the page names no CDN, so on a device that
needs the conversion the audio died before a usable conversation.

**The documentation read, and the option used.** Two sources:

1. The README of the installed `@elevenlabs/client` 1.26.0 (`node_modules/@elevenlabs/client/README.md`), section
   *Self-hosting AudioWorklets under a strict CSP*: “the raw processor sources are published as static assets under
   `@elevenlabs/client/worklets/*`. Copy the ones you need into your own static assets (e.g. via a build step or
   bundler copy plugin) and serve them same-origin, then point the SDK at them”, with
   `workletPaths: { rawAudioProcessor, audioConcatProcessor }`. Its table of entrypoints marks
   `@elevenlabs/client/worklets/*` as public and semver-stable, and the same section says that
   `AudioWorklet.addModule()` is governed by `script-src-elem` (falling back to `script-src`).
2. The official page [JavaScript SDK](https://elevenlabs.io/docs/eleven-agents/libraries/java-script) (and
   [React SDK](https://elevenlabs.io/docs/eleven-agents/libraries/react), the package this repo imports): the session is
   `startSession(options)`, a private agent starts with a `signedUrl` over the WebSocket connection — which is the
   session of this repo — and the audio devices take `sampleRate`/`format`. The self-hosting route itself is documented
   in the package README of the installed version, and its types are in the package:
   `dist/BaseConversation.d.ts` declares `AudioWorkletConfig` as `workletPaths?` **and** `libsampleratePath?`, with the
   comment “Allows self-hosting the worklets to avoid whitelisting blob: and data: in the CSP script-src”;
   `dist/platform/web/VoiceSessionSetup.js` passes both to `MediaDeviceInput.create` and `MediaDeviceOutput.create`
   of the WebSocket session; `dist/platform/web/addLibsamplerateModule.js` is where the jsDelivr URL is the fallback
   (`customPath || LIBSAMPLERATE_JS`).

So the options used are **`workletPaths`** (`rawAudioProcessor`, `audioConcatProcessor`) and **`libsampleratePath`**,
both handed to `startSession` in `components/voice/voice-session.ts`.

**The red, before the fix.**

```powershell
npx vitest run tests/voice-worklets.test.tsx
```

```text
 Test Files  1 failed (1)
      Tests  2 failed (2)
   Duration  4.45s

Error: ENOENT: no such file or directory, open '<worktree>\public\voice\worklets\raw-audio-processor.js'
 FAIL  tests/voice-worklets.test.tsx > the audio of the voice session > hands the SDK the paths of this origin, and no
path of a CDN
AssertionError: expected undefined to deeply equal { …(2) }
- Expected:
{
  "audioConcatProcessor": "/voice/worklets/audio-concat-processor.js",
  "rawAudioProcessor": "/voice/worklets/raw-audio-processor.js",
}
+ Received:
undefined
```

```powershell
npx playwright test e2e/voice.spec.ts --grep "audio worklets"
```

```text
the worklets: /voice/worklets/raw-audio-processor.js 404 text/html; charset=utf-8; /voice/worklets/audio-concat-processor.js 404 text/html; charset=utf-8; /voice/worklets/libsamplerate.worklet.js 404 text/html; charset=utf-8; /voice/worklets/raw-audio-processor.js: AbortError; /voice/worklets/audio-concat-processor.js: AbortError; /voice/worklets/libsamplerate.worklet.js: AbortError
  x  1 [public] › e2e\voice.spec.ts:211:5 › the audio worklets are served by this origin and load under the policy of the page (1.0s)
    Error: expect(received).toEqual(expected) // deep equality
    - Expected  - 3
    + Received  + 3
      Array [
    -   200,
    -   200,
    -   200,
    +   404,
    +   404,
    +   404,
      ]
  1 failed
```

**The fix.**

- `@alexanderolsen/libsamplerate-js` 2.1.2 is an exact `devDependency` (MIT, no dependencies of its own): it is the
  package the SDK would fetch from jsDelivr, and pinning it puts the file in the lock file.
- `scripts/copy-voice-worklets.mjs` (`npm run worklets:voice`) copies the two processors of
  `@elevenlabs/client/worklets/*` and the resampler of that package into `public/voice/worklets/`, with the names this
  origin serves. The three copies are versioned so the site serves them without a build step, and
  `public/voice/worklets/README.md` names the origin, the version and the licence (MIT for the three) of each one.
- `components/voice/voice-session.ts` hands `workletPaths` and `libsampleratePath` to `startSession`.

```powershell
npm run worklets:voice
```

```text
raw-audio-processor.js: 3953 bytes
audio-concat-processor.js: 2814 bytes
libsamplerate.worklet.js: 2016428 bytes
```

The lock file was regenerated inside a `node:24` container (`npm install`, Node 24.21.0, npm 11.19.0) because a Windows
install prunes optional packages of other platforms, the trap the round 9 already hit; `npm ci` was then run again on
Windows with the new lock file and installed 694 packages with no advisory. The Linux side is in 10.5.

**The green, after the fix.**

```powershell
npx vitest run tests/voice-worklets.test.tsx
```

```text
 Test Files  1 passed (1)
      Tests  2 passed (2)
   Duration  3.16s
```

```powershell
npx playwright test e2e/voice.spec.ts --grep "audio worklets"
```

```text
the worklets: /voice/worklets/raw-audio-processor.js 200 application/javascript; charset=UTF-8; /voice/worklets/audio-concat-processor.js 200 application/javascript; charset=UTF-8; /voice/worklets/libsamplerate.worklet.js 200 application/javascript; charset=UTF-8; /voice/worklets/raw-audio-processor.js: loaded; /voice/worklets/audio-concat-processor.js: loaded; /voice/worklets/libsamplerate.worklet.js: loaded
  ok 1 [public] › e2e\voice.spec.ts:211:5 › the audio worklets are served by this origin and load under the policy of the page (762ms)
  1 passed (7.4s)
```

The browser test loads the three modules through `AudioWorklet.addModule` inside the page, so the policy of the page
applies to the request, and it fails if any request of the run goes to jsDelivr, unpkg or another CDN host.

**Tests touched.** `tests/fakes/elevenlabs-react.tsx` records `workletPaths` and `libsampleratePath` in `startCalls`,
because the double has to report what the real SDK receives at `startSession`; the real package was not changed. The
new files are `tests/voice-worklets.test.tsx` and the browser test of `e2e/voice.spec.ts`.

**Verdict.** 10.2 is done: the three files come from this origin, the SDK is told so, and a CDN host fails the suite.

**Commit.** `4f2b0cd` carries the code, the three served files and the tests; the mark and this report travel together.
