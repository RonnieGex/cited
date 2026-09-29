# LOOP_STATE · Cited

STATUS: DONE
CHANGE: elevenlabs-voice-agent (OpenSpec)
ROUND: the whole contract, tasks 0.1 to 9.2, with 7.2 left `[BLOCKED]` because it is Fable's
BRANCH: feature/elevenlabs-voice-agent
BASE: 21ad3b9 (main, "Merge admin-panel-and-onboarding"), which already carries the panel and the public page
HEAD AT THE START OF THE ROUND: d7a276e ("Specify the ElevenLabs voice agent, English first")
HEAD AT THE END OF THE ROUND: 31f0db7, plus the closing commit that carries this file, the report of step 9.2 and the
marks of section 9
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute `openspec/changes/elevenlabs-voice-agent/tasks.md`, written by Fable, in order and complete except 7.2: the
server tool behind a Bearer secret, the signed URL with the daily cap of voice minutes, the one-click provisioning of
the agent from the panel, the ported panel and Orb on the public page and in the widget, the build guard that keeps the
test SDK out of a production build, the battery of checks, the manual `curl.exe` verification, the end-to-end run with
its captures, the documentation and the delivery. Tests first and red before the code, one real report per `[x]` inside
the change folder, small commits on the branch, and no push, no remote, no archive and no commit in `main`.

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
  `katalis-dev/tasks/entrega-community-09.md`.

## Evidence

- One report per task inside the change: `openspec/changes/elevenlabs-voice-agent/reports/2026-09-29-step-{0,1,2,3,4,5,6,7,8,9}-*.md`,
  each one with the exact command, the commit it was verified against and the real output.
- `npm test`: 46 files and 429 tests green on Windows (13.56 s); 46 files, 427 green and 2 skipped in a `node:24` Linux
  container from a clean clone (v24.21.0).
- `npm run test:e2e`: 28 tests green in one run with the two servers, the voice panel at 0 violations of axe, and the
  build guard of the test SDK passed before the suite started.
- `curl.exe`: the eight verifications of task 6.1, in `katalis-dev/tasks/_community-09-step6-curl.log`.
- The captures: `katalis-dev/tasks/capturas-community-09/` and `docs/images/voice/panel.png`.

## The issues that stay open

- **7.2 is `[BLOCKED]`**: one real session against a real agent is Fable's task. No test, capture or script of this
  round called ElevenLabs or a model provider.
- The worklet of audio of the SDK loads from a `blob:`, which is why the policy of the public documents gained
  `worker-src 'self' blob:` and `media-src 'self' blob:`; that it loads under that policy is what a real session proves.
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

## Hard rules respected

- No `.env` file was opened (the repository has none: `Test-Path .env` is `False`); `.env.example` is the public
  template and the only environment file edited.
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy. Another session moved `main` to
  `c07640b` while this round ran; this branch never wrote to it and still sits on its declared base `21ad3b9`.
- The other worktrees (`community-ins`, of the feedback lane, and `community-ui`, of Fable) were not touched.
- No test calls ElevenLabs or a model provider: the double of the API, the test SDK and the deterministic providers ran
  the suite, the two servers of the browser flows and the captures.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- No personal path in a versioned file.
- The text of no task, of `design.md` or of a spec was edited: only the checkboxes of `tasks.md`.
