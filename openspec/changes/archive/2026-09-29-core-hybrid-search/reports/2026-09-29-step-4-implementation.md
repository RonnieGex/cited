# Step 4 - Implementation in small steps

- Date: 2026-09-29
- Change: `core-hybrid-search`
- Branch: `feature/core-hybrid-search`
- Agent: `deepseek-harness`
- Commit verified against: `39684fd` plus the working tree of the change

The implementation follows the offer of the contract: one module at a time, each one demanded by the tests written in
step 3. Every command below was run from the repository root.

## 4.1 The store and its schema

Files: `lib/store/types.ts`, `lib/store/index.ts`. `openStore(path)` creates the schema of design decision 2 in one
go and returns the store.

```
> npx vitest run tests/store.test.ts
 ✓ tests/store.test.ts (8 tests)

Test Files  1 passed (1)
     Tests  8 passed (8)
```

- `documents(id, name unique, sha256, type, pages, ingested_at)`;
- `passages(id, document_id → documents, position, heading, text, embedding F32_BLOB, unique(document_id, position))`;
- `passages_fts` as a standalone FTS5 table over the text, keyed by the same `rowid` as `passages`;
- `passages_document` as a plain index on `document_id`.

`replaceDocument` deletes the passages and the keyword rows of the document and inserts the new ones **inside one
transaction**; `deleteDocument` does the same without inserting. The transaction is what makes "never half-ingested"
true at the store level. `keywordSearch` reads `bm25(passages_fts)` ordered ascending (lower is better), and
`vectorSearch` orders by `vector_distance_cos`, because the spike proved that `vector_top_k` exposes the keys only.

The FTS5 table is standalone and synced explicitly: the spike found that the external-content form stayed empty
without triggers. The keyword rows and the passages are deleted and inserted in the same transaction, so
`countIndexed()` equals `countPassages()` after every replacement, which the tests assert.

## 4.2 Type detection, limits and the three parsers, with their licenses

Files: `lib/ingest/parse.ts`, `lib/ingest/types.ts`.

```
> npx vitest run tests/ingest.test.ts
 ✓ tests/ingest.test.ts (11 tests)
```

- **Magic bytes decide the type**: `%PDF-` is a PDF, `PK\u0003\u0004` is a DOCX, and a file that is neither is read as
  Markdown or plain text, or refused when its extension is one of the known binary ones (`.svg`, `.png`, `.zip`,
  `.xlsx`, …).
- **Limits before the work**: `stat` gives the size and a file above `MAX_FILE_BYTES` (20 MB) is refused before it is
  read; the PDF page count comes from the parser and a document above `MAX_PAGES` (500) is refused before its text is
  used.
- **PDF** with `pdf-parse` 2.4.5 (Apache-2.0, built on `pdfjs-dist`, Apache-2.0): `PDFParse#getText()` returns the
  text and the page count, and the parser is destroyed in a `finally`.
- **DOCX** with `mammoth` 1.13.0 (BSD-2-Clause): it converts the document to HTML, the styles become `<h1>`…`<h6>`,
  and the HTML is turned into Markdown so one heading rule serves both formats.
- **Markdown and plain text** are read as UTF-8 with the BOM removed.

License check of the three: MIT, BSD-2-Clause and Apache-2.0. **No GPL or AGPL anywhere in the tree**; the audit of
step 6 carries the check over the whole dependency list.

## 4.3 Chunking with headings

File: `lib/ingest/chunk.ts`. `chunkText` walks the lines, groups paragraphs and keeps the nearest Markdown heading.

```
> npx vitest run tests/search.test.ts -t chunking
 ✓ hybrid search > chunking > keeps paragraphs together and carries the heading
 ✓ hybrid search > chunking > overlaps consecutive passages of a long paragraph
 ✓ hybrid search > chunking > uses about 800 characters with 120 of overlap by default
```

- Passages of about 800 characters (`DEFAULT_CHUNK_SIZE`) with 120 of overlap (`DEFAULT_CHUNK_OVERLAP`), cut on
  paragraph boundaries and on word boundaries when one paragraph is longer than a passage.
- The heading travels with every passage of its section and is the first words of the passage, so a keyword search
  finds "Precios" or "Cambios y cancelaciones" as well as the body.
- A PDF has no heading and the passage says `null`, exactly as design decision 4 requires.

## 4.4 The embeddings interface and its three providers

Files: `lib/embeddings/types.ts`, `lib/embeddings/fake.ts`, `lib/embeddings/providers.ts`.

```
> npx vitest run tests/embeddings.test.ts
 ✓ tests/embeddings.test.ts (12 tests)
```

| Provider | Variables | Dimensions |
|---|---|---|
| `openai` (any compatible API) | `EMBEDDINGS_BASE_URL`, `EMBEDDINGS_MODEL`, `EMBEDDINGS_API_KEY`, optional `EMBEDDINGS_DIMENSIONS` | 1536 by default |
| `ollama` | `OLLAMA_BASE_URL` (default `http://localhost:11434`), `EMBEDDINGS_MODEL`, optional `EMBEDDINGS_DIMENSIONS` | 768 by default |
| `fake` | none | 64 |

