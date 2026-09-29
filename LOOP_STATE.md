# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: elevenlabs-voice-agent (OpenSpec)
ROUND: the section 11 of `openspec/changes/elevenlabs-voice-agent/tasks.md`, amended by Fable after the adversarial
review `tasks/revision-community-09b.md` (two Major)
BRANCH: feature/elevenlabs-voice-agent
BASE OF THE ROUND: e760f9d ("Check the cap before the configuration, and keep the notice of what is copied"), the
contract amendment; the sections 0 to 10 are untouched
HEAD AT THE START OF THE ROUND: e760f9d
AGENT: deepseek-harness
DATE: 2026-09-29

## What this round has to close

- **11.1**: `GET /api/voice/signed-url` answers `429` for a cap below one session before it looks at the configuration,
  with the battery of `DAILY_VOICE_MINUTE_LIMIT=1..4` and an empty `ELEVENLABS_API_KEY` as a test, and `503` naming the
  variable only when the cap of the day admits a session.
- **11.2**: the license texts of `@alexanderolsen/libsamplerate-js` 2.1.2 (MIT and the BSD 2-clause of the
  libsamplerate it bundles) sit byte for byte next to the served resampler, and `THIRD_PARTY_NOTICES.md` lists every
  verbatim copy of a package the repository serves — the resampler, the two worklets of `@elevenlabs/client` and the
  Outfit font with its OFL — with its name, version, license and origin.
- **11.3**: the whole battery on Windows and in a `node:24` container, the round appended to
  `tasks/entrega-community-09.md` with `## Issues`, and the report of the section in the change folder.

Tests first, red before each fix; no test of this round calls ElevenLabs.

---

# Round 10 (closed)

