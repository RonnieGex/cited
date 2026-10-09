# Validation

`npx -y -p node@24 npm test`:96 files,1167 tests passed. `npm run lint` and `npm run typecheck` under Node24 both exit0. OpenSpec all strict15/15.

Snapshots database-before.json and database-after.json contain actual19-table row counts/SHA-256 from the isolated community-readme/.data/katalis.sqlite sample store: identical around validation. Snapshot uses read-only DatabaseSync through dsh-cited/scripts/lib/database-snapshot.mjs and performs no initialization. Capture evidence separately records model_calls changes; it is not conflated with static unit validation.
