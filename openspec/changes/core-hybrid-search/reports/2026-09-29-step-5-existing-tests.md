# Step 5 - Review and update of the existing tests

- Date: 2026-09-29
- Change: `core-hybrid-search`
- Branch: `feature/core-hybrid-search`
- Agent: `deepseek-harness`
- Commit verified against: `39684fd` plus the working tree of the change

## The existing suite still passes

The three test files of the base are untouched by this change and still pass:

```
> git status --short tests/codeql-workflow.test.ts tests/home.test.tsx tests/personal-paths.test.ts
(no output: none of the three changed)

> npx vitest run
 Test Files  9 passed (9)
      Tests  67 passed (67)
   Duration  9.44s
```

The nine files are the three of the base, the spike of step 2 and the five of this change. The counts of the base
were 3 files and 13 tests; the change adds 54 tests.

## What changed, and why

| File | Change | Why |
|---|---|---|
| `vitest.config.mts` | one glob added: `tests/**/**/*.test.ts` | the spike lives in `tests/spike/`, nested one level deeper than the three files the base collected; without the glob the spike of design decision 1 would never run in `npm test` |
| `tsconfig.json` | `allowImportingTsExtensions: true` | the two command-line scripts run the modules directly with the type stripping of Node 24, which resolves the real file name (`./chunk.ts`), so the relative imports of `lib/` carry the extension; the option tells `tsc` that this is deliberate |
| `.gitignore` | the store file and its neighbours ignored (`/.data/`, `*.sqlite`, `*.sqlite3`, `*.sqlite-wal`, `*.sqlite-shm`) | the store is a file of the installation, not of the repository; `npm run ingest` writes `.data/katalis.sqlite` by default and it must never be committed |
| `package.json` | `ingest` and `search` scripts, and three dependencies | the contract asks for the two scripts; `@libsql/client`, `pdf-parse` and `mammoth` are the store and the parsers |
| `.env.example` | the embeddings variables with empty values | task 9.1 |

Nothing in `app/` and nothing in `e2e/` changed: this change has no page and no route. `git status --short app e2e`
prints no line.

## What the existing tests demanded of the new code

- **`tests/personal-paths.test.ts`** scans every tracked file for a Windows home directory. This is the strictest of
  the three for this change: the reports, the docs, `LOOP_STATE.md` and the tests themselves must carry no absolute
  path of a machine. The reports elide the temporary paths that the tools print, and the tests build every path with
  `mkdtempSync` at run time. The scan is green.
- **`tests/home.test.tsx`** renders the page with React Testing Library and demands one `h1` and one `main`. It is
  untouched and green; the change adds no component and no dependency of the browser.
- **`tests/codeql-workflow.test.ts`** reads `.github/workflows/codeql.yml` with a strict YAML reader. The change does
  not touch the workflow and the test is green.

## Verdict

PASS. The existing suite keeps passing without a single change to its three files; the four changes listed above are
configuration and tooling, and each one is demanded by a task of the contract.
