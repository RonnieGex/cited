# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: voice-owner-words (OpenSpec)
ROUND: the whole contract of `openspec/changes/voice-owner-words/tasks.md`, sections 0 to 9
BRANCH: feature/voice-owner-words
BASE: d71220d (the local merge of `main` that brings `provider-keys-in-panel` and `elevenlabs-voice-agent`
together); the change starts at 2f9a75b ("Write the contract of voice-owner-words: the voice routes and screen stop
naming environment variables"). No push, no remote, nothing merged into `main`.
HEAD AT THE START OF THE ROUND: 2f9a75b
HEAD AT THE END OF THE ROUND: the closing commit that carries this file and the report of section 9
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

The requirement "The owner never reads a variable name in an answer of the panel" of
`openspec/specs/provider-settings/spec.md` arrived in `main` with `provider-keys-in-panel`, which was written before the
voice lane existed. On the merged tree three answers still name variables of the environment:

- **`POST /api/admin/voice`** answers an installation without voice with `missing: ["ELEVENLABS_API_KEY",
  "VOICE_TOOL_SECRET"]` and the text "the voice agent needs ELEVENLABS_API_KEY and ... in the environment of the
  server".
- **`components/admin/VoiceAgent.tsx`** prints that list of names to the owner.
- **`GET /api/voice/signed-url`** hands `missing: ["ELEVENLABS_API_KEY"]` or `["ELEVENLABS_AGENT_ID"]` to any visitor,
  and its `429` of the daily cap names `DAILY_VOICE_MINUTE_LIMIT` in the same body.

The change answers with reason codes (`voice_not_configured`, `voice_provider_failed`, `voice_unavailable`), keeps the
names in the log of the server once per process (`console.error`, the helper of the keys lane) and on the page "For the
installer", which is the only place where a variable may be named. A test walks every `route.ts` of `app/api/admin` and
`app/api/voice` in an installation with the panel configured and no voice and compares status, headers and body against
every name of `.env.example`.

Tests first and red before each fix, one small commit per task with gitleaks, and a report with the real output inside
the change folder for every `[x]`, the Linux run in a `node:24` container included.

## What was delivered

- Pending. This file closes with the round.

## Evidence

- Pending. Every step writes its report under `openspec/changes/voice-owner-words/reports/`.

## Hard rules respected

- No `.env` file with secrets is opened (the repository has none); only the public template `.env.example` is read, and
  no test calls ElevenLabs or any real provider: every provider answer is a local double.
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- The worktrees `community`, `community-ui`, `community-main` and `community-preview` are not touched.
- `MEMORY.md` is in no commit. No personal path in a versioned file. UTF-8 with LF in every file written.
- The text of no task, of `design.md` or of the specs is edited: the only change in `tasks.md` is the box of each task.
