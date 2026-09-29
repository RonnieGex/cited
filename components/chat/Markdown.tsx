import { Fragment, type CSSProperties, type ReactNode } from "react";
import { citationMarkClass } from "@/components/brand";
import { parseMarkdown, type BlockNode, type InlineNode } from "@/lib/markdown/parse";

// Design decision 2 of `openspec/changes/public-page-and-widget/design.md`: the answer is painted from the allowlisted
// tree of `lib/markdown/parse.ts`, never from HTML. A `[n]` marker is a button when the answer carries citations, and
// the chip opens the excerpt, the document and the heading. Decisions 3 and 10 of
// `openspec/changes/brand-identity-ui/design.md`: the marker is a lime citation mark with the number of the source; when
// the answer has just arrived (`landing`) each mark lands in turn, staggered by its position through `--i`.

export type MarkdownProps = {
  text: string;
  citationLabel?: (n: number) => string;
  onCitation?: (n: number) => void;
  openCitation?: number | null;
  citationPanelId?: string;
  /** The answer arrived a moment ago: its marks land, one after the other. Off for the answers already read. */
  landing?: boolean;
};

type RenderOptions = {
  citationLabel?: (n: number) => string;
  onCitation?: (n: number) => void;
  openCitation?: number | null;
  citationPanelId?: string;
  landing: boolean;
  /** The marks painted so far, so that `--i` counts across paragraphs and lists. */
  marks: { painted: number };
};

function renderInline(nodes: InlineNode[], options: RenderOptions): ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === "text") {
      return <Fragment key={index}>{node.value}</Fragment>;
    }

    if (node.type === "strong") {
      return (
        <strong key={index} className="font-bold">
          {renderInline(node.children, options)}
        </strong>
      );
    }

    if (node.type === "emphasis") {
      return <em key={index}>{renderInline(node.children, options)}</em>;
    }

    if (node.type === "code") {
      return (
        <code key={index} className="bg-surface px-1 font-mono text-[0.9em]">
          {node.value}
        </code>
      );
    }

    if (node.type === "link") {
      return (
        <a
          key={index}
          href={node.href}
          target="_blank"
          rel="noreferrer noopener"
          className="text-ink underline"
        >
          {renderInline(node.children, options)}
        </a>
      );
    }

    if (options.onCitation === undefined) {
      return <Fragment key={index}>{`[${node.n}]`}</Fragment>;
    }

    const stagger = options.marks.painted;

    options.marks.painted += 1;

    return (
      <button
        key={index}
        type="button"
        aria-label={options.citationLabel?.(node.n)}
        aria-expanded={options.openCitation === node.n}
        aria-controls={
          options.openCitation === node.n ? options.citationPanelId : undefined
        }
        onClick={() => {
          options.onCitation?.(node.n);
        }}
        style={{ "--i": stagger } as CSSProperties}
        className={`mx-1 ${citationMarkClass(options.openCitation === node.n ? "open" : "rest")}${
          options.landing ? " mark-land" : ""
        }`}
      >
        {node.n}
      </button>
    );
  });
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
