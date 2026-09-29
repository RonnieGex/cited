import { describe, expect, it } from "vitest";
import { DEFAULT_RRF_K, reciprocalRankFusion } from "@/lib/search/rrf";

describe("reciprocal rank fusion", () => {
  it("uses k = 60", () => {
    expect(DEFAULT_RRF_K).toBe(60);
  });

  it("scores a passage that only the keyword list ranks", () => {
    const fused = reciprocalRankFusion([{ passageId: 7, rank: 1 }], [], DEFAULT_RRF_K);

    expect(fused).toHaveLength(1);
    expect(fused[0]?.passageId).toBe(7);
    expect(fused[0]?.score).toBeCloseTo(1 / 61, 12);
    expect(fused[0]?.keywordRank).toBe(1);
    expect(fused[0]?.vectorRank).toBeNull();
  });

  it("scores a passage that only the vector list ranks", () => {
    const fused = reciprocalRankFusion([], [{ passageId: 9, rank: 2 }], DEFAULT_RRF_K);

    expect(fused).toHaveLength(1);
    expect(fused[0]?.passageId).toBe(9);
    expect(fused[0]?.score).toBeCloseTo(1 / 62, 12);
    expect(fused[0]?.keywordRank).toBeNull();
    expect(fused[0]?.vectorRank).toBe(2);
  });

  it("adds both contributions on a fixed example", () => {
    const fused = reciprocalRankFusion(
      [
        { passageId: 3, rank: 1 },
        { passageId: 1, rank: 2 },
      ],
      [
        { passageId: 3, rank: 2 },
        { passageId: 2, rank: 1 },
      ],
      DEFAULT_RRF_K,
    );

    expect(fused.map((entry) => entry.passageId)).toEqual([3, 2, 1]);
    expect(fused[0]?.score).toBeCloseTo(1 / 61 + 1 / 62, 12);

    const second = fused[1]?.score ?? 0;
    const third = fused[2]?.score ?? 0;

    expect(second).toBeCloseTo(1 / 61, 12);
    expect(third).toBeCloseTo(1 / 62, 12);
    expect(second).toBeGreaterThan(third);
  });

  it("keeps one entry per passage when both lists rank it", () => {
    const fused = reciprocalRankFusion(
      [{ passageId: 5, rank: 1 }],
      [{ passageId: 5, rank: 1 }],
      DEFAULT_RRF_K,
    );

    expect(fused).toHaveLength(1);
    expect(fused[0]?.score).toBeCloseTo(2 / 61, 12);
  });

  it("breaks a tie by the better keyword rank and then by the identifier", () => {
    const fused = reciprocalRankFusion(
      [
        { passageId: 4, rank: 1 },
        { passageId: 8, rank: 3 },
      ],
      [
        { passageId: 8, rank: 1 },
        { passageId: 4, rank: 3 },
      ],
      DEFAULT_RRF_K,
    );

    expect(fused.map((entry) => entry.passageId)).toEqual([4, 8]);
    expect(fused[0]?.score).toBeCloseTo(fused[1]?.score ?? 0, 12);
  });
});
