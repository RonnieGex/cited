import { open } from "node:fs/promises";
import { extname } from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { ParsedDocument, SourceType } from "./types.ts";
import { holdsWordDocument } from "./zip.ts";

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

// Decision 15 of the amendment to `openspec/changes/guided-setup-and-knowledge/design.md`: a file is what its bytes
// say. These are the signatures of the binary formats the ingestion refuses by their content, whatever the name claims:
// a PNG renamed to `.txt` is a picture and not a text (the Major M-2 of `katalis-dev/tasks/revision-community-13.md`).
const pdfHead = [0x25, 0x50, 0x44, 0x46, 0x2d];
const zipHead = [0x50, 0x4b, 0x03, 0x04];
const binaryHeads: number[][] = [
  [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  [0xff, 0xd8, 0xff], // JPEG
  [0x47, 0x49, 0x46, 0x38], // GIF
  pdfHead,
  zipHead,
  [0x50, 0x4b, 0x05, 0x06], // an empty ZIP
  [0x50, 0x4b, 0x07, 0x08], // a spanned ZIP
  [0x1f, 0x8b], // gzip
  [0x42, 0x5a, 0x68], // bzip2
  [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00], // xz
  [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], // 7z
  [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07], // rar
  [0x42, 0x4d], // BMP
  [0x49, 0x49, 0x2a, 0x00], // TIFF, little endian
  [0x4d, 0x4d, 0x00, 0x2a], // TIFF, big endian
  [0x52, 0x49, 0x46, 0x46], // RIFF: WEBP, WAV, AVI
  [0x49, 0x44, 0x33], // MP3 with its tag
  [0x77, 0x4f, 0x46, 0x46], // wOFF
  [0x77, 0x4f, 0x46, 0x32], // wOF2
  [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], // the old Office container: doc, xls, ppt
  [0x7f, 0x45, 0x4c, 0x46], // ELF
  [0x4d, 0x5a], // a Windows executable
];

function startsWith(data: Uint8Array, head: number[]): boolean {
  return head.length <= data.length && head.every((byte, index) => data[index] === byte);
}

function binaryHead(data: Uint8Array): boolean {
  return binaryHeads.some((head) => startsWith(data, head));
}

/**
 * Whether the bytes are text: they decode as UTF-8, carry no NUL byte and start with no known binary signature. This is
 * the gate of decision 15 and the reason a permitted extension never decides the type on its own.
 */
function textBytes(data: Uint8Array): boolean {
  if (data.includes(0) || binaryHead(data)) {
    return false;
  }

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(data);

    return true;
  } catch {
    return false;
  }
}

export function detectType(data: Uint8Array, name: string): SourceType | null {
  // The signature decides first, in both directions: a real PDF and a real DOCX are read even when the name lies, and
  // a picture keeps being a picture whatever the extension says.
  if (startsWith(data, pdfHead)) {
    return "pdf";
  }

  if (startsWith(data, zipHead)) {
    // Decision 21 of the second amendment: the head `PK\x03\x04` says "a ZIP", not "a DOCX". Only the archive that
    // holds the document of Word is read as one; any other ZIP is refused as a type, with the list of the accepted
    // types, like every other file whose content is not one of them (the Minor m-4 of `revision-community-13b.md`).
    return holdsWordDocument(data) ? "docx" : null;
  }

  if (textBytes(data) === false) {
    return null;
  }

  const extension = extname(name).toLowerCase();

  if (markdownExtensions.includes(extension)) {
    return "md";
  }

  if (textExtensions.includes(extension)) {
    return "txt";
  }

  // Text that claims to be a picture, a compressed file or a program is still refused: the accepted types are PDF,
  // DOCX, Markdown and plain text, and a renamed file is read as what its content is (the scenario "A renamed file" of
  // `openspec/specs/knowledge-search/spec.md`).
  return binaryExtensions.includes(extension) ? null : "txt";
}

// The rules of the lines of a Word document, before the rest of the markup goes.
const lineRules: Array<[RegExp, string]> = [
  [/<\/(p|h[1-6]|li|tr|div)>/gi, "\n"],
  [/<li[^>]*>/gi, "\n- "],
  [/<br\s*\/?>/gi, "\n"],
];

const anyTag = /<[^>]+>/g;

