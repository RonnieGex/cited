# Step 4: validation and store state

All commands ran in the assigned worktree unless explicitly identified as isolated build commands.

| Command | Result |
| --- | --- |
| `npx -y -p node@24 node node_modules/vitest/vitest.mjs run --cache=false` | 99 files, 1215 tests passed, 80.37 s, exit 0 |
| `npx -y -p node@24 node node_modules/eslint/bin/eslint.js .` | Exit 0 |
| `npx -y -p node@24 node node_modules/typescript/bin/tsc --noEmit --incremental false` | Exit 0 |
| `npx -y -p node@24 -c "openspec validate --all --strict"` | 20 passed, 0 failed |
| `npx -y -p node@24 -c "openspec status --change mcp-initialize-version-header --json"` | proposal, design, specs and tasks all present |

## Read-only store snapshots

```powershell
npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/mcp-store-state.test.ts --cache=false --disableConsoleIntercept --reporter=verbose
```

Exit 0, one test passed, 10.83 s. Uses only the sample corpus and deterministic chat/embedding providers, a new
isolated temporary store, and the real POST and tools. The store is seeded before the first snapshot, explicitly
measuring before/after requests rather than claiming to measure a pre-migration store.

The versioned test contains the complete reproducible setup and assertions. Snapshots use `DatabaseSync(path,
{ readOnly: true })`; for every table listed below the exact query is `SELECT count(*) AS total FROM "<table>"`.
Corpus integrity is SHA-256 of JSON serialization of `SELECT * FROM "documents" ORDER BY id` and
`SELECT * FROM "passages" ORDER BY id`. These queries never initialize or migrate the store.

| Table | Before | After rejected requests | After search | After accepted ask |
| --- | ---: | ---: | ---: | ---: |
| documents | 4 | 4 | 4 | 4 |
| passages | 11 | 11 | 11 | 11 |
| passages_fts | 11 | 11 | 11 | 11 |
| rate_limits | 0 | 0 | 0 | 0 |
| model_calls | 0 | 0 | 0 | 1 |
| voice_minutes | 0 | 0 | 0 | 0 |
| voice_agent | 0 | 0 | 0 | 0 |
| conversations | 0 | 0 | 0 | 1 |
| login_attempts | 0 | 0 | 0 | 0 |
| business | 0 | 0 | 0 | 0 |
| provider_settings | 0 | 0 | 0 | 0 |
| provider_tests | 0 | 0 | 0 | 0 |
| document_index | 4 | 4 | 4 | 4 |
| setup_flags | 0 | 0 | 0 | 0 |

All four corpus hashes: `57978afea2352050d14d59024ab0ac3f7e124ae125b31eb5403febf7eb2d2f6a`.
The hash includes ingestion timestamps, so a later seeded run produces its own hash; equality within a run is asserted.
Rejected calls include unsupported-header cited_ask, a batch containing that call and an initialize notification.
Search returns sample passages without writing. The accepted ask returns answered and records one conversation turn
and one model-call accounting row. Shared stores are closed and temporary databases removed afterward.

## Isolated build

Created a detached temporary worktree from `fix/mcp-initialize-version-header`, copied the working diff into it,
installed its own dependencies (no node_modules junction), and ran:

```powershell
npx -y -p node@24 node node_modules/next/dist/bin/next build
```

Exit 0, Next.js 16.4.0, compiled in 10.1 s, TypeScript completed, all routes generated, including `/api/mcp`.
No `next build` ran in the live worktree. The later README test parser change does not affect the compiled application.
The npm install completed but its Windows npm shim reported host Node 24.11.0 engine warnings; all validation/build
commands invoke the Node 24.21.0 binary explicitly. Dependency advisories are evaluated by the repository's CI audit,
not by treating npm's install summary as a clean security audit.

Cleanup command: `git worktree remove --force <verified-temporary-worktree>` completed with exit 0 after the smoke
server exited. The absolute target was checked against the exact temporary directory and node_modules was checked not
to be a junction. `Test-Path` on that directory returned `False`. The live worktree and its .next were not removed.

Documentation-only follow-up: `npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/readme.test.ts
tests/personal-paths.test.ts tests/secrets.test.ts --cache=false`: 61 tests in 3 files passed, exit 0.
