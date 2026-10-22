import type { EmbeddingEnvironment } from "./types.ts";

/** How many texts one request to the embeddings provider carries when `EMBEDDINGS_BATCH` says nothing usable. */
export const DEFAULT_EMBEDDINGS_BATCH = 32;

/**
 * The number of texts one request to the embeddings provider carries.
 *
 * Some OpenAI-compatible embeddings services accept fewer texts per request than the default (Text Embeddings
 * Inference accepts 16 texts and 4096 tokens), so the owner lowers it with `EMBEDDINGS_BATCH`. The value is read when
 * the texts are embedded, never cached at start, and a value that is not a positive integer (empty, `0`, negative,
 * fractional or non-numeric) keeps the default, like every other limit of the environment. Nothing is printed.
 */
export function resolveEmbeddingsBatch(environment: EmbeddingEnvironment = process.env): number {
  const declared = Number(environment["EMBEDDINGS_BATCH"]?.trim() ?? "");

  return Number.isInteger(declared) && declared > 0 ? declared : DEFAULT_EMBEDDINGS_BATCH;
}
