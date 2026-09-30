import { Fragment, type CSSProperties, type ReactNode } from "react";
import { citationMarkClass } from "@/components/brand";
import { parseMarkdown, type BlockNode, type InlineNode } from "@/lib/markdown/parse";

// Design decision 2 of `openspec/changes/public-page-and-widget/design.md`: the answer is painted from the allowlisted
// tree of `lib/markdown/parse.ts`, never from HTML. A `[n]` marker is a button when the answer carries citations, and
// the chip opens the excerpt, the document and the heading. Decisions 3 and 10 of
// `openspec/changes/brand-identity-ui/design.md`: the marker is a lime citation mark with the number of the source; when
// the answer has just arrived (`landing`) each mark lands in turn, staggered by its position through `--i`. Round 14c:
// a mark sits against its word (decision 25) and only the first two marks of an answer move (decision 5).

export type MarkdownProps = {
  text: string;
  citationLabel?: (n: number) => string;
  /** The mark of `n` was pressed; `opener` is that button, so the chat can give it the focus back on close. */
  onCitation?: (n: number, opener: HTMLElement) => void;
  openCitation?: number | null;
  citationPanelId?: string;
  /** The answer arrived a moment ago: its marks land, one after the other. Off for the answers already read. */
  landing?: boolean;
};

type RenderOptions = {
  citationLabel?: (n: number) => string;
  onCitation?: (n: number, opener: HTMLElement) => void;
  openCitation?: number | null;
  citationPanelId?: string;
  landing: boolean;
  /** The marks painted so far, so that `--i` counts across paragraphs and lists. */
  marks: { painted: number };
};

type CitationNode = Extract<InlineNode, { type: "citation" }>;

/** The most marks of an answer that move on arrival: the design lets two things move at once (decision 5). */
const LANDING_MARKS = 2;

function citationButton(node: CitationNode, key: string, options: RenderOptions): ReactNode {
  const stagger = options.marks.painted;

  options.marks.painted += 1;

  return (
    <button
      key={key}
      type="button"
      aria-label={options.citationLabel?.(node.n)}
      aria-expanded={options.openCitation === node.n}
      aria-controls={options.openCitation === node.n ? options.citationPanelId : undefined}
      onClick={(event) => {
        options.onCitation?.(node.n, event.currentTarget);
      }}
      style={{ "--i": stagger } as CSSProperties}
      className={`ms-[0.15em] ${citationMarkClass(options.openCitation === node.n ? "open" : "rest")}${
        options.landing && stagger < LANDING_MARKS ? " mark-land" : ""
      }`}
    >
      {node.n}
    </button>
  );
}

function renderInline(nodes: InlineNode[], options: RenderOptions): ReactNode[] {
  const out: ReactNode[] = [];
  // A copy: the text after a run of marks gives its first characters (the punctuation) to the unit of the marks.
  const rest = [...nodes];

  for (let at = 0; at < rest.length; at += 1) {
    const node = rest[at] as InlineNode;
    const key = String(at);

    if (node.type === "text" || node.type === "citation") {
      // Decision 25: a mark sits against its word. The space before it is dropped, and the last word, the marks and the
      // punctuation that follows are one unit that never breaks, so a mark never starts a line alone.
      const marked =
        options.onCitation !== undefined &&
        (node.type === "citation" || rest[at + 1]?.type === "citation");

      if (marked) {
        let head = "";
        let word = "";
        let first = at;

        if (node.type === "text") {
          const split = /^([\s\S]*?)(\S+)\s*$/.exec(node.value);

          head = split === null ? "" : (split[1] ?? "");
          word = split === null ? "" : (split[2] ?? "");
          first = at + 1;
        }

        const marks: ReactNode[] = [];
        let next = first;

        while (rest[next]?.type === "citation") {
          marks.push(citationButton(rest[next] as CitationNode, `${key}-${next}`, options));
          next += 1;
        }

        let tail = "";
        const following = rest[next];

        if (following?.type === "text") {
          const parts = /^(\S*)([\s\S]*)$/.exec(following.value);

          tail = parts?.[1] ?? "";
          rest[next] = { type: "text", value: parts?.[2] ?? "" };
        }

        if (head.length > 0) {
          out.push(<Fragment key={`${key}-head`}>{head}</Fragment>);
        }

        out.push(
          <span key={`${key}-unit`} className="whitespace-nowrap">
            {word}
            {marks}
            {tail}
          </span>,
        );

        at = next - 1;
        continue;
      }

      out.push(
        <Fragment key={key}>{node.type === "text" ? node.value : `[${node.n}]`}</Fragment>,
      );
      continue;
    }

    if (node.type === "strong") {
      out.push(
        <strong key={key} className="font-bold">
          {renderInline(node.children, options)}
        </strong>,
      );
      continue;
    }

    if (node.type === "emphasis") {
      out.push(<em key={key}>{renderInline(node.children, options)}</em>);
      continue;
    }

    if (node.type === "code") {
      out.push(
        <code key={key} className="bg-surface px-1 font-mono text-[0.9em]">
          {node.value}
        </code>,
      );
      continue;
    }

    out.push(
      <a
        key={key}
        href={node.href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-ink underline"
      >
        {renderInline(node.children, options)}
      </a>,
    );
  }

  return out;
}

function renderBlocks(blocks: BlockNode[], options: RenderOptions): ReactNode[] {
  return blocks.map((block, index) => {
    if (block.type === "codeBlock") {
      return (
        <pre
          key={index}
          className="overflow-x-auto border border-ink/10 bg-surface p-4 font-mono text-sm text-ink"
        >
          <code>{block.value}</code>
        </pre>
      );
    }

    if (block.type === "list") {
      const List = block.ordered ? "ol" : "ul";

      return (
        <List key={index} className={block.ordered ? "list-decimal pl-5" : "list-disc pl-5"}>
          {block.items.map((item, at) => (
            <li key={at}>{renderInline(item, options)}</li>
          ))}
        </List>
      );
    }

    return (
      <p key={index}>
        {renderInline(block.children, options)}
      </p>
    );
  });
}

export function Markdown({
  text,
  citationLabel,
  onCitation,
  openCitation,
  citationPanelId,
  landing = false,
}: MarkdownProps) {
  return (
    <div className="flex max-w-[65ch] flex-col gap-3 text-[18px] leading-[1.6] text-ink">
      {renderBlocks(parseMarkdown(text), {
        citationLabel,
        onCitation,
        openCitation,
        citationPanelId,
        landing,
        marks: { painted: 0 },
      })}
    </div>
  );
}
