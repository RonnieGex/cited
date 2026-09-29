import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Markdown } from "@/components/chat/Markdown";
import { parseMarkdown, safeUrl, type BlockNode, type InlineNode } from "@/lib/markdown/parse";

// Decision 2 of `openspec/changes/public-page-and-widget/design.md`: a small allowlist renderer for the answer. The
// answer comes from a model that read the documents of the business, so it is untrusted text: raw HTML is never
// parsed, links are limited to `http` and `https`, and no script, style or event attribute may reach the DOM.
// The corpus below is the XSS corpus of the change: every entry is either raw HTML or a hostile URL.

const repositoryRoot = resolve(import.meta.dirname, "..");

const xssCorpus = [
  "<img src=x onerror=alert(1)>",
  "<script>alert(1)</script>",
  "<svg/onload=alert(1)>",
  '<iframe src="https://evil.example"></iframe>',
  "<style>p{background:url(javascript:alert(1))}</style>",
  "<b onmouseover=alert(1)>bold</b>",
  '<a href="javascript:alert(1)">a link</a>',
  "[a link](javascript:alert(1))",
  "[a link](JaVaScRiPt:alert(1))",
  "[a link](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)",
  "[a link](vbscript:msgbox(1))",
  "[a link](file:///etc/passwd)",
  "<div onfocus=alert(1) autofocus tabindex=1>focus</div>",
];

function inlineNodes(blocks: BlockNode[]): InlineNode[] {
  return blocks.flatMap((block) => {
    if (block.type === "paragraph") {
      return block.children;
    }

    if (block.type === "list") {
      return block.items.flat();
    }

    return [];
  });
}

function kinds(blocks: BlockNode[]): string[] {
  return inlineNodes(blocks).map((node) => node.type);
}

function text(blocks: BlockNode[]): string {
  return inlineNodes(blocks)
    .map((node) => (node.type === "text" ? node.value : ""))
    .join("");
}

describe("the Markdown renderer", () => {
  it("renders paragraphs, lists, bold, italic and code", () => {
    const inline = parseMarkdown("**bold** and *italic* and `code` here");

    expect(kinds(inline).filter((kind) => kind !== "text")).toEqual([
      "strong",
      "emphasis",
      "code",
    ]);

    const unordered = parseMarkdown("- one\n- two");

    expect(unordered).toEqual([
      {
        type: "list",
        ordered: false,
        items: [
          [{ type: "text", value: "one" }],
          [{ type: "text", value: "two" }],
        ],
      },
    ]);

    const ordered = parseMarkdown("1. one\n2. two");

    expect(ordered[0]).toMatchObject({ type: "list", ordered: true });

    const fenced = parseMarkdown("```\nconst a = 1;\n```");

    expect(fenced).toEqual([{ type: "codeBlock", value: "const a = 1;" }]);
  });

  it("keeps the paragraphs apart and joins the lines of one paragraph", () => {
    const blocks = parseMarkdown("first line\nsecond line\n\nanother paragraph");

    expect(blocks).toHaveLength(2);
    expect(text(blocks.slice(0, 1))).toBe("first line second line");
  });

  it("accepts only http and https in a link", () => {
    expect(safeUrl("https://katalis.dev/docs")).toBe("https://katalis.dev/docs");
    expect(safeUrl("http://127.0.0.1:3100/embed")).toBe("http://127.0.0.1:3100/embed");
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("JaVaScRiPt:alert(1)")).toBeNull();
    expect(safeUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeUrl("vbscript:msgbox(1)")).toBeNull();
    expect(safeUrl("mailto:hola@katalis.dev")).toBeNull();
    expect(safeUrl("/embed")).toBeNull();

    const allowed = parseMarkdown("Read [the docs](https://katalis.dev/docs).");

    expect(kinds(allowed)).toContain("link");
    expect(inlineNodes(allowed).find((node) => node.type === "link")).toEqual({
      type: "link",
      href: "https://katalis.dev/docs",
      children: [{ type: "text", value: "the docs" }],
    });

    const refused = parseMarkdown("Read [the docs](javascript:alert(1)).");

    expect(kinds(refused)).not.toContain("link");
    expect(text(refused)).toContain("the docs");
  });

  it("turns a bare [n] into a citation and leaves a real link alone", () => {
    const marked = parseMarkdown("The tune-up is 380 pesos [1] and the inner tube 120 [2].");

    expect(inlineNodes(marked).filter((node) => node.type === "citation")).toEqual([
      { type: "citation", n: 1 },
      { type: "citation", n: 2 },
    ]);

    const twelve = parseMarkdown("A dozen [12].");

    expect(inlineNodes(twelve).filter((node) => node.type === "citation")).toEqual([
      { type: "citation", n: 12 },
    ]);

    const words = parseMarkdown("Not a marker [abc].");

    expect(kinds(words)).not.toContain("citation");

    const link = parseMarkdown("A numbered link [1](https://katalis.dev/1).");

    expect(kinds(link)).toContain("link");
    expect(kinds(link)).not.toContain("citation");
  });

  it("never parses raw HTML of the corpus", () => {
    for (const entry of xssCorpus) {
      const blocks = parseMarkdown(entry);

      expect(kinds(blocks).every((kind) => kind === "text"), entry).toBe(true);
    }
  });

  it("keeps the corpus out of the DOM of a rendered answer", () => {
    const hostile = xssCorpus.join("\n\n");
    const { container } = render(
      <Markdown text={hostile} citationLabel={(n) => `Citation ${n}`} onCitation={() => {}} />,
    );

    expect(container.querySelector("img, script, iframe, svg, style, object, embed")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
    expect(container.textContent).toContain("javascript:alert(1)");

    for (const element of container.querySelectorAll("*")) {
      for (const attribute of element.attributes) {
        expect(attribute.name.startsWith("on"), `${attribute.name} of ${element.tagName}`).toBe(
          false,
        );
      }
    }
  });

  it("renders a citation marker as a button that names the citation", () => {
    const onCitation = vi.fn();

    render(
      <Markdown
        text="The tune-up is 380 pesos [1]."
        citationLabel={(n) => `Citation ${n}`}
        onCitation={onCitation}
      />,
    );

    const marker = screen.getByRole("button", { name: "Citation 1" });

    expect(marker).toHaveTextContent("[1]");

    fireEvent.click(marker);

    expect(onCitation).toHaveBeenCalledWith(1);
  });

  it("shows the marker as plain text when there is nothing to open", () => {
    const { container } = render(<Markdown text="The tune-up is 380 pesos [1]." />);

    expect(container.querySelector("button")).toBeNull();
    expect(container.textContent).toContain("[1]");
  });

  it("renders a safe link as a link", () => {
    render(<Markdown text="Read [the docs](https://katalis.dev/docs)." />);

    const link = screen.getByRole("link", { name: "the docs" });

    expect(link).toHaveAttribute("href", "https://katalis.dev/docs");
  });

  it("never writes HTML by hand", () => {
    for (const path of ["components/chat/Markdown.tsx", "lib/markdown/parse.ts"]) {
      const source = readFileSync(resolve(repositoryRoot, path), "utf8");

      expect(source, path).not.toContain("dangerouslySetInnerHTML");
      expect(source, path).not.toContain("innerHTML");
      expect(source, path).not.toContain("eval(");
    }
  });
});
