import type { ButtonHTMLAttributes } from "react";
import { focusRing, focusRingOnInk } from "./focus";

const base =
  "inline-flex items-center justify-center gap-2 rounded-none text-sm font-bold uppercase tracking-[0.05em] transition-colors duration-[400ms] ease-out-expo disabled:opacity-40";

// The sizes: `sm` is for the controls that sit inside a band or beside a line of text (the sign-out of the panel, the
// close of a citation); on a phone it keeps the 44 px of height of every control.
const sizes = {
  md: "px-7 py-3",
  sm: "px-4 py-2 max-lg:min-h-11",
} as const;

const variants = {
  primary: "bg-ink text-paper hover:bg-surface-dark",
  secondary: "border border-border bg-paper text-ink hover:bg-surface",
  // The fill of the business: the two variables the public page and `/embed` declare from the settings, with the text
  // token that is legible over that fill (`lib/theme/primary.ts`). Decision 3 of
  // `openspec/changes/public-page-and-widget/design.md` and the requirement "The brand color is seen and the widget
  // closes from inside": the variable has to paint an element, not only be declared.
  brand: "bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90",
  // For controls on ink (decision 6 of `openspec/changes/brand-identity-ui/design.md`): transparent, a paper hairline and
  // paper text.
  ghost: "border border-paper/40 bg-transparent text-paper hover:bg-paper/10",
} as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  ...rest
}: ButtonProps) {
  return <button {...rest} type={type} className={`${buttonClass(variant, size)} ${className}`} />;
}

// The same classes for a control that is a link and not a button: the sample business of the guided setup is the door
// back to step 1 while the search is not chosen (decision 24 of `guided-setup-and-knowledge`), and it has to read as the
// button it replaces. One source for the style, no override at the point of use.
export function buttonClass(variant: keyof typeof variants = "primary", size: keyof typeof sizes = "md"): string {
  return `${base} ${sizes[size]} ${variants[variant]} ${variant === "ghost" ? focusRingOnInk : focusRing}`;
}
