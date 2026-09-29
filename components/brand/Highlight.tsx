import type { ReactNode } from "react";
import { highlightLast } from "@/lib/brand/highlight";

// Decision 4 of `openspec/changes/brand-identity-ui/design.md`: the highlighter is lime painted behind the words that
// matter (the `.hl` class of `app/brand.css`). `sweep` makes it paint itself in once when it appears.

export type HighlightProps = {
  sweep?: boolean;
  className?: string;
  children: ReactNode;
};

export function Highlight({ sweep = false, className = "", children }: HighlightProps) {
  return <span className={`hl${sweep ? " hl-sweep" : ""}${className === "" ? "" : ` ${className}`}`}>{children}</span>;
}

export type HighlightedTailProps = {
  text: string;
  words?: number;
  sweep?: boolean;
};

/** A headline or a tagline with the highlighter on its last words (`highlightLast`). */
export function HighlightedTail({ text, words, sweep = false }: HighlightedTailProps) {
  const { lead, tail } = highlightLast(text, words);

  return (
    <>
      {lead}
      {tail === "" ? null : <Highlight sweep={sweep}>{tail}</Highlight>}
    </>
  );
}
