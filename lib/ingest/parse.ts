import { readFile, stat } from "node:fs/promises";
import { extname } from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { ParsedDocument, SourceType } from "./types.ts";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_PAGES = 500;

const markdownExtensions = [".md", ".markdown", ".mdx"];
const textExtensions = [".txt", ".text", ".csv", ".log", ".tsv"];
const binaryExtensions = [
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".zip",
  ".gz",
  ".exe",
  ".dll",
  ".xlsx",
  ".pptx",
  ".odt",
  ".mp3",
  ".mp4",
  ".woff",
  ".woff2",
  ".ttf",
];

export function detectType(head: Uint8Array, name: string): SourceType | null {
  const prefix = Buffer.from(head).toString("latin1");

  if (prefix.startsWith("%PDF-")) {
    return "pdf";
  }

  if (prefix.startsWith("PK\u0003\u0004")) {
    return "docx";
  }

  const extension = extname(name).toLowerCase();

  if (markdownExtensions.includes(extension)) {
    return "md";
  }

  if (textExtensions.includes(extension)) {
    return "txt";
  }

  if (binaryExtensions.includes(extension)) {
    return null;
  }

  return prefix.includes("\u0000") ? null : "txt";
}

function docxToMarkdown(html: string): string {
  const markdown = html
    .replace(/<\/(p|h[1-6]|li|tr|div)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return markdown
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function parsePdf(data: Uint8Array): Promise<ParsedDocument> {
  const parser = new PDFParse({ data });

  try {
    const result = await parser.getText();

    return { type: "pdf", text: result.text, pages: result.total };
  } finally {
    await parser.destroy();
  }
}

async function parseDocx(data: Buffer): Promise<ParsedDocument> {
  const converted = await mammoth.convertToHtml({ buffer: data });

  return { type: "docx", text: docxToMarkdown(converted.value), pages: null };
}

export async function parseBuffer(data: Uint8Array, name: string): Promise<ParsedDocument> {
  const type = detectType(data.subarray(0, 8), name);

  if (type === null) {
    throw new Error(
      `${name} is not an accepted type: the content is not PDF, DOCX, Markdown or plain text.`,
    );
  }

  if (type === "pdf") {
    return parsePdf(data);
  }

  if (type === "docx") {
    return parseDocx(Buffer.from(data));
  }

  return { type, text: Buffer.from(data).toString("utf8").replace(/^\uFEFF/, ""), pages: null };
}

export async function parseFile(
  path: string,
  limits: { maxBytes: number; maxPages: number } = {
    maxBytes: MAX_FILE_BYTES,
    maxPages: MAX_PAGES,
  },
): Promise<ParsedDocument> {
  const information = await stat(path);

  if (information.size > limits.maxBytes) {
    throw new Error(
      `${path} crosses the size limit: ${information.size} bytes is above the maximum of ${limits.maxBytes}.`,
    );
  }

  const parsed = await parseBuffer(await readFile(path), path);

  if (parsed.pages !== null && parsed.pages > limits.maxPages) {
    throw new Error(
      `${path} crosses the page limit: ${parsed.pages} pages is above the maximum of ${limits.maxPages}.`,
    );
  }

  return parsed;
}

export function acceptedExtensions(): string[] {
  return [...markdownExtensions, ...textExtensions, ".pdf", ".docx"];
}
