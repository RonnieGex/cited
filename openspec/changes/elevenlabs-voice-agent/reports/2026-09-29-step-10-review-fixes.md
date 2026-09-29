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

**Commit.** `24e5b17` carries the code, the three served files, the tests, the mark and this section. That same commit
opened with the hash of this line unwritten (a guess, `4f2b0cd`, that no commit ever had); it is corrected here, in the
commit that follows, and the hash above is the real one.

## 10.3 The minute cap never lets a session exceed it

**Task.** Major of the review: `DAILY_VOICE_MINUTE_LIMIT=1..4` was exceeded by the first session of the day. The
reservation is five minutes, the route asked for it, and `lib/store/index.ts` carried the cap only in the `ON CONFLICT`
branch of the insert: the first reservation of a day takes the `INSERT` branch, which had no check at all, so the first
session stored five minutes whatever the limit said and the browser got a signed URL.

**The red, before the fix.** `tests/voice-minute-cap.test.ts` is new and the two copies of the new panel message are
tests of `tests/voice-panel.test.tsx`.

```powershell
npx vitest run tests/voice-minute-cap.test.ts tests/voice-panel.test.tsx
```

```text
 ❯ tests/voice-minute-cap.test.ts (3 tests | 3 failed) 272ms
 ❯ tests/voice-panel.test.tsx (13 tests | 2 failed) 2450ms
 FAIL  tests/voice-minute-cap.test.ts > a limit below one session > refuses the first reservation of the day and stores
no minute
AssertionError: expected 5 to be null
 FAIL  tests/voice-minute-cap.test.ts > a limit below one session > answers 429 with the reason, and asks ElevenLabs for
no signed URL
AssertionError: expected 200 to be 429 // Object.is equality
 FAIL  tests/voice-minute-cap.test.ts > a limit below one session > keeps the reason of a day that is spent apart from a
limit that never fits
AssertionError: expected { status: 'limited', limit: 10, …(1) } to match object { status: 'limited', …(2) }
 FAIL  tests/voice-panel.test.tsx > the voice panel > says in words that a limit below one session leaves the voice off
Expected element to have text content: …
 FAIL  tests/voice-panel.test.tsx > the voice panel > says the same in Spanish
Expected element to have text content: …
 Test Files  2 failed (2)
      Tests  5 failed | 11 passed (16)
   Duration  4.36s
```

The first line is the defect of the review, reproduced: the first reservation of a day with a limit of three stores
five. The second is the consequence: the route answered `200` and would have asked ElevenLabs for a signed URL.

**The fix.**

- `lib/store/index.ts`: the reservation is one statement with the guard in both branches —
  `INSERT INTO voice_minutes (day, minutes) SELECT ?, ? WHERE ? <= ? ON CONFLICT (day) DO UPDATE SET minutes = minutes +
  excluded.minutes WHERE minutes + excluded.minutes <= ? RETURNING minutes`. The `SELECT … WHERE` is the guard of the
  first reservation of the day, and the `ON CONFLICT` one stays for the rest, so no arrival order and no pair of
  concurrent visitors can leave the day above the limit.
- `lib/voice/minutes.ts`: the room of a refused session now says why (`spent` or `below-session`), and a limit below
  the five minutes of a session is refused before the store is asked at all.
- `app/api/voice/signed-url/route.ts`: `429` with `reason`, and an error line that names
  `DAILY_VOICE_MINUTE_LIMIT=<n>` and the five minutes of a session when the limit never fits. The stray double space
  the route carried after `export async function GET(): Promise<Response> {` is gone too.
- `components/voice/voice-url.ts` and `components/voice/VoicePanel.tsx`: the `429` of a limit that never fits is its
  own failure, and the panel says so in words — “The voice is off: the daily limit of minutes of this site is smaller
  than one session. Type your question below and we answer in writing.” — in English and in Spanish
  (`limitTooLow` of `lib/i18n/voice.ts`).

**The green, after the fix.**

```powershell
npx vitest run tests/voice-minute-cap.test.ts tests/voice-panel.test.tsx tests/voice-signed-url.test.ts tests/store.test.ts
```

```text
 Test Files  4 passed (4)
      Tests  32 passed (32)
   Duration  8.50s
```

And the whole suite, which is the check that the guarded statement did not change the days that do fit:

```powershell
npm test
```

