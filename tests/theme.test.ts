import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRIMARY,
  INK,
  LIME,
  PAPER,
  contrastRatio,
  readablePrimary,
  textOn,
} from "@/lib/theme/primary";

// Decision 3 of `openspec/changes/public-page-and-widget/design.md`: the primary color of the business becomes a CSS
// variable checked for contrast against the ink and the paper, and a color that fails AA falls back to lime.
//
// The reading of the decision, taken here because the story leaves it open and written in the delivery: the primary
// color is a fill that carries text, so what has to reach AA (4.5:1) is the better of its two contrasts, the one
// against the ink and the one against the paper. The kit pairs the fill with whichever of the two tokens is legible on
// it (`textOn`), and lime is the proof that the reading is the only one that fits: lime against the ink is 14.9:1 and
// against the paper 1.2:1, so a rule that asked for both would refuse the very color the decision keeps as fallback.

describe("the contrast fallback of the primary color", () => {
  it("uses the tokens of the system", () => {
    expect(INK).toBe("#171717");
    expect(PAPER).toBe("#ffffff");
    expect(LIME).toBe("#ddf469");
    expect(DEFAULT_PRIMARY).toBe(LIME);
  });

  it("measures the extremes of the system", () => {
    // The ink of the system is not pure black, so its ratio against the paper is 17.93:1 and not the 21:1 of the
    // theoretical pair; the pair of the extremes is measured too, to pin the formula.
    expect(contrastRatio(INK, PAPER)).toBeCloseTo(17.93, 1);
    expect(contrastRatio(PAPER, INK)).toBeCloseTo(17.93, 1);
    expect(contrastRatio("#000000", PAPER)).toBeCloseTo(21, 1);
    expect(contrastRatio(LIME, INK)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps lime, and keeps it by default", () => {
    expect(readablePrimary(LIME)).toBe(LIME);
    expect(readablePrimary("#DDF469")).toBe(LIME);
    expect(readablePrimary(" #DDF469 ")).toBe(LIME);
    expect(readablePrimary("#df4")).toBe("#ddff44");
    expect(readablePrimary(null)).toBe(LIME);
    expect(readablePrimary(undefined)).toBe(LIME);
    expect(readablePrimary("")).toBe(LIME);
    expect(readablePrimary("lime")).toBe(LIME);
    expect(readablePrimary("#12345")).toBe(LIME);
    expect(readablePrimary("rgb(221, 244, 105)")).toBe(LIME);
  });

  it("falls back to lime when the color fails AA against the ink and the paper", () => {
    // The band of the colors that fail both is narrow: it runs from the luminance where the paper stops reaching 4.5
    // to the one where the ink starts reaching it, and `#7c7c7c` sits inside it (4.30:1 against the ink, 4.17:1
    // against the paper).
    const doubtful = "#7c7c7c";

    expect(contrastRatio(doubtful, INK)).toBeLessThan(4.5);
    expect(contrastRatio(doubtful, PAPER)).toBeLessThan(4.5);
    expect(readablePrimary(doubtful)).toBe(LIME);
  });

  it("keeps a dark primary and pairs it with the paper", () => {
    const navy = "#1d4ed8";

    expect(readablePrimary(navy)).toBe(navy);
    expect(contrastRatio(navy, PAPER)).toBeGreaterThanOrEqual(4.5);
    expect(textOn(navy)).toBe(PAPER);
  });

  it("keeps a light primary and pairs it with the ink", () => {
    expect(textOn(LIME)).toBe(INK);
    expect(textOn("#ffffff")).toBe(INK);
    expect(textOn("#000000")).toBe(PAPER);
    expect(textOn("not a color")).toBe(INK);
  });

  it("expands the short form of a hex color", () => {
    expect(readablePrimary("#fff")).toBe("#ffffff");
    expect(readablePrimary("#abc")).toBe("#aabbcc");
  });
});
