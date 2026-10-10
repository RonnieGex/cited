# Executed validation

Agent: Codex implementer. Node v24.21.0 was placed first on PATH for every authoritative command. npm scripts were invoked as `node <node-installation>/node_modules/npm/bin/npm-cli.js run <script>` to preserve the pinned runtime.

| Command | Observed result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run --reporter=dot` | Exit 0; 97 files, 1173 tests passed |
| `npm run lint` | Exit 0 |
| `npm run typecheck` | Exit 0 |
| `npm run build` | Exit 0 |
| `npm run audit:high` | Exit 0; no high production finding; one pre-existing development advisory exception expires 2026-11-08 |
| `npm run test:e2e` | Exit 0; 96 tests passed |

## Database state

The before inventory was captured before the full unit/build/E2E run, without opening the application or initializing a store. The after inventory was captured after E2E completed. See the adjacent database-before.json and database-after.json files. Only .data and data local test files were opened, using SQLite mode=ro, with no row contents read. Landing and plugin have no database files.

Observed differences:

```json
[
  {
    "path": ".data\\e2e-admin.sqlite",
    "hashChanged": true,
    "rowsChanged": {}
  },
  {
    "path": ".data\\e2e-affiliate.sqlite",
    "hashChanged": true,
    "rowsChanged": {}
  },
  {
    "path": ".data\\e2e-keys.sqlite",
    "hashChanged": true,
    "rowsChanged": {}
  },
  {
    "path": ".data\\e2e-setup-es.sqlite",
    "hashChanged": true,
    "rowsChanged": {}
  },
  {
    "path": ".data\\e2e-setup.sqlite",
    "hashChanged": true,
    "rowsChanged": {}
  },
  {
    "path": ".data\\e2e.sqlite",
    "hashChanged": true,
    "rowsChanged": {
      "conversations": [
        18,
        36
      ],
      "passages_fts_data": [
        6,
        10
      ],
      "passages_fts_idx": [
        4,
        8
      ],
      "rate_limits": [
        1,
        2
      ]
    }
  }
]
```

Cited E2E fixtures are public sample businesses from the repository. Its default katalis.sqlite business tables retained their counts; test fixture hashes may change as tests rebuild them. No client database was accessed.

## Existing assertions

Updated the previous 24 px client-row padding assertion to the approved equal-row layout. A Windows line-ending conversion initially broke the renderer guard source assertion; preserving the source LF endings restored it. The final complete unit run above passed.
