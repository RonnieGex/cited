import type { InputHTMLAttributes } from "react";
import { focusRing } from "./focus";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...rest }: InputProps) {
  return (
    <input
      {...rest}
      className={`w-full rounded-none border border-border bg-paper px-5 py-4 text-ink placeholder:text-ink/60 ${focusRing} ${className}`}
    />
  );
}
