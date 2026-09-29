# Step 1 - The state of the base before

- Date: 2026-09-29
- Change: `pluggable-models-and-ask`
- Branch: `feature/pluggable-models-and-ask`
- Agent: `deepseek-harness`
- Commit verified against: `76b1841` ("Confirm the branch of the answers with citations", with `LOOP_STATE.md` set to
  `RUNNING` in the tree)

## 1.1 The battery at the base

### `npm test`

```
> cited@0.1.0 test
> vitest run

 RUN  v5.0.2 <repository root>

 Test Files  11 passed (11)
      Tests  114 passed (114)
   Start at  08:11:00
   Duration  10.09s

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

Runtime: Windows 11, Node `v24.11.0`, npm `11.6.1`. The working tree is clean before the change starts.

## 1.2 The state of the store

The store exists before this change only as the local file of a manual run of the previous change, and it is ignored
by git:

```
> Get-ChildItem -Force .data
<repository root>\.data\katalis.sqlite

> git ls-files | Select-String -Pattern '\.(sqlite|sqlite3|db|db3|sql|mdb)$'
(no output)

> git ls-files .data
(no output)

> git check-ignore -v .data/katalis.sqlite
.gitignore:29:/.data/	.data/katalis.sqlite
```

The tables that exist before, read with the libSQL client:

```
> node --input-type=module   (script on stdin, @libsql/client)

table documents
table passages
index passages_document
table passages_fts
table passages_fts_config
table passages_fts_content
table passages_fts_data
table passages_fts_docsize
table passages_fts_idx
documents 4, passages 11
```

Three tables of the product (`documents`, `passages`, `passages_fts`), the index `passages_document` and the five
shadow tables that SQLite keeps for an FTS5 table. No table of rate limits, model calls or conversations exists yet:
those are born in task 3.3.

### Proof that the tests leave no store file behind

The file was fingerprinted before and after the whole suite:

```
> Get-FileHash .data\katalis.sqlite | Select-Object -ExpandProperty Hash
D1B832D88C2E74996AFCB05AFABE3DD0054219A1667E5034512DCDDF6587B9BA      (before)
D1B832D88C2E74996AFCB05AFABE3DD0054219A1667E5034512DCDDF6587B9BA      (after)

> (Get-Item .data\katalis.sqlite).LastWriteTimeUtc.ToString('o')
2026-09-29T07:22:08.1785064Z                                          (before)
2026-09-29T07:22:08.1785064Z                                          (after)

> Get-ChildItem -Recurse -File -Force -Include *.sqlite,*.sqlite3,*.db
    | Where-Object { $_.FullName -notmatch 'node_modules' }
<repository root>\.data\katalis.sqlite
```

Same hash, same timestamp and the same single file after 114 tests: the suite neither touches the store of the manual
runs nor leaves a store of its own. The mechanism is in the tests themselves: every file that opens a store opens it
under `mkdtempSync(join(tmpdir(), "katalis-store-"))`, `katalis-search-`, `katalis-ingest-`, `katalis-libsql-spike-` or
`katalis-store-remote-`, and removes the directory in its `afterAll`/`finally`. The `git status` after the suite is
empty as well.

## Verdict

PASS. The base is green (11 files, 114 tests, typecheck, lint and 7 validated OpenSpec items), the store carries only
the three tables of the knowledge search, and the suite leaves no store file behind.