```text
 Test Files  49 passed (49)
      Tests  438 passed (438)
   Duration  14.44s
```

**Verdict.** 10.3 is done: a limit below five allows no session and stores no minute, the reason reaches the browser,
and the panel says so in the two languages of the product.

**Commit.** `9f002d4` carries the fix; the red tests are in `e7b9d69` and this section travels with the mark.

## 10.4 The policy trimmed to what the implemented session uses

**Task.** Minor of the review: `connect-src` allowed `https://api.elevenlabs.io` although the browser never calls the
HTTPS API — it asks this origin for the signed URL and opens `wss://api.elevenlabs.io` — and `media-src 'self' blob:`
did not match the path the SDK takes, because the answer plays through the `MediaStream` the SDK assigns to the
`srcObject` of an audio element, which is not a fetch. The policy and its test fixed the widening instead of proving the
need.

**What a real browser says.** A throwaway probe with the Chromium of the suite (a script outside the repository) compared
the paths of the SDK under the policy of this page: the same-origin `addModule` loads, the jsDelivr URL is blocked (which
is the Major of 10.2), and a `blob:` module loads because `'strict-dynamic'` trusts the script that creates it — not
because of `worker-src blob:`, which was therefore decoration. The trimmed policy keeps the same-origin route, which is
the one the session uses since 10.2.

**The red, before the fix.**

```powershell
npx vitest run tests/csp.test.ts
```

```text
 ❯ tests/csp.test.ts (11 tests | 1 failed) 13ms
 FAIL  tests/csp.test.ts > the policy of the page > names the endpoints of the voice session, and only them
AssertionError: expected ''self' https://api.elevenlabs.io ws…' to be ''self' wss://api.elevenlabs.io'
Expected: "'self' wss://api.elevenlabs.io"
Received: "'self' https://api.elevenlabs.io wss://api.elevenlabs.io"
 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
   Duration  1.45s
```

**The fix.** `lib/headers/csp.ts` now carries one line per directive with its reason, and three of them changed:

- `connect-src 'self' wss://api.elevenlabs.io`: the socket the signed URL opens, and nothing else of the provider. The
  HTTPS endpoint is not named because the browser never calls it; the routes of the server do.
- `worker-src 'self'`: the processors are files of `public/voice/worklets/` and the session hands the SDK their paths,
  so the page requests no `blob:` module.
- no `media-src`: the answer is a `MediaStream` on a `srcObject`, not a fetch, so the directive had no consumer; its
  absence leaves the floor of `default-src 'self'`, which is stricter.

The other directives keep their reason in the same block (`default-src` as the floor, `script-src` with the nonce,
`style-src` with the inline colours of the business, `img-src`, `font-src`, the four of the strict floor and
`frame-ancestors`).

**The green, after the fix.**

```powershell
npx vitest run tests/csp.test.ts
```

```text
 Test Files  1 passed (1)
      Tests  11 passed (11)
   Duration  1.44s
```

The test now also proves the requirement literally: the policy names no `http(s)://` host at all, exactly one `wss://`
host, and the string `jsdelivr` appears nowhere in it. And the audio of 10.2 still loads under the trimmed policy: the
browser test was run again over a build with the new header.

```powershell
npm run build:e2e
npx playwright test e2e/voice.spec.ts --grep "audio worklets"
```

```text
the worklets: /voice/worklets/raw-audio-processor.js 200 application/javascript; charset=UTF-8; /voice/worklets/audio-concat-processor.js 200 application/javascript; charset=UTF-8; /voice/worklets/libsamplerate.worklet.js 200 application/javascript; charset=UTF-8; /voice/worklets/raw-audio-processor.js: loaded; /voice/worklets/audio-concat-processor.js: loaded; /voice/worklets/libsamplerate.worklet.js: loaded
  1 passed (6.2s)
```

**Tests touched.** `tests/csp.test.ts`: the test that fixed the widened directives is amended, with its comment, to the
three trimmed ones and to the two new assertions about hosts.

**Verdict.** 10.4 is done: the policy names the ElevenLabs connection the session uses and no other, and every directive
that stays says why.

**Commit.** `3a81342` carries the policy and its test; the mark and this section travel together. `aa0b8a9` keeps the
copies of the worklets out of the lint, which the 2 MB resampler made noisy (242 warnings, no error).
