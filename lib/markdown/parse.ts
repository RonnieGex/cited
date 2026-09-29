// Design decision 2 of `openspec/changes/public-page-and-widget/design.md`: a small allowlist renderer for the answer.
// The answer is untrusted text: raw HTML is never parsed, a link is `http` or `https` and nothing else, and the tree
// this module returns is the only thing the component paints, so no script, style or event attribute can reach the
// DOM.

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "emphasis"; children: InlineNode[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: InlineNode[] }
  | { type: "citation"; n: number };

export type BlockNode =
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "list"; ordered: boolean; items: InlineNode[][] }
  | { type: "codeBlock"; value: string };

const allowedProtocols = new Set(["http:", "https:"]);

const codePattern = /^`([^`]*)`/;
const strongPattern = /^\*\*([\s\S]+?)\*\*/;
const emphasisPattern = /^\*([^*\n]+)\*/;
const underscorePattern = /^_([^_\n]+)_/;
const linkPattern = /^\[([^\]]*)\]\(([^()\s]+)\)/;
const citationPattern = /^\[(\d{1,3})\]/;
const bulletPattern = /^[-*+]\s+(.*)$/;
const numberedPattern = /^\d+[.)]\s+(.*)$/;

export function safeUrl(url: string): string | null {
  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    return allowedProtocols.has(new URL(trimmed).protocol) ? trimmed : null;
  } catch {
    return null;
  }
}

function parseInline(source: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let text = "";
  let rest = source;

  const flush = (): void => {
    if (text.length > 0) {
      nodes.push({ type: "text", value: text });
      text = "";
    }
  };

  while (rest.length > 0) {
    const char = rest[0] ?? "";

    if (char === "`") {
      const code = codePattern.exec(rest);

      if (code !== null) {
        flush();
        nodes.push({ type: "code", value: code[1] ?? "" });
        rest = rest.slice(code[0].length);
        continue;
      }
    }

    if (char === "*") {
      const strong = strongPattern.exec(rest);

      if (strong !== null) {
        flush();
        nodes.push({ type: "strong", children: parseInline(strong[1] ?? "") });
        rest = rest.slice(strong[0].length);
        continue;
      }

      const emphasis = emphasisPattern.exec(rest);

      if (emphasis !== null) {
        flush();
        nodes.push({ type: "emphasis", children: parseInline(emphasis[1] ?? "") });
        rest = rest.slice(emphasis[0].length);
        continue;
      }
    }

    if (char === "_") {
      const emphasis = underscorePattern.exec(rest);

      if (emphasis !== null) {
        flush();
        nodes.push({ type: "emphasis", children: parseInline(emphasis[1] ?? "") });
        rest = rest.slice(emphasis[0].length);
        continue;
      }
    }

    if (char === "[") {
      const link = linkPattern.exec(rest);
      const href = link === null ? null : safeUrl(link[2] ?? "");

      if (link !== null && href !== null) {
        flush();
        nodes.push({ type: "link", href, children: parseInline(link[1] ?? "") });
        rest = rest.slice(link[0].length);
        continue;
      }

      const citation = citationPattern.exec(rest);

      if (citation !== null) {
        flush();
        nodes.push({ type: "citation", n: Number(citation[1]) });
        rest = rest.slice(citation[0].length);
        continue;
      }
    }

    text += char;
    rest = rest.slice(1);
  }

  flush();

  return nodes;
}

export function parseMarkdown(source: string): BlockNode[] {
  const blocks: BlockNode[] = [];
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let fence: string[] | null = null;

  const flushParagraph = (): void => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", children: parseInline(paragraph.join(" ")) });
      paragraph = [];
    }
  };

  const flushList = (): void => {
    if (list !== null) {
      blocks.push({
        type: "list",
        ordered: list.ordered,
        items: list.items.map((item) => parseInline(item)),
      });
      list = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (fence !== null) {
      if (trimmed.startsWith("```")) {
        blocks.push({ type: "codeBlock", value: fence.join("\n") });
        fence = null;
        continue;
      }

      fence.push(line);
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushList();
      fence = [];
      continue;
    }

    if (trimmed.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    const bullet = bulletPattern.exec(trimmed);

    if (bullet !== null) {
      flushParagraph();

      if (list === null || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }

      list.items.push(bullet[1] ?? "");
      continue;
    }

    const numbered = numberedPattern.exec(trimmed);

    if (numbered !== null) {
      flushParagraph();

      if (list === null || list.ordered === false) {
        flushList();
        list = { ordered: true, items: [] };
      }

      list.items.push(numbered[1] ?? "");
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  if (fence !== null) {
    blocks.push({ type: "codeBlock", value: fence.join("\n") });
  }

  return blocks;
}
