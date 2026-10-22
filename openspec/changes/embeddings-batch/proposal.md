## Why

The ingestion and the re-index send the passage texts to the embeddings provider in requests of 32 texts, a number
written in two places of the code (`lib/ingest/index.ts` and `lib/settings/indexing.ts`). Some OpenAI-compatible
embeddings services accept fewer texts per request: the service of the Hermes installation of Katalis (Text
Embeddings Inference) accepts 16 texts and 4096 tokens per request, and in practice it worked with 4. With 32 the
ingestion fails for every document of more than 32 passages, and the owner has nothing to change but the code.

The fix first ran as a local patch on that installation on 2026-10-21; this change is its formal version.
This change makes it a formal one: a specification, a test and the documentation of the variable.

## What Changes

- A new optional variable, `EMBEDDINGS_BATCH`, is the number of texts one request to the embeddings provider
  carries. Without it the number is 32, as today.
- A value that is not a positive integer (empty, `0`, negative, fractional or non-numeric) keeps 32, like every other
  limit of the environment (`MAX_QUESTION_CHARS`, `RATE_LIMIT_PER_IP_PER_HOUR`).
- The variable is read when the texts are embedded, in the ingestion and in the re-index, so both paths obey it.
- `knowledge-search` gains a requirement with its scenarios; `README.md`, `README.es.md`, `.env.example` and
  `docs/search.md` document the variable.

Fable writes and implements this small fix as a recorded exception to the separation of roles, as it did for
`mcp-initialize-version-header`; the adversarial review belongs to an independent reviewer and is recorded in
`reports/` before the merge, which Franc performs.

## Impact

- `lib/embeddings/batch.ts` (new), `lib/ingest/index.ts`, `lib/settings/indexing.ts`.
- `tests/embeddings-batch.test.ts` (new).
- `openspec/specs/knowledge-search/spec.md` (on archive), `README.md`, `README.es.md`, `.env.example`, `docs/search.md`.
- No change to the providers, the vectors, the store or the search; a request of 32 texts stays the default.