STATUS: DONE
CHANGE: elevenlabs-voice-agent (OpenSpec)
ROUND: the section 10 of `openspec/changes/elevenlabs-voice-agent/tasks.md`, amended by Fable after the adversarial
review `tasks/revision-community-09.md` (three Major and one Minor)
BRANCH: feature/elevenlabs-voice-agent
BASE OF THE ROUND: 1119236 ("Serve the voice from our own origin, keep the cap whole, and record the store before and
after"), the contract amendment; the sections 0 to 9 are untouched
HEAD AT THE END OF THE ROUND: 0ca911c, plus the closing commit that carries this file
AGENT: deepseek-harness
DATE: 2026-09-29

## What the round delivered

- **10.1**: `scripts/store-state.ts` prints every table of a store and the row count of each one, and can read the
  schema of another revision; the round ran it over the base `21ad3b9` (13 tables, neither `voice_minutes` nor
  `voice_agent`) and over this branch (15 tables, the two of the voice empty before the flows and one row each after
  them), and `tests/voice-store-state.test.ts` asserts both pictures.
- **10.2**: the two processors of `@elevenlabs/client` 1.26.0 and the resampler of `@alexanderolsen/libsamplerate-js`
  2.1.2 (MIT, exact `devDependency`) are served from `public/voice/worklets/`, refreshed by `npm run worklets:voice`,
  and `components/voice/voice-session.ts` hands `startSession` their paths (`workletPaths`, `libsampleratePath`), which
  is the route the README of the installed SDK documents for a strict policy. The jsDelivr fallback the review
  reproduced is gone, and both a unit test and a browser test fail if it comes back.
- **10.3**: the reservation of a session is one statement with the cap in the first insert too
  (`SELECT … WHERE ? <= ?`), so a limit below five minutes allows no session and stores no minute; the route answers
  `429` with `reason`, and the panel says so in English and in Spanish.
- **10.4**: the policy keeps `connect-src 'self' wss://api.elevenlabs.io`, `worker-src 'self'` and no `media-src`, with
  the reason of each directive written in `lib/headers/csp.ts` and the test demanding no third-party host at all.
- **10.5**: 49 files and 438 tests green on Windows, 49 files with 436 green and 2 skipped in a `node:24` container
  after `npm ci`, `typecheck`, `lint`, 29 browser tests green, gitleaks with no leak, OpenSpec 11 of 11 and
  `git diff --check main...HEAD` clean; the round 10 was appended to `tasks/entrega-community-09.md` with its
  `## Issues`.

## Evidence

- The report of the round: `openspec/changes/elevenlabs-voice-agent/reports/2026-09-29-step-10-review-fixes.md`, one
  section per task with the exact commands, the red before each fix and the output.
- Every `[x]` of the section 10 carries its report in the same commit as its mark.
- The delivery in Spanish: `tasks/entrega-community-09.md`, round 10.

## The issues that stay open

- **7.2 is still `[BLOCKED]`**: one real session against a real agent is Fable's task, and nothing of this round called
  ElevenLabs or a model provider.
- One browser test of the suite (`e2e/widget.spec.ts:44`) failed once on its 5 s timeout during the first whole run of
  the round and passed alone and in the next whole run with the same build: recorded as a flake under load, not as a
  defect of this round.
- The vendored resampler weighs 2 MB, the price of not asking a CDN for it; the alternative (generating it at build
  time) is written in the report and in the delivery.
- The lock file had to be regenerated inside `node:24` again, the trap the round 9 already recorded.
- The minute cap is still a reservation of five minutes per session and not a measurement of the call.

---

# Round 9 (closed)

STATUS: DONE
ROUND: the whole contract, tasks 0.1 to 9.2, with 7.2 left `[BLOCKED]` because it is Fable's
BASE: 21ad3b9 (main, "Merge admin-panel-and-onboarding"), which already carries the panel and the public page
HEAD AT THE START OF THE ROUND: d7a276e ("Specify the ElevenLabs voice agent, English first")
HEAD AT THE END OF THE ROUND: 31f0db7, plus the closing commit that carries this file, the report of step 9.2 and the
marks of section 9

## What was delivered

- **0.1 to 1.1**: the branch and its base confirmed (`21ad3b9`, contract `d7a276e`), `npm ci` with 626 packages and no
  advisory, and the green battery of the base: 38 files, 348 tests.
- **2.1 and 2.2**: every scenario of the spec as a red test, with the double of the ElevenLabs API
  (`tests/fakes/elevenlabs-api.ts`) and the deterministic test SDK (`tests/fakes/elevenlabs-react.tsx`). Eight test
  files red, and the seven browser tests red.
- **3.1**: `lib/voice/` (config, the constant-time secret, the minutes, the one transport, the tool and the text the
  agent speaks), `POST /api/voice/tool` and `GET /api/voice/signed-url`, plus two additive tables of the store
  (`voice_minutes` and `voice_agent`) and their five methods.
- **3.2**: `lib/voice/agent.ts` creates or updates the workspace secret, the webhook tool, the client tool
  `mostrar_fuentes` and the agent, and stores the four ids; the second press sends `PATCH` and creates nothing. The
  languages are the ones of the current documentation of ElevenLabs: the language of the business first, the other of
  English and Spanish in `language_presets`, and the `language_detection` system tool. `components/admin/VoiceAgent.tsx`
  is the one button, on the business screen, and the panel navigation was not touched.
- **3.3**: the panel, the Orb and the source validator of Construye ported to `components/voice/` and
  `components/ui/orb.tsx` with their MIT headers and their origin, the texture reproduced byte for byte by
  `npm run texture:orb`, the microphone on `/` and `/embed`, and the guard of the test SDK with its two build orders.
- **4.1**: the whole suite green, one existing test file amended (`tests/csp.test.ts`, the three directives of the
  policy) and every adjustment of the new tests named with its reason.
- **5.1**: 46 files and 429 tests green on Windows, the same suite green in a `node:24` container from a clean clone
  (427 green and 2 skipped), `typecheck`, `lint`, `audit:high` with no advisory, gitleaks over 290 commits, OpenSpec
  with 11 items, `git diff --check` clean, and the guard of the test SDK in both build orders. The lock file was
  incomplete for Linux after the Windows install and was fixed and verified on both platforms.
- **6.1**: eight verifications with `curl.exe` over `npm run start`: `401` without the Bearer and with a wrong one,
  `200` with the answer of the fake model and its sources, the two turns of one conversation in the store, a refusal
  with `sources: none`, `503` of the signed URL without the key, and no minute spent by an installation that cannot
  open a session.
- **7.1**: the whole browser suite green, 28 tests, with the texture of the Orb arriving on demand and axe at 0
  violations, and the captures of the panel at 1440 and 375 px.
- **9.1 and 9.2**: `docs/voice-agent.md`, the two READMEs with the voice row available and a real capture, the
  graphics of the README moved with the row, five documents that claimed the voice was planned, and the delivery
  `tasks/entrega-community-09.md`.

## Evidence

- One report per task inside the change:
  `openspec/changes/elevenlabs-voice-agent/reports/2026-09-29-step-{0,1,2,3,4,5,6,7,8,9}-*.md`, each one with the
  exact command, the commit it was verified against and the real output.
- `npm test`: 46 files and 429 tests green on Windows (13.56 s); 46 files, 427 green and 2 skipped in a `node:24` Linux
  container from a clean clone (v24.21.0).
- `npm run test:e2e`: 28 tests green in one run with the two servers, the voice panel at 0 violations of axe, and the
  build guard of the test SDK passed before the suite started.
- `curl.exe`: the eight verifications of task 6.1, in `tasks/_community-09-step6-curl.log`.
- The captures: `tasks/capturas-community-09/` and `docs/images/voice/panel.png`.

## The issues that stayed open at the end of round 9

- **7.2 is `[BLOCKED]`**: one real session against a real agent is Fable's task. No test, capture or script of that
  round called ElevenLabs or a model provider.
- The worklet of audio of the SDK loads from a `blob:`, which was why the policy gained `worker-src 'self' blob:` and
  `media-src 'self' blob:`; whether it loads under that policy is what a real session proves. The review of Codex
  reproduced that the resampler falls back to a CDN the policy blocks, and section 10 fixed it.
- The cap of voice minutes is a reservation of five minutes per session and not a measurement of the call.
- Turbopack keeps its scratch space in `.next/cache`, and a production build after an end-to-end one leaves the marker
  of the test SDK there. The guard reads the emitted output and not the compiler cache, on purpose and in writing.
- The board of the roadmap graphic is a little denser and 720 px high, the ceiling of decision 11, because the
  available column grew from seven rows to eight.
- The lock file needed a regeneration inside `node:24` because the Windows install pruned three optional packages of
  other platforms; `npm ci` now works on both.
- The parallel lane (`community-ins`, `feature/answer-feedback-and-insights`) also touches the chat, the panel
  navigation and the README, so the merge of the two branches will need a hand on the README and the graphics.
- `EMBEDDING_MODEL` and `EMBEDDING_API_KEY` stay in the template with no reader; the README now says so.
- The change is not archived (that needs the explicit OK of Franc), nothing was pushed and nothing was deployed.
