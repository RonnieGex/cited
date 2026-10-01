import type { ReactNode } from "react";
import { Highlight } from "@/components/brand";

// Decisions 1, 3, 4 and 5 of `openspec/changes/passage-display-polish/design.md`: one view of a passage, used by the
// public page, the widget, Try it and the document page. The heading is shown once, above the passage and never at the
// start of its text; a list is a list, one item per line; the words the chunker repeated from the passage before it are
// shown in the muted colour, outside the highlighter; and the highlighter is an inline span inside its paragraph or its
// item, so it paints under each line.

const listItem = /^([-*]|\d+\.)\s+/;
const orderedItem = /^\d+\.\s+/;
const itemStart = /(?=\s[-*]\s+\S)|(?=\s\d+\.\s+\S)/g;

/**
 * The text of a passage without its heading at the start, when the text starts with the heading followed by
 * whitespace. The stored text keeps the heading (`chunk.ts`), the embeddings and the keyword index read that text, and
 * every view renders this body instead.
 */
export function passageBody(text: string, heading: string | null | undefined): string {
  if (heading === null || heading === undefined || heading.length === 0) {
    return text;
  }

  if (text === heading) {
    return text;
  }

  return text.startsWith(`${heading} `) || text.startsWith(`${heading}\n`)
    ? text.slice(heading.length + 1).trimStart()
    : text;
}

export { leadLength } from "@/lib/answer/lead";

type Line =
  | { kind: "text"; text: string }
  | { kind: "item"; text: string; ordered: boolean };

/**
 * The lines of the body, without the empty ones. A passage stored before this change holds its list flattened into one
 * paragraph joined with a space, so the start of every item is a line of its own here as well: the view shows a list
 * the old passages carry too.
 */
function lines(body: string): Line[] {
  return body
    .split(itemStart)
    .flatMap((part) => part.split("\n"))
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line): Line =>
      listItem.test(line)
        ? { kind: "item", text: line.replace(listItem, "").trimEnd(), ordered: orderedItem.test(line) }
        : { kind: "text", text: line },
    );
}

/**
 * The lead of a body with line breaks is the lead of its first line: the chunker cuts the overlap at the start of the
 * text, so the repeated words never run into the second line. A lead that would cross a line break is not drawn as
 * context at all, because the words of the line it would enter are its own.
 */
function leadOfBody(body: string, lead: number): number {
  const [first = ""] = body.split("\n");

  return lead > 0 && lead <= first.length ? lead : 0;
}

export type PassageBodyProps = {
  text: string;
  heading?: string | null;
  /**
   * `false` when the place that shows the passage already shows its heading (a section of the document page or of
   * `Try it`): the heading is still removed from the start of the text and is not painted again.
   */
  showHeading?: boolean;
  /** The heading and the lines take the colour and the size of the place that shows the passage. */
  className?: string;
  /** The passage of a citation: it paints the highlighter from the first word after the lead. */
  highlighted?: boolean;
  /** The characters at the start of the body that repeat the passage before it, outside the highlighter. */
  lead?: number;
};

export function PassageBody({
  text,
  heading = null,
  showHeading = true,
  className = "text-ink",
  highlighted = false,
  lead = 0,
}: PassageBodyProps) {
  const body = passageBody(text, heading);
  const shown = leadOfBody(body, lead);
  const drawn = lines(body);
  const paint = (value: string, withLead: boolean): ReactNode => {
    const muted = withLead ? value.slice(0, shown) : "";
    const own = withLead ? value.slice(shown) : value;

    return (
      <>
        {muted.length === 0 ? null : (
          <span className="text-ink-2" data-passage="lead">
            {muted}
          </span>
        )}
        {highlighted ? <Highlight sweep>{own}</Highlight> : own}
      </>
    );
  };

  return (
    <>
      {showHeading === false || heading === null || heading.length === 0 ? null : (
        <p className={`font-semibold ${className}`} data-passage="heading">
          {heading}
        </p>
      )}
      <LinesBody className={className} drawn={drawn} paint={paint} />
    </>
  );
}

/** The lines as paragraphs and lists: consecutive items become one list with one item per line. */
function LinesBody({
  drawn,
  paint,
  className,
}: {
  drawn: Line[];
  paint: (value: string, withLead: boolean) => ReactNode;
  className: string;
}) {
  const content: ReactNode[] = [];
  let items: string[] = [];
  let ordered = false;
  let carriesLead = true;

  const closeList = (): void => {
    if (items.length === 0) {
      return;
    }

    const entries = items.map((item, index) => (
      <li data-passage="item" key={`item-${index}`}>
        {paint(item, false)}
      </li>
    ));

    content.push(
      ordered ? (
        <ol className={className} key={`list-${content.length}`}>
          {entries}
        </ol>
      ) : (
        <ul className={className} key={`list-${content.length}`}>
          {entries}
        </ul>
      ),
    );

    items = [];
  };

  drawn.forEach((line, index) => {
    const lead = carriesLead;

    carriesLead = false;

    if (line.kind === "item") {
      if (items.length > 0 && ordered !== line.ordered) {
        closeList();
      }

      ordered = line.ordered;
      items.push(line.text);

      // The first line of the body opens the list with the lead of the passage in its own item, and the items that
      // follow it are the rest of that same list.
      if (lead) {
        content.push(
          <ul className={className} data-passage="list-open" key={`lead-${index}`}>
            <li data-passage="item">{paint(line.text, true)}</li>
          </ul>,
        );
        items = [];
      }

      return;
    }

    closeList();
    content.push(
      <p className={className} data-passage="paragraph" key={`text-${index}`}>
        {paint(line.text, lead)}
      </p>,
    );
  });

  closeList();

  return <>{content}</>;
}
