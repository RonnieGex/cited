import type { HTMLAttributes } from "react";

export type ChipProps = HTMLAttributes<HTMLSpanElement>;

export function Chip({ className = "", ...rest }: ChipProps) {
  return (
    <span
      {...rest}
      className={`inline-block rounded-none border border-ink/20 bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink ${className}`}
    />
  );
}
