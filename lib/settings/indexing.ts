import type { EmbeddingProvider } from "../embeddings/types.ts";
import type { SourceType } from "../ingest/types.ts";
import type { Store } from "../store/index.ts";

// Decision 5 of `openspec/changes/provider-keys-in-panel/design.md`: changing the embeddings provider, the model or the
// mode marks every passage for re-indexing until the owner re-indexes. The documents are not stored, the passages are,
// so a re-index re-embeds the passages that are already in the store and writes the signature of the provider that made
// the vectors. In keyword mode it writes the signature and stores no vector.

const embeddingBatch = 32;

export type ReindexReport = { documents: number; passages: number };

async function embedAll(provider: EmbeddingProvider, texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];

  for (let index = 0; index < texts.length; index += embeddingBatch) {
    vectors.push(...(await provider.embed(texts.slice(index, index + embeddingBatch))));
  }

  return vectors;
}

export async function reindexDocument(
  store: Store,
  embeddings: EmbeddingProvider | null,
  signature: string,
  name: string,
): Promise<number> {
  const document = await store.findDocument(name);

  if (document === null) {
    return 0;
  }

  const passages = await store.getPassages({ name: document.name, limit: 10_000 });
  const vectors = embeddings === null ? [] : await embedAll(embeddings, passages.map((one) => one.text));

  await store.replaceDocument(
    {
      name: document.name,
      sha256: document.sha256,
      type: document.type as SourceType,
      pages: document.pages,
    },
    passages.map((passage, at) => ({
      position: passage.position,
      heading: passage.heading,
      text: passage.text,
      embedding: vectors[at] ?? [],
    })),
  );
  await store.saveIndexSignature(document.name, signature);

  return passages.length;
}

export async function reindexStore(
  store: Store,
  embeddings: EmbeddingProvider | null,
  signature: string,
): Promise<ReindexReport> {
  const documents = await store.listDocuments();
  let passages = 0;

  for (const document of documents) {
    passages += await reindexDocument(store, embeddings, signature, document.name);
  }

  return { documents: documents.length, passages };
}
