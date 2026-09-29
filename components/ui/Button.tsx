import type { ButtonHTMLAttributes } from "react";
import { focusRing } from "./focus";

const base =
  "inline-flex items-center justify-center gap-2 rounded-none px-7 py-3 text-sm font-bold uppercase tracking-[0.05em] transition-colors duration-[400ms] ease-out-expo disabled:opacity-40";

const variants = {
  primary: "bg-ink text-paper hover:bg-surface-dark",
  secondary: "border border-border bg-paper text-ink hover:bg-surface",
} as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={`${base} ${variants[variant]} ${focusRing} ${className}`}
    />
  );
}
