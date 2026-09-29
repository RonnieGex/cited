# Knowledge search

How Cited turns the documents of a business into passages and answers a question with the
passages that come closest to it. This is change 2 of the approved plan: the core, before any chat, voice or page.

The module is deliberately lighter than the paid service: keyword ranking and vector similarity fused with Reciprocal
Rank Fusion, with no reranker and no measured evaluation. Section 8 says what quality to expect.

## 1. The store

**libSQL** is the store, decided by the spike of `tests/spike/libsql-capabilities.test.ts` (design decision 1b, in
`openspec/changes/core-hybrid-search/design.md`). The spike ran on Windows (Node `v24.11.0`) and in a `node:24` Linux
container (Node `v24.21.0`) with `@libsql/client` `0.18.0` over SQLite `3.45.1`:

- `F32_BLOB` columns, `vector(?)` inserts, `libsql_vector_idx`, `vector_top_k` and `vector_distance_cos` all work;
- FTS5 works with `MATCH` and `bm25`;
- the same code serves a local file and Turso, because both go through the same client.

Two findings of the spike shaped the store:

1. `vector_top_k` returns the keys of the matching rows only, so the distance is measured in the query with
   `vector_distance_cos`.
2. The external-content form of FTS5 stayed empty without the triggers that feed it, so the store keeps a standalone
   FTS5 table and syncs it explicitly, inside the same transaction as the passages.

The store lives in one file. By default it is `.data/katalis.sqlite`, which `.gitignore` excludes: back it up by
copying it. `TURSO_DATABASE_URL` wins over `DATABASE_URL`, so the same code runs against a local file or Turso.

A remote URL (`libsql://`, `https://` or `wss://`) authenticates with `TURSO_AUTH_TOKEN`: the token travels to the
libSQL client as `authToken`, and an empty value stops the run before any query, with a message that names the variable
and never a value. A local `file:` URL needs no token.

### Schema

| Table | Columns |
|---|---|
| `documents` | `id`, `name` (unique), `sha256`, `type`, `pages`, `ingested_at` |
| `passages` | `id`, `document_id`, `position`, `heading`, `text`, `embedding F32_BLOB`, unique `(document_id, position)` |
| `passages_fts` | FTS5 over the text of each passage, keyed by the same `rowid` as `passages` |

Re-ingestion deletes the passages and the keyword rows of the document by `document_id` and inserts the new ones
inside one transaction, so the count of passages of a document is the same after a second run.

## 2. Ingestion

`lib/ingest/` accepts PDF, DOCX, Markdown and plain text.

- **The type comes from the content, not the name.** `%PDF-` means PDF and `PK\u0003\u0004` means DOCX. A file named
  `notes.pdf` that holds plain text is ingested as plain text; a file whose content is not an accepted type is refused
  and the report says so.
- **Limits before parsing.** A file above 20 MB is refused before it is read (`MAX_FILE_BYTES`), and a PDF above 500
  pages is refused from its page count before any of its text is extracted (`MAX_PAGES`). The report names the limit
  that was crossed.
- **A file that cannot be parsed is reported and skipped**, with no passage of it in the store, and the rest of the
  folder is ingested.
- A run reports one line per document (`ingested <name> (<type>, <pages>, <passages> passages)`) and one line per
  skipped file with its reason. Ingestion stops before reading any document when the embeddings provider is not
  configured: the message names the variable and never a value.

```bash
npm run ingest -- samples/
npm run ingest -- "C:\ruta\a\mis documentos" "C:\ruta\a\otro.pdf"
```

### Chunking

`lib/ingest/chunk.ts` splits the text into passages of about **800 characters with 120 of overlap**
(`DEFAULT_CHUNK_SIZE`, `DEFAULT_CHUNK_OVERLAP`), on paragraph boundaries when possible and on word boundaries when a
single paragraph is longer than a passage.

- The heading of a passage is the nearest Markdown heading above it, and the heading is also the first words of the
  passage so a keyword search finds it.
- DOCX headings arrive as Markdown headings because `mammoth` converts the document to HTML and the styles are kept.
- **PDF has no reliable heading**, so a PDF passage has none and the documentation says so.

## 3. Embeddings

`lib/embeddings/` defines one interface (`dimensions`, `embed(texts)`, `embedQuery(text)`) with three implementations.
The provider is chosen with environment variables only.

| Provider | Variables | Notes |
|---|---|---|
| `openai` | `EMBEDDINGS_BASE_URL`, `EMBEDDINGS_MODEL`, `EMBEDDINGS_API_KEY`, optional `EMBEDDINGS_DIMENSIONS` | any OpenAI-compatible embeddings API; the key travels in the `authorization` header and is never logged |
| `ollama` | `OLLAMA_BASE_URL` (default `http://localhost:11434`), `EMBEDDINGS_MODEL`, optional `EMBEDDINGS_DIMENSIONS` | local models, no key |
| `fake` | none | deterministic, offline, for tests and for a first run without a provider |