// The removal repeats until the text no longer changes: one pass takes `<<b>i>` down to `i>` and the next one finds
// nothing left, so no tag survives (the alert `js/incomplete-multi-character-sanitization`).
const maxTagPasses = 10;

// A raw `<` only opens markup in the HTML of the converter, because the `<` an author typed arrives as `&lt;`. A raw
// `<` that is left after the removal is markup cut before its `>`: it goes with everything after it on its line.
const cutMarkup = /<[^>\n]*$/gm;

function removeTags(html: string): string {
  let text = html;

  for (const [pattern, replacement] of lineRules) {
    text = text.replace(pattern, replacement);
  }

  for (let pass = 0; pass < maxTagPasses; pass += 1) {
    const withoutTags = text.replace(anyTag, "");

    if (withoutTags === text) {
      break;
    }

    text = withoutTags;
  }

  return text.replace(cutMarkup, "");
}

// One pass decodes each entity once, through a table and one regular expression: the `<` an author typed is not the
// start of a tag and is not decoded again (the alert `js/double-escaping`).
const entities: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

const entity = /&(?:nbsp|amp|lt|gt|quot|#39);/g;

export function docxToMarkdown(html: string): string {
  const markdown = removeTags(html).replace(entity, (match) => entities[match] ?? match);

  return markdown
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// `pdf-parse` marks every page it extracts ("-- 1 of 1 --"). Those markers are not what the document says, and a PDF
// with no text layer carries nothing else: with them, a scan would be ingested as one passage of a page number. They go
// before the text leaves here, so a scanned PDF reaches the ingestion with no text at all and the panel answers the
// sentence of the scenario "A scanned PDF" (decision 3 of `openspec/changes/guided-setup-and-knowledge/design.md`).
const pageMarker = /^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gm;

async function parsePdf(data: Uint8Array, maxPages: number, name: string): Promise<ParsedDocument> {
  const parser = new PDFParse({ data });

  try {
    const information = await parser.getInfo();

    if (information.total > maxPages) {
      throw new Error(
        `${name} crosses the page limit: ${information.total} pages is above the maximum of ${maxPages}.`,
      );
    }

    const result = await parser.getText();

    return { type: "pdf", text: result.text.replace(pageMarker, ""), pages: information.total };
  } finally {
    await parser.destroy();
  }
}

async function parseDocx(data: Buffer): Promise<ParsedDocument> {
  const converted = await mammoth.convertToHtml({ buffer: data });

  return { type: "docx", text: docxToMarkdown(converted.value), pages: null };
}

export async function parseBuffer(
  data: Uint8Array,
  name: string,
  maxPages: number = MAX_PAGES,
): Promise<ParsedDocument> {
  const type = detectType(data, name);

  if (type === null) {
    throw new Error(
      `${name} is not an accepted type: the content is not PDF, DOCX, Markdown or plain text.`,
    );
  }

  if (type === "pdf") {
    return parsePdf(data, maxPages, name);
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
  // One open file for the size and for the bytes: the file that is measured is the file that is read (the alert
  // `js/file-system-race`), and the read stops at the limit plus one byte, so a file that grows after it was measured
  // cannot pass the limit (decision 5 of the amendment to `openspec/changes/codeql-findings/design.md`).
  const handle = await open(path, "r");

  try {
    const information = await handle.stat();

    if (information.size > limits.maxBytes) {
      throw new Error(
        `${path} crosses the size limit: ${information.size} bytes is above the maximum of ${limits.maxBytes}.`,
      );
    }

    const buffer = Buffer.allocUnsafe(limits.maxBytes + 1);
    let bytesRead = 0;

    while (bytesRead < buffer.length) {
      const chunk = await handle.read(buffer, bytesRead, buffer.length - bytesRead, bytesRead);

      if (chunk.bytesRead === 0) {
        break;
      }

      bytesRead += chunk.bytesRead;
    }

    // More bytes than the limit means the file grew while it was read: the parser never sees them.
    if (bytesRead > limits.maxBytes) {
      throw new Error(
        `${path} crosses the size limit: ${bytesRead} bytes is above the maximum of ${limits.maxBytes}.`,
      );
    }

    return await parseBuffer(buffer.subarray(0, bytesRead), path, limits.maxPages);
  } finally {
    await handle.close();
  }
}

export function acceptedExtensions(): string[] {
  return [...markdownExtensions, ...textExtensions, ".pdf", ".docx"];
}
