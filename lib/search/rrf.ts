export const DEFAULT_RRF_K = 60;

export type RankedEntry = {
  passageId: number;
  rank: number;
};

export type FusedEntry = {
  passageId: number;
  score: number;
  keywordRank: number | null;
  vectorRank: number | null;
};

export function reciprocalRankFusion(
  keyword: RankedEntry[],
  vector: RankedEntry[],
  k: number = DEFAULT_RRF_K,
): FusedEntry[] {
  const fused = new Map<number, FusedEntry>();

  const include = (entry: RankedEntry, position: "keywordRank" | "vectorRank"): void => {
    const found = fused.get(entry.passageId) ?? {
      passageId: entry.passageId,
      score: 0,
      keywordRank: null,
      vectorRank: null,
    };

    found.score += 1 / (k + entry.rank);
    found[position] = entry.rank;
    fused.set(entry.passageId, found);
  };

  for (const entry of keyword) {
    include(entry, "keywordRank");
  }

  for (const entry of vector) {
    include(entry, "vectorRank");
  }

  return [...fused.values()].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    const leftRank = left.keywordRank ?? Number.POSITIVE_INFINITY;
    const rightRank = right.keywordRank ?? Number.POSITIVE_INFINITY;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftVector = left.vectorRank ?? Number.POSITIVE_INFINITY;
    const rightVector = right.vectorRank ?? Number.POSITIVE_INFINITY;

    if (leftVector !== rightVector) {
      return leftVector - rightVector;
    }

    return left.passageId - right.passageId;
  });
}
