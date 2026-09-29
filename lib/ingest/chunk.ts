import type { ChunkedPassage, ChunkOptions } from "./types.ts";

export const DEFAULT_CHUNK_SIZE = 800;
export const DEFAULT_CHUNK_OVERLAP = 120;

const markdownHeading = /^(#{1,6})\s+(.*\S)\s*$/;
const setextUnderline = /^(=+|-{2,})\s*$/;

function isHeading(line: string): boolean {
  return markdownHeading.test(line) || setextUnderline.test(line);
}

function headingTitle(line: string): string {
  return markdownHeading.exec(line)?.[2]?.trim() ?? "";
}

export function chunkText(source: string, options: Partial<ChunkOptions> = {}): ChunkedPassage[] {
  const size = options.size ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_CHUNK_OVERLAP;
  const blocks: Array<{ text: string; heading: string | null }> = [];
  const passages: ChunkedPassage[] = [];
  let heading: string | null = null;
  let buffer: string[] = [];

  const flush = (): void => {
    const text = buffer.join(" ").trim();

    if (text.length > 0) {
      blocks.push({ text, heading });
    }

    buffer = [];
  };

  for (const rawLine of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flush();
      continue;
    }

    if (isHeading(line)) {
      flush();

      const title = headingTitle(line);

      if (title.length > 0) {
        heading = title;
        blocks.push({ text: title, heading: title });
      }

      continue;
    }

    buffer.push(line);
  }

  flush();

  let current: string[] = [];
  let currentHeading: string | null = null;
  let carry = "";

  const length = (): number => current.join(" ").trim().length;

  const emit = (): void => {
    const text = current.join(" ").trim();

    if (text.length > 0) {
      passages.push({ position: passages.length, heading: currentHeading, text });

      const tail = text.length <= overlap ? text : text.slice(text.length - overlap);
      const boundary = tail.search(/\s/);

      carry = boundary === -1 ? tail : tail.slice(boundary + 1).trimEnd();
    }

    current = [];
  };

  const cut = (text: string, at: number): { head: string; tail: string } => {
    const head = text.slice(0, at);
    const boundary = head.lastIndexOf(" ");

    if (boundary > at / 2) {
      return { head: head.slice(0, boundary), tail: text.slice(boundary) };
    }

    return { head, tail: text.slice(at) };
  };

  const add = (text: string): void => {
    let rest = text.trim();

    if (current.length === 0 && carry.length > 0) {
      const room = size - carry.length - 1;

      if (room <= 0) {
        current.push(carry);
        emit();
      } else if (rest.length >= room) {
        const { head, tail } = cut(rest, room);

        current.push(`${carry} ${head}`.trim());
        emit();
        rest = tail.replace(/^\s+/, "");
      }
    }

    while (rest.length > 0) {
      const room = size - (current.length === 0 ? 0 : length() + 1);

      if (rest.length <= room) {
        current.push(rest);
        return;
      }

      if (room <= 0) {
        emit();
        continue;
      }

      if (current.length > 0 && room < size) {
        emit();
        continue;
      }

      const { head, tail } = cut(rest, size);

      current.push(head);
      rest = tail.replace(/^\s+/, "");

      if (current.length > 0 && length() >= size) {
        emit();
      }
    }
  };

  for (const block of blocks) {
    if (block.heading !== null && block.heading !== currentHeading) {
      emit();
      currentHeading = block.heading;
      carry = "";
    }

    add(block.text);
  }

  emit();

  return passages;
}
