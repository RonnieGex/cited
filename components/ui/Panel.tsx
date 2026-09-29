import type { HTMLAttributes } from "react";

export type PanelProps = HTMLAttributes<HTMLDivElement>;

export function Panel({ className = "", ...rest }: PanelProps) {
  return (
    <div
      {...rest}
      className={`rounded-none border border-ink/10 bg-surface p-6 text-ink ${className}`}
    />
  );
}
