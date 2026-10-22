# Step 4: types, lint, specification and the whole unit suite

Date: 2026-10-21. Agent: Fable. Working tree of commit `1d09bb6`, Windows 11, Node `v24.11.0`.

| Command | Result |
| --- | --- |
| `npm run typecheck` | `next typegen` generated the route types, `tsc --noEmit` exit 0 |
| `npm run lint` | `eslint .` exit 0 |
| `npx --yes @fission-ai/openspec@1.1.1 validate --all --strict` | `Totals: 20 passed, 0 failed (20 items)`, exit 0 |
| `npm test` | `Test Files 100 passed (100)`, `Tests 1235 passed (1235)`, `Duration 49.49s`, exit 0 |

The change adds one test file (20 cases) to the 1215 the previous archived change counted.

## State of the store

The change writes no migration and touches no table. The state the spec cares about is proved inside
`tests/embeddings-batch.test.ts`, on a new temporary store per case:

| Case | Before | After |
| --- | ---: | ---: |
| ingestion of 40 passages with `EMBEDDINGS_BATCH=16`: `countPassages()` | 0 (new store) | 40 |
| the same case: `countVectorized()` | 0 | 40 |
| re-index of 40 passages with `EMBEDDINGS_BATCH=4`: `reindexStore` report | ingested with the fake provider | `{ documents: 1, passages: 40 }` |

In every case the texts the provider received, concatenated in request order, equal the passages of the store in
order (`getPassages({ name, limit: 100 })`). That proves the order of the requests, not where each vector was
stored; the adversarial review (step 8) asked for the latter, and since then every case reads the stored vectors back
from the file and compares each one with the embedding of its own text, for the ingestion and for the re-index.

## Not run locally

`npm run build`, `npm run test:e2e`, `npm run audit:high` and the secret scan of the whole history run in the
pull-request pipeline and are recorded from it in the step 7 report. The pre-commit hook ran `gitleaks` on the
staged snapshot of `1d09bb6`: `no leaks found`.
