## Why

Katalis Responde Community answers a business's questions from the business's own documents. Before any chat, voice or
page exists, the product needs its core: take the owner's documents, split them into passages, index them, and return
the passages that answer a question. This is change 2 of the approved plan (`tasks/plan-rag-abierto.md`).

The plan chose libSQL so one code path serves a local SQLite file (Docker, a laptop) and Turso (Vercel deploys). Two
capabilities in the local embedded engine are **not verified**: native vectors and FTS5. This change proves them first
and falls back if they fail.

## What Changes

- **Spike first.** A throwaway test proves native vectors (`F32_BLOB` and a vector search) and FTS5 on a local libSQL
  file through the chosen Node client.
  - If either fails, the fallback is `better-sqlite3` with `sqlite-vec` for local use, and Turso is documented as not
    supported in this change.
  - The spike's result decides the store and is written in `design.md` before any other code.
- **Ingestion.**
  - Reads PDF, DOCX, Markdown and plain text from a folder or from uploaded files.
  - Validates each file by its real type (magic bytes), size (20 MB) and page count (500).
  - Splits the text into passages with overlap and keeps each passage's document, position and heading.
  - A file that cannot be parsed is reported and skipped, never half-ingested.
- **Embeddings behind an interface.**
  - Two providers: any OpenAI-compatible embeddings API, and Ollama.
  - Configured only by environment variables.
  - Tests use a deterministic fake provider and never call the network.
- **Hybrid search.** FTS5 keyword ranking and vector similarity, fused with Reciprocal Rank Fusion (`k = 60`), returning
  the top passages with their document, heading and score.
- **A CLI**: `npm run ingest -- <folder>` and `npm run search -- "<question>"`, for owners and for the tests.
- **Measured RAM.** Resident memory of ingesting and searching a sample corpus of our own (not the Construye book), in
  API-embeddings mode, reported in the docs.

## Impact

- New:
  - `lib/store/`, `lib/ingest/`, `lib/embeddings/`, `lib/search/`;
  - `scripts/ingest.ts` and `scripts/search.ts`;
  - `tests/` for each module;
  - `samples/` with small documents written for this repository;
  - `docs/search.md`.
- Changed: `package.json` (dependencies and scripts), `.env.example` (the embeddings variables).
- No UI, no LLM answer and no ElevenLabs in this change. Those are changes 3 to 5.
