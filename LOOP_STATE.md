# LOOP_STATE · Cited

STATUS: DONE
CHANGE: voice-owner-words (OpenSpec)
ROUND: the whole contract of `openspec/changes/voice-owner-words/tasks.md`, sections 0 to 9
BRANCH: feature/voice-owner-words
BASE: d71220d (the local merge of `main` that brings `provider-keys-in-panel` and `elevenlabs-voice-agent`
together); the change starts at 2f9a75b ("Write the contract of voice-owner-words: the voice routes and screen stop
naming environment variables"). No push, no remote, nothing merged into `main`.
HEAD AT THE START OF THE ROUND: 2f9a75b
HEAD AT THE END OF THE ROUND: the closing commit that carries this file (the contract closed at c8f66b7, the report of
section 9 and its mark)
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

The requirement "The owner never reads a variable name in an answer of the panel" of
`openspec/specs/provider-settings/spec.md` arrived in `main` with `provider-keys-in-panel`, which was written before the
voice lane existed. On the merged tree three answers still named variables of the environment:

- **`POST /api/admin/voice`** answered an installation without voice with `missing: ["ELEVENLABS_API_KEY",
  "VOICE_TOOL_SECRET"]` and the text "the voice agent needs ELEVENLABS_API_KEY and ... in the environment of the
  server";
- **`components/admin/VoiceAgent.tsx`** printed that list of names to the owner;
- **`GET /api/voice/signed-url`** handed `missing: ["ELEVENLABS_API_KEY"]` or `["ELEVENLABS_AGENT_ID"]` to any visitor,
  and its `429` of the daily cap named `DAILY_VOICE_MINUTE_LIMIT` in the same body.

The change answers with reason codes, keeps the names in the log of the server once per process (`console.error`, the
helper of the keys lane) and on the page "For the installer", and walks every `route.ts` of `app/api/admin` and
`app/api/voice` in an installation with the panel configured and no voice to prove that no other answer names one.

## What was delivered

- **0.1 and 1.1**: the branch and its base confirmed, `npm ci` (694 packages, 0 vulnerabilities), and the state of the
  base recorded. That state was **red**, and not for the code: `tests/readme.test.ts` failed on the voice row because
  the contract adds `## ADDED Requirements` to a capability whose spec is already in force, which the guard of the
  status table forbade. `cd2e053`.
- **2.1**: `tests/voice-owner-words.test.ts` written before the code: the walk of every route of the two trees (status,
  headers and body against every name of `.env.example`), the two codes of the panel route, the log once, the code of
  the public route, the two `429` of the cap and the screen in English and Spanish with the link to "For the
  installer". Nine failures red, recorded. `92542de`.
- **3.1**: `lib/voice/client.ts` with the three codes (a module the browser may import), `writeOnce()` exported from
  `lib/admin/guard.ts`, `POST /api/admin/voice` answering `voice_not_configured` and `voice_provider_failed` with the
  names in the log once, and `GET /api/voice/signed-url` answering `voice_unavailable` and `limited` with a status and
  a reason code only. `09911ba`.
- **3.2**: `VoiceAgent.tsx` reads `reason` and shows the sentence of the owner with the link "For the installer", or
  the sentence of the provider that did not answer; `agentMissing` is gone and the raw `error` of a payload is never
  read. `9ea3d03`.
- **4.1**: the suite answered. Three test files changed (the two of the voice that asserted the old payload, and the
  guard of the README table, amended to detect the spec written by hand instead of forbidding every ADDED delta over an
  in-force capability, with its red proved with the hazard itself); two guards that fired were answered in the code
  (`lib/voice/client.ts` for `tests/voice-secrets.test.ts`) and in the report of step 1 (the absolute path elided for
  `tests/personal-paths.test.ts`). `42e9afb`.
- **5.1 to 8.1**: the checks (Windows, the `node:24` Linux container over the tree of `42e9afb`, the audit, gitleaks
  per commit and over the history, OpenSpec and `git diff --check`), the manual verification with `curl.exe` over a
  production build on the port 3215, the browser suite (38 of 38, with the E2E test of the signed URL turned to the new
  code), and the state of the base after: 69 files and 599 tests green and the same fourteen tables of the store, row
  by row. `a7bade8`, `f59c66a`, `c495a77`, `f89af7f`.
- **9.1**: `docs/voice.md` (the codes and where the installer reads the names), two sentences of `docs/voice-agent.md`
  corrected, and the delivery `katalis-dev/tasks/entrega-community-15.md` in Spanish with `## Issues`. `c8f66b7`.

## Evidence

- Reports: `openspec/changes/voice-owner-words/reports/2026-09-29-step-{0,1,2,3,4,5,6,7,8,9}-*.md`, each one with the
  exact command, its real output, the commit it was verified against and a verdict.
- `npm test`: 69 files and 599 tests green on Windows (37.08 s at the closing commit); in the `node:24` Linux container
  (v24.21.0, over the clone of `42e9afb`) 69 files, 597 green and the 2 of `tests/design-system.test.ts` that were
  already skipped on Linux.
- `CI=1 npm run test:e2e`: 38 of 38, one minute, no failure and no retry, over the build of the test SDK (no scenario
  reaches ElevenLabs).
- `npm run typecheck`, `npm run lint`, `npm run audit:high` (0 vulnerabilities), `openspec validate --all --strict`
  (13 items), `git diff --check main...HEAD` and gitleaks (8.30.1) per commit, over the round and over the whole
  history: green.
- Manual: `POST /api/admin/voice` twice → `503 {"status":"unconfigured","reason":"voice_not_configured"}`;
  `GET /api/voice/signed-url` → `503 {"status":"unavailable","reason":"voice_unavailable"}`; no name of `.env.example`
  in the status, the headers or the body of the three answers; one line with the names in the log of the server; the
  page "For the installer" still naming them (200).
- The delivery: `katalis-dev/tasks/entrega-community-15.md`, with no BROKEN, five RISK, four NOT DONE and four UNKNOWN.

## Hard rules respected

- No `.env` file with secrets is opened (the repository has none: `Test-Path .env` is `False`); only the public
  template `.env.example` is read. No test and no verification calls ElevenLabs or any real provider: every provider
  answer is a local double and the browser suite uses the test SDK of the voice.
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- The worktrees `community`, `community-ui`, `community-main` and `community-preview` are not touched.
- `MEMORY.md` is in no commit. No personal path in a versioned file (the report of step 1 was corrected for it).
- Every file written is UTF-8 with LF, and the only change in `tasks.md` is the box of each task: `git diff 2f9a75b`
  over that file is ten lines, each one the same line with its box marked and nothing else.