- `resolveEmbeddingsProvider` throws with the **name of the variable** and never a value:
  `The openai embeddings provider needs EMBEDDINGS_API_KEY. …`; an unknown or empty `EMBEDDINGS_PROVIDER` throws with
  the accepted names (`openai, ollama, fake`). The test asserts that the message carries no value.
- Both remote providers use `fetch` with `AbortSignal.timeout(30_000)` and answer the number of the status on an error.
- The fake provider is deterministic: it hashes word features and character trigrams into a normalized vector of 64
  dimensions. The test proves that a Spanish paraphrase of a passage is closer to it than an unrelated passage is, and
  that the same text produces the same vector.
- **The OpenAI-compatible path is exercised without the network**: a `node:http` server on `127.0.0.1` answers a
  recorded response, and the test asserts the request went to `/v1/embeddings` with `Bearer test-key` and the model of
  the environment, and that a `500` produces an error that names the status.

## 4.5 Hybrid search with RRF

Files: `lib/search/rrf.ts`, `lib/search/index.ts`.

```
> npx vitest run tests/rrf.test.ts tests/search.test.ts
 ✓ tests/rrf.test.ts (6 tests)
 ✓ tests/search.test.ts (10 tests)
```

- `reciprocalRankFusion(keyword, vector, k = 60)` returns one entry per passage with `score = Σ 1/(k + rank)`, the
  keyword rank and the vector rank of each list, sorted by score with the tie broken by the better keyword rank, then
  the better vector rank, then the identifier. The fixed example of the test: passage 3 (keyword 1, vector 2) scores
  `1/61 + 1/62 = 0.03252`, above passage 2 (`1/61`) and passage 1 (`1/62`).
- `hybridSearch(question, { store, embeddings, limit })` ranks the keyword list and the vector list, top 50 each
  (`DEFAULT_CANDIDATES`), fuses them and returns the top 8 (`DEFAULT_RESULTS`) with document, heading, position, text
  and score.
- A **keyword-only match** ranks: a rare exact term pulls its passage into the results. The test uses `mantenimiento`,
  the keyword ranking places its passage first and the vector ranking does not, and with the keyword branch disabled
  the case is lost.
- A **meaning-only match** ranks with the fake provider: the question
  `¿Aceptan reprogramaciones gratuitas avisando anticipadamente?` reaches the passage of the cancellation policy with
  an empty keyword ranking (it shares no term with the corpus), so only the vector ranking can find it, and with the
  vector branch disabled the case is lost.

## 4.6 The CLI scripts and the sample corpus

Files: `scripts/ingest.ts`, `scripts/search.ts`, `scripts/lib/store-path.ts`, `samples/`.

```
> npm run ingest -- samples/
ingested README.txt (txt, no pages, 1 passages)
ingested bike-workshop-policies.md (md, no pages, 5 passages)
ingested cafe-la-horquilla.md (md, no pages, 4 passages)
ingested notas-del-negocio.txt (txt, no pages, 1 passages)
documents 4, passages 11, skipped 0, store <temporary path>, 32 ms, rss 107 MB
```

- `npm run ingest -- <folder-or-file> ...` walks a folder recursively, accepts the four types, reports a line per
  document and a line per skipped file, and ends with the counts, the store and the resident memory.
- `npm run search -- "<question>"` prints the top 8 with document, heading, position, score and a snippet.
- Both run with `node --env-file-if-exists=.env`, read `TURSO_DATABASE_URL` first and `DATABASE_URL` second (default
  `.data/katalis.sqlite`), and never write an environment file.
- `samples/` is the corpus of design decision 7, written for this repository about a fictional business
  (Café La Horquilla): two Markdown files and a text file, in Spanish and English, plus a `README.txt` that says what
  the folder is and what it is not. **Nothing of the Construye book and nothing of the private RAG.**

## Files added by the step

```
lib/store/index.ts  lib/store/types.ts
lib/ingest/index.ts  lib/ingest/parse.ts  lib/ingest/chunk.ts  lib/ingest/types.ts
lib/embeddings/types.ts  lib/embeddings/fake.ts  lib/embeddings/providers.ts
lib/search/rrf.ts  lib/search/index.ts
scripts/ingest.ts  scripts/search.ts  scripts/lib/store-path.ts
samples/README.txt  samples/cafe-la-horquilla.md  samples/bike-workshop-policies.md  samples/notas-del-negocio.txt
```

Changed: `package.json` (three dependencies, two scripts), `tsconfig.json` (`allowImportingTsExtensions`, so the
command line can run the modules with the type stripping of Node 24), `vitest.config.mts` (the glob of the nested
spike folder) and `.gitignore` (the store file and its neighbours).

## Verdict

PASS. The 45 assertions written in step 3 are green, together with the ones the implementation added for the HTTP
double; the lint is warning-free and the typecheck is green. `npm run build` compiles with Turbopack and the type
extension imports.

## Correction of step 10

The adversarial review `katalis-dev/tasks/revision-community-02.md` (Major 3) found that the meaning-only claim of this
report was wrong: the question `¿puedo mover mi cita a otro día?` did share the exact tokens `mover` and `cita` with
the cancellation passage, so the keyword ranking did the work and the passage came first even with the vector branch
disabled. The two bullets above were corrected in task 10.3; the real rankings, the three mutation runs and the
corrected figures are in `2026-09-29-step-10-review-round.md`.
