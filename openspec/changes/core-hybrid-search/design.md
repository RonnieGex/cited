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
