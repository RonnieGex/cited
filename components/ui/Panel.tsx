import type { ComponentProps } from "react";

// `ComponentProps` carries `ref`, which a function component receives as a prop in React 19: a box that scrolls can be measured.
export type PanelProps = ComponentProps<"div">;

export function Panel({ className = "", ...rest }: PanelProps) {
  return (
    <div
      {...rest}
      className={`rounded-none border border-ink/10 bg-surface p-6 text-ink ${className}`}
    />
  );
}
