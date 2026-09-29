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
