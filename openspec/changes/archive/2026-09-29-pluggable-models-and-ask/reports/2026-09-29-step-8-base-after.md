# Step 8 - The state of the base after

- Date: 2026-09-29
- Change: `pluggable-models-and-ask`
- Branch: `feature/pluggable-models-and-ask`
- Agent: `deepseek-harness`
- Commit verified against: `4d30c7c` (the end-to-end step)

## 8.1 The battery at the base, repeated

### `npm test`

```
> cited@0.1.0 test
> vitest run

 Test Files  16 passed (16)
      Tests  165 passed (165)
   Duration  10.33s

test exit: 0
```

### `npm run typecheck`

```
> cited@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
typecheck exit: 0
```

### `npm run lint`

```
> cited@0.1.0 lint
> eslint .

lint exit: 0
```

### `openspec validate --all --strict`

```
> openspec validate --all --strict

- Validating...
✓ spec/app-skeleton
✓ spec/knowledge-search
✓ change/pluggable-models-and-ask
✓ spec/product-identity
✓ spec/project-readme
✓ spec/repository-bootstrap
✓ spec/supply-chain-security
Totals: 7 passed, 0 failed (7 items)
openspec exit: 0
```

### `git status`

```
> git status --short
(no output)
```

The working tree is clean and the branch carries the change, unarchived and unpushed.

## 8.2 The state of the store, repeated

```
> git ls-files | Select-String -Pattern '\.(sqlite|sqlite3|db|db3|sql|mdb)$'
(no output)

> Get-ChildItem -Recurse -File -Force -Include *.sqlite,*.sqlite3,*.db
    | Where-Object { $_.FullName -notmatch 'node_modules' }
<repository root>\.data\katalis.sqlite
```

The file was fingerprinted before the change (step 1.2) and after the whole change:

```
> Get-FileHash .data\katalis.sqlite | Select-Object -ExpandProperty Hash
D1B832D88C2E74996AFCB05AFABE3DD0054219A1667E5034512DCDDF6587B9BA      (before)
D1B832D88C2E74996AFCB05AFABE3DD0054219A1667E5034512DCDDF6587B9BA      (after)

> (Get-Item .data\katalis.sqlite).LastWriteTimeUtc.ToString('o')
2026-09-29T07:22:08.1785064Z                                          (before)
2026-09-29T07:22:08.1785064Z                                          (after)
```

Same hash, same timestamp, same single file after 165 tests: the suite still neither touches the store of the manual
runs nor leaves a store of its own. Every test opens its store under `mkdtempSync(join(tmpdir(), ...))` and closes it.

### The tables of the store of the manual runs

```
> node --input-type=module   (script on stdin, @libsql/client over .data/katalis.sqlite)

documents       4
passages        11
passages_fts    11
passages_fts_config     1
passages_fts_content    11
passages_fts_data       16
passages_fts_docsize    11
passages_fts_idx        14
```

The store of the previous change still carries only the three tables of the knowledge search, because no run of the
new code has opened it: the tables of the answer are created when the store is opened. On a **copy** of that file, so
that the original is not modified:

```
> node --input-type=module   (openStore over a copy of .data/katalis.sqlite)

opened <temporary folder>\cited-store-migration.sqlite
conversations   0
documents       4
model_calls     0
passages        11
passages_fts    11
passages_fts_config     1
passages_fts_content    11
passages_fts_data       16
passages_fts_docsize    11
passages_fts_idx        14
rate_limits     0
```

The three new tables appear empty next to the three of the base, and the four documents and eleven passages of the
copy are untouched: the schema of the change is additive. A store of a real run carries the counters and the turns,
as step 5.2 shows with rows.

## Verdict

PASS. The battery is green, the tree is clean, and the store of the base is untouched by the suite and grows its
three new tables only when the new code opens it.
