# Step 5 - The checks and the state of the store

- Date: 2026-09-29
- Change: `pluggable-models-and-ask`
- Branch: `feature/pluggable-models-and-ask`
- Agent: `deepseek-harness`
- Commit verified against: `0ee18cc` (the whole suite green) plus the fix of the lock file and of the command-line
  test of this step

## 5.1 The checks

### Windows 11, Node `v24.11.0`, npm `11.6.1`

```
> npm ci
added 625 packages, and audited 632 packages in 32s
found 0 vulnerabilities
npm ci exit: 0

> npm test
 Test Files  16 passed (16)
      Tests  165 passed (165)
   Duration  12.22s
test exit: 0

> npm run typecheck
✓ Types generated successfully
typecheck exit: 0

> npm run lint
lint exit: 0

> npm audit --audit-level=high
found 0 vulnerabilities
audit exit: 0

> npm run secrets:scan
gitleaks: 158 commits scanned, no leaks found
gitleaks exit: 0

> openspec validate --all --strict
✓ spec/app-skeleton
✓ spec/knowledge-search
✓ change/pluggable-models-and-ask
✓ spec/product-identity
✓ spec/project-readme
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 7 passed, 0 failed (7 items)
openspec exit: 0

> git diff --check main...HEAD
diff-check exit: 0
```

### `node:24` on Linux, in a container

The tree was copied to a temporary directory outside the repository (no `node_modules`, no `.next`, no `.data`, and no
`.env`, which was verified absent) and mounted at `/app`:

```
> docker run --rm -v <temporary copy>:/app -w /app node:24 bash -lc "node --version && npm ci && npm test"
v24.21.0
11.19.0
added 512 packages, and audited 513 packages in 3m
found 0 vulnerabilities

 Test Files  16 passed (16)
      Tests  165 passed (165)
   Duration  34.68s
```

The same 165 tests pass on both platforms. Linux installs 512 packages instead of 625 because the optional binaries of
the other platform are not installed there.

### Two findings of this step, both fixed

1. **The lock file had lost five entries.** `npm install` (the command of 3.1 that added the AI SDK) pruned from
   `package-lock.json` the five packages of the `wasm32-wasi` branch that Windows does not install:
   `node_modules/@emnapi/core`, `node_modules/@emnapi/runtime`, `node_modules/@emnapi/wasi-threads` and the two
   nested ones under `node_modules/@tailwindcss/oxide-wasm32-wasi/`. `npm ci` on Windows did not notice, but
   `npm ci` on Linux refused the lock file:

   ```
   npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
   npm error Missing: @emnapi/runtime@1.11.3 from lock file
   npm error Missing: @emnapi/core@1.11.3 from lock file
   npm error Missing: @emnapi/wasi-threads@1.2.3 from lock file
   ```

   The five entries were restored from `main` (the file before this change) and the lock file was verified again with
   `npm ci` on Windows (625 packages, exit 0) and in the container (512 packages, exit 0). The comparison also proved
   that `npm install` changed no version of the base: the only differences against `main` outside the restored entries
   and the sixteen new packages are the `peer` and `dev` flags that npm writes differently. A silent upgrade of a
   shared dependency would have been a finding of another size, and there is none.
2. **The command-line test needed a longer timeout.** In the container the first `npm run ask` of the suite takes
   5.9 s, above the default of 5 s of Vitest, because the test starts a second Node process. The three tests of
   `tests/ask-cli.test.ts` now carry `{ timeout: 30_000 }`, the same figure the slow fixtures of the base use. The
   timeout is a property of the runner and not of the product: the command itself answers in about 12 ms.

## 5.2 The state of the store after the tests

The suite leaves no store in the repository: the only file with a database extension outside `node_modules` is
`.data/katalis.sqlite`, and after the whole suite it carries the same hash and the same timestamp as before the
change started (`D1B832D8...B9BA`, `2026-09-29T07:22:08.1785064Z`, from step 1.2). The tests open their store under
`mkdtempSync(join(tmpdir(), ...))`.

The store of a real run was then built and read: the sample corpus ingested, three questions asked through
`POST /api/ask` with `TRUST_PROXY=1` and `x-forwarded-for: 203.0.113.7`, then every table counted and read:

```
ask 1: 200 answered
ask 2: 200 answered
ask 3: 200 answered

table	rows
conversations	3
documents	4
model_calls	1
passages	11
passages_fts	11
passages_fts_config	1
passages_fts_content	11
passages_fts_data	6
passages_fts_docsize	11
passages_fts_idx	4
rate_limits	1

rate_limits: [{"ip_hash":"1a91eae9739a2cceea9da45fdc04d97073486854a1dc70e5b73c477603c0058b","window_start":"2026-09-29T14:00:00.000Z","count":3}]
model_calls: [{"day":"2026-09-29","count":3}]
conversations: [{"session_id":"demo","turn":1,...},{"session_id":"demo","turn":2,...},{"session_id":"demo","turn":3,...}]
```

- The three tables of this change exist (`rate_limits`, `model_calls`, `conversations`) next to the three of the base
  (`documents`, `passages`, `passages_fts`) and their five shadow tables.
- Three questions of one address in one hour are one row of `rate_limits` with `count: 3`; three model calls are one
  row of `model_calls` with `count: 3`; the three turns of the session are three rows of `conversations`.
- **No address in clear.** The only column that carries the visitor is `ip_hash`, 64 hexadecimal characters
  (`1a91eae9...058b`), the SHA-256 of `sal-de-prueba-para-el-hash:203.0.113.7`; the address `203.0.113.7` appears in
  no row of any table.

## Verdict

PASS. Every check of the contract is green on Windows and on Linux, the lock file installs on both, and the store of
the answer keeps the counters of the spend and the turns of the session without ever keeping an address in clear.
