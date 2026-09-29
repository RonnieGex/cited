# LOOP_STATE · Katalis Responde Community

STATUS: DONE
CHANGE: core-hybrid-search (OpenSpec)
BRANCH: feature/core-hybrid-search
BASE: 2e1e580 (main)
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute the contract `openspec/changes/core-hybrid-search/tasks.md`, written by Fable, in order, with the evidence of
every task in `openspec/changes/core-hybrid-search/reports/`. This is change 2 of the approved plan
(`katalis-dev/tasks/plan-rag-abierto.md`): the core of Katalis Responde Community, the ingestion of the owner's
documents, the embeddings behind an interface and the hybrid search over a local store. The store is decided by a
spike that runs before any other code: libSQL only if native vectors and FTS5 work on a local file through the Node
client; otherwise `better-sqlite3` with `sqlite-vec`, with Turso documented as not supported yet.

## What was delivered

- **Step 0**: the branch and its base confirmed: `feature/core-hybrid-search` over `2e1e580` (`main`), with the
  contract of Fable as its only commit.
- **Step 1**: the state of the base before. The suite, the typecheck, the lint and the strict validation are green on
  Windows (3 files, 13 tests), and the proof that no store exists yet: no file with a database extension outside
  `node_modules`, no datastore dependency among the eighteen declared packages, and no `lib/`, `migrations/`,
  `samples/` or `data/` directory.
- **Step 2**: the spike. `tests/spike/libsql-capabilities.test.ts` ran green 9 of 9 on Windows (Node `v24.11.0`) and
  in a `node:24` Linux container (Node `v24.21.0`): `F32_BLOB` columns, `vector(?)` inserts, a vector index,
  `vector_top_k`, `vector_distance_cos`, an FTS5 table with `MATCH` and `bm25`. `tests/spike/probe.mjs` prints every
  statement with its raw result and the report pastes it. Decision 1b is written in `design.md` — the only design text
  this execution writes — and it records two findings that shaped the store: `vector_top_k` exposes the keys only, so
  the distance is measured with `vector_distance_cos`, and the external-content form of FTS5 stayed empty without
  triggers, so the store keeps a standalone FTS5 table in sync explicitly. **libSQL is the store and the
  `better-sqlite3` + `sqlite-vec` fallback is not used.**
- **Step 3**: tests first. Five new files and 45 assertions covering every scenario of `specs/knowledge-search/spec.md`
  (renamed file, broken file, limits, re-ingestion, missing key, keyword-only match, meaning-only match, RRF
  arithmetic on a fixed example), red because the modules did not exist yet.
- **Step 4**: the implementation, one step at a time. `lib/store/` with the schema and the transactional replacement;
  `lib/ingest/` with the magic bytes, the two limits, the three parsers and the chunking of about 800 characters with
  120 of overlap and its headings; `lib/embeddings/` with the interface and the three providers; `lib/search/` with
  the two rankings and the fusion of `k = 60`; `scripts/ingest.ts` and `scripts/search.ts`; and `samples/` with the
  corpus written for this repository about a fictional business.
- **Step 5**: the existing suite still passes with its three files untouched; the four files of the base that changed
  are configuration, each one demanded by a task of the contract.
- **Step 6**: every check green on Windows and on `node:24` Linux — `npm test` 9 files and 69 tests, `npm run
  typecheck`, `npm run lint`, `npm run build`, `npm run audit:high`, gitleaks (40 commits, no leaks), `openspec
  validate --all --strict` (4 passed) and `git diff --check`. The dependency review of the 615 locked packages finds
  no GPL and no AGPL. The store does not exist before the change and no test leaves one behind.
- **Step 7**: the manual verification with the fake provider: `npm run ingest -- samples/` (4 documents, 11 passages)
  and three searches, one in Spanish and two in English, with the top result of each one pasted.
- **Step 8**: not applicable, with the empty diff of `app/` and `e2e/` as the evidence.
- **Step 9**: `docs/search.md` with how ingestion, chunking and the hybrid search work, the providers and their
  variables, the parser licenses, the measured memory and the store decision; `.env.example` with the new names and
  empty values; and the delivery in Mexican Spanish.

All the nineteen boxes of the contract are `[x]`, every one with its report, and the text of no task and no line of
the spec delta was edited.

## One real finding that would have broken the pipeline

`npm ci` failed on Linux with the lock file that `npm install` wrote on Windows (`Missing: @emnapi/runtime@1.11.3
from lock file`, `Missing: @emnapi/core@1.11.3`). The lock file was regenerated **inside the `node:24` container**
with `npm install --package-lock-only`, which produced 616 entries with every platform package of `sharp`, `next` and
`emnapi`. The regenerated file installs with `npm ci` on Linux (exit 0) and on Windows (exit 0, 609 packages), and the
whole suite passes on both on top of it.

## State of the tree

The work of this execution is **committed** on `feature/core-hybrid-search` in twelve small commits, in the order the
contract lays out: the tests first, the spike with its report and design decision 1b, the four modules, the command
line with its dependencies and its lock file, the sample corpus, the documentation, and the reports with the boxes of
the contract. `git status` is clean at the closing commit, no remote was contacted, and `main` still points at
`2e1e580`.

