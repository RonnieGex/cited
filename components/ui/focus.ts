/**
 * The focus of the kit (design decision 6 of `openspec/changes/brand-and-design-system/design.md`, amended by decision 33
 * of `openspec/changes/brand-identity-ui/design.md`): a 2 px outline with offset, on the keyboard only.
 *
 * On paper and on surface the outline is ink (17.93:1) with a 2 px lime ring between it and the control. Lime alone is
 * 1.07:1 on paper, so the old lime outline left one pixel of ink ring to carry the focus and, on an open citation mark
 * (an ink square), no visible change at all; now the outer edge is ink and the lime ring is what shows against an ink
 * control (14.70:1).
 */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:ring-2 focus-visible:ring-lime";

/** The focus of a control on ink (the column of the panel, the ghost button): the lime outline, 14.70:1 over ink. */
export const focusRingOnInk = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime";

/**
 * The focus of a control on the band of the business: the color of its text, which the page already checks against the
 * band for 4.5:1, so the outline reads over whatever color the business chose.
 */
export const focusRingOnBrand = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";