`EMBEDDINGS_PROVIDER` is required and is one of `openai`, `ollama` or `fake`. A missing or empty variable stops the
run with a message that names the variable:

```
EMBEDDINGS_PROVIDER must be one of openai, ollama, fake; received an empty or unknown value.
The openai embeddings provider needs EMBEDDINGS_API_KEY. Fill it in the environment of the server; an empty value is an absent value.
```

No test calls a real provider. The suite uses the fake provider and one HTTP double that listens on `127.0.0.1` and
answers a recorded response, so the OpenAI-compatible path is exercised without leaving the machine.

## 4. Hybrid search

`lib/search/` ranks the passages twice and fuses the two rankings.

1. **Keyword ranking (FTS5).** The question is normalized (accents removed, lowercased) and every term is searched,
   ordered by `bm25`, top 50.
2. **Vector ranking.** The question is embedded and the passages are ordered by `vector_distance_cos`, top 50.
3. **Reciprocal Rank Fusion.** `score = Σ 1 / (60 + rank)` over the two rankings (`DEFAULT_RRF_K = 60`), a passage
   that only one ranking found keeps its single contribution, and the top 8 (`DEFAULT_RESULTS`) come back with their
   document, heading, position, text and fused score.

```bash
npm run search -- "¿Cuánto cuesta una afinación de bicicleta?"
npm run search -- "What is the cancellation policy?"
```

## 5. The command line

| Command | What it does |
|---|---|
| `npm run ingest -- <folder-or-file> ...` | creates or updates the store with PDF, DOCX, MD and TXT files |
| `npm run search -- "<question>"` | prints the top 8 passages of the store |

Both read `.env` when it exists (`node --env-file-if-exists=.env`), never write it, and print the store they used and
the resident memory at the end of the run.

## 6. Parser licenses

This project is Apache-2.0 and carries no GPL or AGPL dependency. The parsers of the ingestion:

| Package | Version | License |
|---|---|---|
| `@libsql/client` | 0.18.0 | MIT |
| `mammoth` (DOCX) | 1.13.0 | BSD-2-Clause |
| `pdf-parse` (PDF) | 2.4.5 | Apache-2.0 |

`pdf-parse` is built on `pdfjs-dist` (Apache-2.0). Both are maintained and permissive. No package of the tree is
GPL or AGPL; `npm run audit:high` and the dependency review of the change report carry the check.

## 7. Measured memory

Measured on Windows 11, Node `v24.11.0`, with the sample corpus of `samples/` (4 files, 11 passages) and the fake
provider. The number is `process.memoryUsage().rss`, at peak of the run:

| Run | Command | Time | RSS |
|---|---|---|---|
| Ingestion of the corpus | `npm run ingest -- samples/` | 32 ms | 107 MB |
| One search (Spanish question) | `npm run search -- "¿Cuánto cuesta una afinación de bicicleta?"` | 5 ms | 71 MB |
| One search (English question) | `npm run search -- "What is the cancellation policy?"` | 5 ms | 71 MB |
| One search (English question) | `npm run search -- "I lost the ticket of my repair, is the work still guaranteed?"` | 5 ms | 71 MB |

The base of the process is Node itself plus the libSQL client: the full 67 test suite of step 6 runs in about 10
seconds with the same client loaded. This is a small local corpus; the store grows with the documents of a business,
not with its traffic, and the search reads only the rows it needs.

With the OpenAI-compatible provider the memory is the same and the time is the network call of the embeddings API.
The suite measures that path against the local HTTP double instead of a real provider.

## 8. What quality to expect

The Community edition is deliberately lighter than the paid service: there is no reranker, no golden cases and no
measured evaluation. What that means in practice:

- A **keyword-only match always ranks**: a rare exact term pulls its passage into the results even when no other
  passage shares its meaning.
- A **meaning-only match ranks when the embeddings are good**: the sample corpus answers a paraphrase with the
  synthetic provider that ships for tests, but the real quality depends on the embeddings model of the installation.
  Bigger is usually better, and the paid service is better at this.
- A small or one-topic corpus answers well; a large corpus with many similar documents needs an embeddings model of
  real quality. Choosing it is part of the installation, not of this code.

## 9. Tests

| File | What it covers |
|---|---|
| `tests/spike/libsql-capabilities.test.ts` | the spike: native vectors and FTS5 on a local file |
| `tests/store.test.ts` | the schema, the replacement of a document, the keyword index in step with the passages |
| `tests/ingest.test.ts` | type detection by magic bytes, limits, a broken file, re-ingestion, the missing key |
| `tests/embeddings.test.ts` | the fake provider, the provider factory, the OpenAI-compatible path over an HTTP double |
| `tests/rrf.test.ts` | the fusion arithmetic on a fixed example, `k = 60` |
| `tests/search.test.ts` | hybrid search end to end, a keyword-only match, a meaning-only match, chunking |

Every test is hermetic: no network to a real provider, a temporary file per run, and the store file is deleted at the
end. There is no HTTP route yet; the command line plays the role that `curl` plays in other changes.
