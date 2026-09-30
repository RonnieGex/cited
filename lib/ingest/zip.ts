// Decision 21 of the second amendment to `openspec/changes/guided-setup-and-knowledge/design.md`: a file starting with
// `PK\x03\x04` is a DOCX only when its archive holds `word/document.xml`. A ZIP and the document of Word share those
// four bytes, so the head says "an archive" and never "the document of Word": the names of the entries are in the
// central directory of the archive, and this reader walks it. Anything it cannot read is not a DOCX, which is the
// direction the decision asks for: proving the entry is what makes the type, and a doubtful archive is refused as a
// type like any other file (the Minor m-4 of `katalis-dev/tasks/revision-community-13b.md`).

const endHead = [0x50, 0x4b, 0x05, 0x06];
const directoryHead = [0x50, 0x4b, 0x01, 0x02];
const endSize = 22;
const directorySize = 46;
const commentMaximum = 0xffff;
const documentEntry = "word/document.xml";

function same(data: Uint8Array, head: number[], at: number): boolean {
  return head.every((byte, index) => data[at + index] === byte);
}

function read16(data: Uint8Array, at: number): number {
  return (data[at] ?? 0) | ((data[at + 1] ?? 0) << 8);
}

function read32(data: Uint8Array, at: number): number {
  return (read16(data, at) | (read16(data, at + 2) << 16)) >>> 0;
}

/** Where the record that closes the archive begins, or -1: it is the last one and its comment can be 64 KB long. */
function endAt(data: Uint8Array): number {
  const least = Math.max(0, data.length - endSize - commentMaximum);

  for (let at = data.length - endSize; at >= least; at -= 1) {
    if (same(data, endHead, at)) {
      return at;
    }
  }

  return -1;
}

/**
 * The names of the entries of a ZIP archive, in the order its central directory holds them, or an empty list when the
 * archive cannot be read. The sizes of the directory are the 32-bit ones of the original format: an archive of the
 * ZIP64 extension does not fit here, and an archive this reader cannot read is not a DOCX.
 */
export function zipEntryNames(data: Uint8Array): string[] {
  const end = endAt(data);

  if (end < 0) {
    return [];
  }

  const entries = read16(data, end + 10);
  const start = read32(data, end + 16);

  if (entries === 0xffff || start === 0xffff_ffff) {
    return [];
  }

  const names: string[] = [];
  let at = start;

  for (let index = 0; index < entries; index += 1) {
    if (at + directorySize > data.length || same(data, directoryHead, at) === false) {
      return [];
    }

    const nameLength = read16(data, at + 28);
    const extraLength = read16(data, at + 30);
    const entryComment = read16(data, at + 32);
    const nameEnd = at + directorySize + nameLength;

    if (nameEnd > data.length) {
      return [];
    }

    names.push(new TextDecoder().decode(data.subarray(at + directorySize, nameEnd)));
    at = nameEnd + extraLength + entryComment;
  }

  return names;
}

/** Whether the archive of these bytes holds the document of a DOCX. */
export function holdsWordDocument(data: Uint8Array): boolean {
  return zipEntryNames(data).includes(documentEntry);
}
