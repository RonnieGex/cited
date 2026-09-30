# Step 8: the state of the base after (task 8.1)

Date: 2026-09-30 (UTC). Branch `feature/guided-setup-and-knowledge`. Node of the round:

    $ npx -y -p node@24 node -v
    v24.21.0

The command is the one of the report of task 1.1, on the same store and read the same way: `scripts/store-state.ts`
opens the file with `node:sqlite` and `readOnly: true`, so the "after" it prints is not a state this reading created.

    $ npx -y -p node@24 node scripts/store-state.ts

    store: <worktree>\.data\katalis.sqlite
    exists: true
    bytes: 159744
    tables: 15 (plus the 5 of the full-text index)
      documents rows=4
      passages rows=11
      passages_fts rows=11
      rate_limits rows=2
      model_calls rows=1
      voice_minutes rows=0
      voice_agent rows=0
      conversations rows=0
      login_attempts rows=0
      business rows=0
      provider_settings rows=0 (added by this change)
      provider_tests rows=0 (added by this change)
      document_index rows=4 (added by this change)
      setup_flags rows=0
    rows of the tables this change added: 4

## Which tables and which counts changed, and why

- **`setup_flags` is the one table this change adds** (decision 2: the derived state of a step is not stored, and the
  only stored things are the decisions the owner takes by pressing a button). The report of task 1.1 read 14 tables;
  this reading finds 15, and the new one is `setup_flags`, created by the schema of `lib/store/index.ts` when the round
  opened the store. It has no row: nothing of this change wrote a flag into this store.
- **Every count is the one of the base before.** The four documents with their eleven passages and their four rows of
  the index are the sample corpus the browser suite of the round before this one ingested here, and the model call and
  the two windows of the question limit are the ones of that run. This round ran the whole suite on stores of its own
  under the temporary folder of the machine, and the browser suite runs on `.data/e2e-*.sqlite`, which the configuration
  removes at the start of every run: the store of the working tree was not part of any of them.
- `bytes` moved from 151552 to 159744, which is the page the new table takes.

The state of the store says what the round did: a table for the four flags the owner presses, no row written by the
tests into the store of the developer, and the sample corpus of the corpus of `samples/` exactly where the round before
left it.
