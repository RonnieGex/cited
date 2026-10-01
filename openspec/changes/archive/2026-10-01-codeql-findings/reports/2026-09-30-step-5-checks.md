# Step 5 · the tests and the checks

Contract: `tasks.md`, task 5.1. Agent: deepseek-harness. Date: 2026-09-30.
Change: `codeql-findings`, branch `feature/codeql-findings`, verified against the code of `15f1fe3` in the
`<worktree>`.
`node -v` is v24.11.0, and the suite runs under the Node 24 of the task (`npx -y -p node@24 node
node_modules/vitest/vitest.mjs run`).

## 5.1 the seven commands

### `npm run typecheck`

```
$ npm run typecheck

> cited@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully

exit=0
```

### `npm run lint`

```
$ npx eslint .

exit=0
```

### `npm test`

```
$ npx -y -p node@24 node node_modules/vitest/vitest.mjs run --no-cache

 RUN  v5.0.2 <worktree>

 Test Files  85 passed (85)
      Tests  1024 passed (1024)
   Duration  77.94s (tests 81%, environment 10%, import 4%, setup 3%, transform 2%)

exit=0
```

85 files and 1024 tests passed in 77.94 s, six more tests than the 1018 of the base of step 1, with no failure and no
skip. The flagged `--no-cache` is what keeps a stale transform from reporting a false green, as it did once during
step 2.

### `npm run build`

```
$ npm run build

✓ Running next.config.ts took 41ms
✓ Compiled successfully in 9.0s
✓ Generating static pages using 15 workers (30/30) in 660ms
...
ƒ Proxy (Middleware)

ƒ  (Dynamic)  server-rendered on demand

exit=0
```

The route table of the build keeps the same shapes: `/api/admin/login`, `/api/admin/documents`, `/api/ask` and the
pages of the panel are all there, dynamic.

### `npm run audit:high`

```
$ npm run audit:high

> cited@0.1.0 audit:high
> npm audit --audit-level=high

found 0 vulnerabilities

exit=0
```

### `npm run secrets:scan`

```
$ npm run secrets:scan

> cited@0.1.0 secrets:scan
> gitleaks git --redact --no-banner

6:39PM INF 546 commits scanned.
6:39PM INF scanned ~7436617 bytes (7.44 MB) in 5.73s
6:39PM INF no leaks found

exit=0
```

### `npm run openspec:validate`

```
$ npm run openspec:validate

> cited@0.1.0 openspec:validate
> openspec validate --all --strict

✓ spec/admin-panel
✓ spec/answering
✓ spec/app-skeleton
✓ change/codeql-findings
✓ spec/design-system
✓ spec/knowledge-search
✓ spec/owner-setup
✓ spec/product-identity
✓ spec/project-readme
✓ spec/provider-settings
✓ spec/public-chat
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
✓ spec/voice-agent
Totals: 14 passed, 0 failed (14 items)

exit=0
```

The change `codeql-findings` validates strict with its two deltas, together with the thirteen specifications of the
repository.

## The table of the step

| Command | Result |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm run lint` | 0 problems |
| `npm test` | 85 files, 1024 passed, 77.94 s |
| `npm run build` | compiled successfully in 9.0 s, 30 of 30 static pages |
| `npm run audit:high` | 0 vulnerabilities |
| `npm run secrets:scan` | 546 commits, no leaks |
| `npm run openspec:validate` | 14 of 14, 0 failed |

## Commit of this task

Every command above ran against the code of `15f1fe3`. The mark of 5.1 and this report landed in `a19f0c3`
("Review the existing tests and run the checks of the change").