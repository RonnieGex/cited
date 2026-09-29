## Decisions

1. **Spike before the store.** `tests/spike/libsql-capabilities.test.ts` opens a temporary libSQL file with the Node
   client and runs:
   - the creation of a table with an `F32_BLOB(8)` column;
   - an insert;
   - a vector search (`vector_top_k` over a vector index, or `vector_distance_cos` ordering if the index is not
     available);
   - an FTS5 virtual table with a `MATCH` query.

   Its outcome is recorded here as decision 1b by the implementer, quoting the report. The rest of the store waits for
   it.

   **Decision 1b (recorded by the implementer, deepseek-harness, 2026-09-29): libSQL is the store. The fallback is
   not used.** The spike passed on Windows (Node `v24.11.0`) and in a `node:24` Linux container (Node `v24.21.0`):
   9 of 9 assertions green on both, with `@libsql/client` `0.18.0` over SQLite `3.45.1` and
   `sqlite_compileoption_used('ENABLE_FTS5') = 1`. The report
   (`reports/2026-09-29-step-2-spike.md`) quotes the statements and their results; the load-bearing ones are:
   `CREATE TABLE passages (… embedding F32_BLOB(8) …)` → OK; `INSERT … vector(?)` → `affected=1`;
   `CREATE INDEX passages_embedding ON passages (libsql_vector_idx(embedding))` → OK;
   `SELECT id FROM vector_top_k('passages_embedding', vector(?), 2)` → `[{"id":1},{"id":2}]`;
   `vector_distance_cos` → `0.0000389354390790686` and `0.34518900513648987` in ascending order; and
   `CREATE VIRTUAL TABLE passages_fts USING fts5(text)` with `MATCH 'workshop'` → both passages, with `bm25` scores of
   `-0.000001`. Two findings of the spike shape the store and are worth repeating here: `vector_top_k` exposes the
   keys only, so the distance is measured with `vector_distance_cos` in the query, and the external-content form of
   FTS5 stayed empty without triggers, so the store keeps a standalone FTS5 table in sync explicitly. `better-sqlite3`
   with `sqlite-vec` is therefore not a dependency of this repository, and Turso stays supported by the same code.
2. **Store schema.**
   - `documents(id, name, sha256, type, pages, ingested_at)`.
   - `passages(id, document_id, position, heading, text)`.
   - The FTS5 table over `passages.text` (external content).
   - The vector column or table keyed by passage id.
   - Re-ingestion deletes a document's passages by `document_id` inside one transaction before inserting the new ones.
3. **Parsing.**
   - PDF with a maintained, permissively licensed parser.
   - DOCX with `mammoth`.
   - Markdown and plain text read as UTF-8.
   - Each parser's license is checked and recorded in `docs/search.md`: no GPL/AGPL in a project that is Apache-2.0.
   - The type is decided by magic bytes; the size is checked before reading the whole file.
4. **Chunking.**
   - Passages of about 800 characters with 120 of overlap, split on paragraph boundaries when possible.
   - The heading is taken from the last Markdown heading, or from the DOCX heading style.
   - PDF has no reliable heading, so it uses none and says so.
5. **Embeddings interface.** `embed(texts: string[]): Promise<number[][]>` plus `dimensions`. Three implementations:
   - OpenAI-compatible (`EMBEDDINGS_BASE_URL`, `EMBEDDINGS_MODEL`, `EMBEDDINGS_API_KEY`);
   - Ollama (`OLLAMA_BASE_URL`, `EMBEDDINGS_MODEL`);
   - a deterministic fake for tests.
6. **RRF.** `score = Σ 1/(60 + rank)` over the two rankings, each limited to its top 50, returning the top 8 by
   default.
7. **Sample corpus.** Three to five short documents written for this repository about a fictional small business
   (hours, prices, policies), in Spanish and English, used by the tests and the RAM measurement. **Never** the
   Construye book.
8. **RAM.** Measured with `process.memoryUsage().rss` at peak during ingestion and search of the sample corpus with the
   fake provider and with a recorded-response HTTP double for the OpenAI-compatible path. Reported in `docs/search.md`.