## Commits (all on feature/core-hybrid-search, none in main)

| SHA | Message |
|---|---|
| `21d085f` | test(core-hybrid-search): add the red suite for the knowledge search |
| `8513047` | test(core-hybrid-search): probe libSQL vectors and FTS5 for the store |
| `de58cfc` | feat(core-hybrid-search): add the libSQL store |
| `1104da5` | feat(core-hybrid-search): ingest, parse and chunk the documents |
| `debec7a` | feat(core-hybrid-search): add the embeddings interface and its providers |
| `74626c7` | feat(core-hybrid-search): fuse keyword and vector search with RRF |
| `3fe4122` | feat(core-hybrid-search): add the ingest and search CLIs |
| `5c21091` | docs(core-hybrid-search): add the sample corpus of the fictional business |
| `081e500` | docs(core-hybrid-search): document the knowledge search |
| `010f8c2` | chore(core-hybrid-search): declare the embeddings variables |
| `0fdbb22` | chore(core-hybrid-search): ignore the local store files |
| `d173b10` | docs(core-hybrid-search): report the steps of the contract |

`main` stays at `2e1e580` and the branch starts at the single commit of Fable, `39684fd` ("Specify the core hybrid
search of Katalis Responde Community"). The closing commit carries this state file; a commit cannot list its own hash,
so the table stops at the twelve commits of the work itself. No `MEMORY.md`, no `.env` and no generated data file was
ever staged, and the pre-commit hook of the repository (gitleaks) passed on every one of the thirteen commits.

## Evidence

`openspec/changes/core-hybrid-search/reports/` holds one report per step, with the exact command, the commit and the
real output: `2026-09-29-step-0-branch.md`, `-step-1-base-before.md`, `-step-2-spike.md`, `-step-3-tests-first.md`,
`-step-4-implementation.md`, `-step-5-existing-tests.md`, `-step-6-checks.md`, `-step-7-manual.md`, `-step-8-e2e.md`
and `-step-9-docs.md`.

## Hard rules respected

- No Lufga source material and no licensed font file: nothing of the sort was downloaded, copied or added.
- Nothing from the Construye book and nothing from the private RAG: the corpus of `samples/` was written for this
  repository about a fictional business, and its `README.txt` says so.
- No personal path and no personal data in any tracked file. The scan of `tests/personal-paths.test.ts` is green; two
  absolute paths were removed from the reports when the scan found them.
- No network call to a real provider: every test uses the deterministic fake provider or an HTTP double on
  `127.0.0.1`. The two remote providers are exercised only through that double.
- No GPL or AGPL dependency: the review of the 615 locked packages finds none; `jszip` is dual
  `(MIT OR GPL-3.0-or-later)` and is taken under MIT.
- No `.env` file was opened: only the tracked template with empty values, which the task asks to update.
- No push; no commit in `main`; no archive.
- UTF-8 with LF in every file written or modified (`git ls-files --eol` reports no CRLF and no mixed ending).

## Pending and out of scope

- **RISK, owner the maintainers of the launch change**: 14 optional platform packages of `libvips` behind `sharp`
  (which arrives with `next`) carry `LGPL-3.0-or-later`. They are LGPL — not GPL and not AGPL, so the hard rule of
  this mission holds — but a product that redistributes a container image with `sharp` inside must ship the LGPL
  notice and the offer of the library's source. It is not a dependency this change added.
- **RISK**: this machine runs Node `24.11.0` while the declared floor is `24.15.0`, so `npm ci` prints `EBADENGINE`
  warnings about the root package, `jsdom` and its helpers. Inherited from the bootstrap change and not affected by
  this one.
- **NOT DONE, by the rules of this mission**: the pipeline of the branch on GitHub was not run, because a push is
  forbidden here. The equivalent battery was run locally on Windows and in a disposable `node:24` container that
  reproduces the runner, which is what the reports quote.
- **UNKNOWN**: the quality of a real embeddings provider on a real corpus of a business. This change measures with a
  deterministic fake and with a recorded response; the plan already names that risk, and `docs/search.md` states the
  honest expectation in its section 8.
- **NOT DONE, reserved for Fable**: the archive of the change and the adversarial review of Codex. The commit of the
  implementation is done by this execution: the twelve commits of the table above, all on `feature/core-hybrid-search`
  and none in `main`. Archiving needs the explicit OK of Franc.

## Closing

The closing battery ran on the twelve commits of `feature/core-hybrid-search`, with a clean tree and no store file in
it: `npm test` 9 files and 69 tests passed, and `npm run typecheck`, `npm run lint`, `openspec validate --all
--strict`, `git diff --check 39684fd..HEAD` and `git status` all came out clean, with gitleaks over the whole history
reporting 52 commits scanned and no leaks found. The reports also carry the same suite green in a disposable `node:24`
Linux container, plus `npm run build` and `npm run audit:high` on Windows. `main` still points at `2e1e580`, and
`openspec/changes/archive/` keeps its three earlier entries, without this change.

The delivery is `katalis-dev/tasks/entrega-community-02.md`, in Mexican Spanish, with its `## Issues` section and its
`## Commits de la entrega` section, which lists the twelve commits and the output of the closing battery taken on the
clean tree of the closing commit.
