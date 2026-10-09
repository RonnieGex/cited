# Validation

`npm test` -> 96 files, 1167 tests passed. `npx vitest run tests/readme.test.ts` -> 46/46 after final renderer checks. `npm run lint` and `npm run typecheck` -> exit 0.

From the parent workspace, `node tasks/snapshot-agents-r4.mjs before` and `node tasks/snapshot-agents-r4.mjs after` -> 19 identical table counts and SHA-256 hashes. The measured database is `community-readme/.data/katalis.sqlite`, the public sample store, not production. The helper is the versioned `dsh-cited/scripts/lib/database-snapshot.mjs`: DatabaseSync readOnly, SELECT name FROM sqlite_master for non-sqlite tables, SELECT * per table, sorted JSON rows and SHA-256. The before/after arrays are retained here. No client documents or credentials were used. The static landing and plugin own no database. No new real model batch was run.
