import { focusRing } from "@/components/ui/focus";
import { CitationMark } from "./CitationMark";

// Decision 2 of `openspec/changes/brand-identity-ui/design.md`: the word `Cited` in Outfit 800 followed by a lime
// citation mark that says 1. It is the only logo of the product besides the real flame of Katalis, and it is never a
// heading: the `h1` of a page stays its own.

const sizes = {
  sm: "text-[20px]",
  md: "text-[36px]",
  lg: "text-[56px]",
} as const;

// The tone names the ground: `paper` is for a light ground (ink text), `ink` for a dark one (paper text). The mark is
// lime in both.
const tones = {
  paper: "text-ink",
  ink: "text-paper",
} as const;

export type WordmarkProps = {
  size?: keyof typeof sizes;
  tone?: keyof typeof tones;
  href?: string;
  className?: string;
};

export function Wordmark({ size = "md", tone = "paper", href, className = "" }: WordmarkProps) {
  const classes = `inline-flex items-baseline gap-[0.12em] rounded-none font-extrabold leading-none tracking-[-0.04em] no-underline ${sizes[size]} ${tones[tone]} ${className}`;
  const content = (
    <>
      Cited
      <span aria-hidden="true" className="contents">
        <CitationMark n={1} />
      </span>
    </>
  );

  if (href === undefined) {
    return (
      <span data-brand="wordmark" className={classes}>
        {content}
      </span>
    );
  }

  return (
    <a data-brand="wordmark" href={href} className={`${classes} ${focusRing}`}>
      {content}
    </a>
  );
}
