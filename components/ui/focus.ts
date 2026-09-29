/**
 * The focus of the kit (design decision 6 of `openspec/changes/brand-and-design-system/design.md`): a 2 px lime
 * outline with offset, on the keyboard only.
 *
 * Lime on paper is 1.07:1, so the outline also carries a one pixel edge of ink. The outline is the one the design
 * asks for and the focus stays visible on the ink of an inverted control and on the paper of the rest.
 */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime focus-visible:ring-1 focus-visible:ring-ink";
