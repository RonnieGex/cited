import type { EmbeddingProvider } from "../embeddings/types.ts";
import type { Store } from "../store/index.ts";
import { DEFAULT_RRF_K, reciprocalRankFusion } from "./rrf.ts";

export const DEFAULT_CANDIDATES = 50;
export const DEFAULT_RESULTS = 8;

export type SearchHit = {
  passageId: number;
  name: string;
  heading: string | null;
  position: number;
  text: string;
  score: number;
};

export type SearchOptions = {
  store: Store;
  embeddings: EmbeddingProvider;
  limit?: number;
  candidates?: number;
  k?: number;
};

export async function hybridSearch(question: string, options: SearchOptions): Promise<SearchHit[]> {
  const candidates = options.candidates ?? DEFAULT_CANDIDATES;
  const limit = options.limit ?? DEFAULT_RESULTS;
  const k = options.k ?? DEFAULT_RRF_K;
  const embedding = await options.embeddings.embedQuery(question);
  const keyword = await options.store.keywordSearch(question, candidates);
  const vector = await options.store.vectorSearch(embedding, candidates);
  const fused = reciprocalRankFusion(keyword, vector, k).slice(0, limit);

  if (fused.length === 0) {
    return [];
  }

  const passages = await options.store.getPassagesByIds(fused.map((entry) => entry.passageId));

  return fused.flatMap((entry) => {
    const passage = passages.get(entry.passageId);

    if (passage === undefined) {
      return [];
    }

    return [
      {
        passageId: entry.passageId,
        name: passage.name,
        heading: passage.heading,
        position: passage.position,
        text: passage.text,
        score: entry.score,
      },
    ];
  });
}
