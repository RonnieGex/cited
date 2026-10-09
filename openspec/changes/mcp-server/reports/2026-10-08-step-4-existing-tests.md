# Step 4: the existing tests

- Date: 2026-10-08
- Change: `mcp-server`
- Branch: `feature/mcp-server`
- Agent: DeepSeek (implementer)
- Worktree: `<worktree>`

## What changed in the suite that already existed

One file, `tests/readme.test.ts`, and one line of it: the bilingual map `twinSections` gained the new level-two
section of both READMEs, `"Works with your agent": "Funciona con tu agente"`, in the position the two files carry it
(after `Voice`). The map is the contract of the twin: the test compares the level-two headings of `README.md` and
`README.es.md` with it, in order, so a section added to the front page without its translation fails there. No other
assertion of that file moved.

`tests/voice-secrets.test.ts` and `tests/voice-tool.test.ts` keep passing with `lib/voice/secret.ts` re-exporting
`bearerOf()` and `secretMatches()` from `lib/guards/bearer.ts`: the voice route imports the same names from the same
module and behaves the same.

`tests/store.test.ts` and `tests/store-state.test.ts` keep the list of tables of `lib/store/tables.ts` unchanged, which
is what decision 7 promises: the MCP channel is not stored and the change adds no table. `tests/mcp-tools.test.ts`
asserts it from the other side: it opens a store, writes a document, and compares the tables of `sqlite_master` with
`storeTables`.

## The command and its result

The three files of the change and the seven files the documentation touches, together with the whole suite, ran green in
the gate of step 7: `Tests 1129 passed` over 94 files, with no test changed but the map of the twin. The counts per
chunk are in `reports/2026-10-08-step-7-gate.md`.

## Verdict

PASS. The only existing test that changed is the bilingual map of the section that was added, and the reason is written
here.
