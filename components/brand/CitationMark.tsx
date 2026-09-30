import { focusRing } from "@/components/ui/focus";

// Decision 3 of `openspec/changes/brand-identity-ui/design.md`: the citation mark, a lime square with the number of a
// source. It numbers the sources of an answer and, later, the places of the panel and the steps of the setup lane.
//
// The measures are in `em` of the mark itself, and the mark sets its own size at 0.72em of the text around it, so the
// same mark sits in a sentence at 18 px, in the wordmark at 20 to 56 px and in the navigation of the panel.

export type CitationMarkState = "rest" | "open";
export type CitationMarkTone = "paper" | "ink";

const look = {
  paper: {
    rest: "bg-lime text-ink",
    open: "bg-ink text-lime",
  },
  // On a ground of ink (the navigation of the panel): the rest mark is a quiet outline with paper text (6.8:1 over ink,
  // the numeral is text), and the open mark is ink with a lime number inside a lime outline so it does not vanish.
  ink: {
    rest: "bg-transparent text-paper/60 ring-1 ring-inset ring-paper/30",
    open: "bg-ink text-lime ring-1 ring-inset ring-lime",
  },
} as const;

const shape =
  "inline-grid h-[1.3em] min-w-[1.5em] place-items-center rounded-none px-[0.3em] align-[0.1em] text-[0.72em] font-bold leading-none tabular-nums";

/**
 * The class of a citation mark that is a button (the markers inside an answer, the sources list): the same square as
 * the static span, plus the focus ring of the kit and, on the public page, the color of the business on hover. Only
 * the pages that declare `--primary` and `--on-primary` (the public page and the embed) use it as a button.
 */
export function citationMarkClass(state: CitationMarkState = "rest"): string {
  // The hover paints only a mark at rest: an open mark stays ink with its lime number while the pointer is still on it
  // after the click, so the reader keeps seeing which passage is open.
  const hover = state === "rest" ? "hover:bg-[var(--primary)] hover:text-[var(--on-primary)]" : "";

  return `${shape} ${look.paper[state]} cursor-pointer transition-colors duration-[var(--dur-fast)] ${hover} ${focusRing}`;
}

export type CitationMarkProps = {
  n?: number | string;
  /** `open` paints the mark ink with a lime number: the source that is open, the place of the panel that is current. */
  state?: CitationMarkState;
  /** `ink` is the look for a ground of ink; `paper` (the default) is the look everywhere else. */
  tone?: CitationMarkTone;
  className?: string;
};

/** The static mark: a span that looks exactly like the button of `citationMarkClass`. */
export function CitationMark({ n = 1, state = "rest", tone = "paper", className = "" }: CitationMarkProps) {
  return (
    <span data-brand="citation-mark" className={`${shape} ${look[tone][state]} ${className}`}>
      {n}
    </span>
  );
}
