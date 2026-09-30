# Step 10.6: the state of the base after, on the merged tree (task 10.6, the repeat of 8.1)

Implementer: Sonnet 5.5. Date: 2026-09-29. Run in `<worktree>` (`community-ui`) at `e9d1aa9` plus the image of the README. Windows 11.

The state of the store is read with the tool that `main` brought (`scripts/store-state.ts`, `npm run store:state`), which opens the file with `node:sqlite` and `readOnly: true`, writes nothing, and exits
with code 2 if the store is not there. It replaces the scratch script of steps 1 and 8, which opened the store through the client of the application. The store read is `.data/preview.sqlite`, the one of the running preview
(`next dev -p 3300`, the review lane's, which serves this worktree).

```
$ node scripts/store-state.ts .data/preview.sqlite
store: <worktree>/.data/preview.sqlite
exists: true
bytes: 163840
tables: 14 (plus the 5 of the full-text index)
  documents rows=4
  passages rows=11
  passages_fts rows=11
  rate_limits rows=1
  model_calls rows=1
  voice_minutes rows=0
  voice_agent rows=0
  conversations rows=94
  login_attempts rows=0
  business rows=1
  provider_settings rows=0 (added by this change)
  provider_tests rows=0 (added by this change)
  document_index rows=0 (added by this change)
rows of the tables this change added: 0
```

("added by this change" is the wording of the script, written for the change of the keys in the panel; those three tables belong to `main`, not to this change.)

## Compared with step 1 and step 8

| Table | Step 1 (before) | Step 8 (after, old base) | Now (merged tree) | |
|---|---|---|---|---|
| `business` | 1 | 1 | 1 | same |
| `documents` | 4 | 4 | 4 | same |
| `passages` and `passages_fts` | 11, 11 | 11, 11 | 11, 11 | same |
| `login_attempts` | 0 | 0 | 0 | same |
| `model_calls` | 1 | 1 | 1 | same |
| `rate_limits` | 1 | 1 | 1 | same |
| `conversations` | 3 | 15 | 94 | +91 since step 1 |
| `voice_minutes`, `voice_agent` | not there | not there | 0 rows each | new tables, from `main` (`elevenlabs-voice-agent`) |
| `provider_settings`, `provider_tests`, `document_index` | not there | not there | 0 rows each | new tables, from `main` (`provider-keys-in-panel`) |

Which tables changed and why:

- **`business`, `documents`, `passages`, `passages_fts`, `login_attempts`, `model_calls`, `rate_limits`: none.** The tables that this change could break are untouched.
- **Five new tables with no row.** They come from the two changes of `main` that this branch merged (the keys in the panel and the voice agent). They exist in this file, I infer, because the preview server reloaded the merged code and its store
  opened with the current schema (`openStore()` creates every table the schema declares); they hold no row.
- **`conversations`: 3 to 94.** The preview is used: every run of `scripts/capture-ui.mjs`, every look at the public page of the review lane and the browser checks of the three rounds of review ask a question, and each question is a row. `model_calls`
  stayed at 1, so none of those rows went through the counter of the model calls of the day. This is the same explanation as in step 8 and it has the same limit (below).
- **This change adds no table and no write path.** `git diff --stat main...HEAD -- lib/store app/api` prints nothing: no file of the store and no route was touched by the change; its files are the interface, the strings, the tests, the documents and the scripts of capture.

My own runs never opened `.data/preview.sqlite`: the E2E ran in a clone with its own stores (`.data/e2e*.sqlite`), the curl of 10.4 used `.data/curl-10-4.sqlite` (deleted afterwards) and the captures used `.data/captures.sqlite` of the clone.

## Issues

- **UNKNOWN**: I did not read the rows of `conversations`, so who asked the 91 new questions is an inference from the count and from the habits of the review lane; Franc also uses that preview.
- **RISK**: the preview server of the review lane is still running the code that it loaded and hot-reloaded during this round, and the file changes while it is used; the numbers above are of the moment of the read.
