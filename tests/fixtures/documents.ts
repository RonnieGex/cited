import { deflateRawSync } from "node:zlib";

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);

function crc32(input: Uint8Array): number {
  let crc = 0xffffffff;

  for (const byte of input) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

export type ZipEntry = { name: string; content: string };

/**
 * A real ZIP archive, with its local headers, its central directory and its end record. `buildDocx()` writes a DOCX
 * with it, and the cases of decision 21 use it to write an archive that is a ZIP and not a DOCX: the bytes start with
 * `PK\x03\x04` and the entries are whatever the case asks for.
 */
export function buildZip(entries: ZipEntry[]): Buffer {
  return zip(entries);
}

const endSize = 22;
const extendedSize = 56;
const locatorSize = 20;

/**
 * The same archive, written the way the ZIP64 extension asks: the closing record of the original format carries
 * `0xffff` and `0xffffffff` and the 64-bit counts live in the record before it, which the locator points at. A writer
 * chooses it for a small document as well, and a reader that only walks the 32-bit directory refuses an archive that
 * is a DOCX and that Mammoth reads.
 */
export function asZip64(archive: Buffer): Buffer {
  const end = archive.length - endSize;
  const entries = archive.readUInt16LE(end + 10);
  const centralSize = archive.readUInt32LE(end + 12);
  const centralOffset = archive.readUInt32LE(end + 16);
  const extended = Buffer.alloc(extendedSize);

  extended.writeUInt32LE(0x06064b50, 0);
  extended.writeBigUInt64LE(BigInt(extendedSize - 12), 4);
  extended.writeUInt16LE(45, 12);
  extended.writeUInt16LE(45, 14);
  extended.writeUInt32LE(0, 16);
  extended.writeUInt32LE(0, 20);
  extended.writeBigUInt64LE(BigInt(entries), 24);
  extended.writeBigUInt64LE(BigInt(entries), 32);
  extended.writeBigUInt64LE(BigInt(centralSize), 40);
  extended.writeBigUInt64LE(BigInt(centralOffset), 48);

  const locator = Buffer.alloc(locatorSize);

  locator.writeUInt32LE(0x07064b50, 0);
  locator.writeUInt32LE(0, 4);
  locator.writeBigUInt64LE(BigInt(end), 8);
  locator.writeUInt32LE(1, 16);

  const closing = Buffer.from(archive.subarray(end));

  closing.writeUInt16LE(0xffff, 8);
  closing.writeUInt16LE(0xffff, 10);
  closing.writeUInt32LE(0xffffffff, 16);

  return Buffer.concat([archive.subarray(0, end), extended, locator, closing]);
}

function zip(entries: ZipEntry[]): Buffer {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = bytes(entry.name);
    const raw = bytes(entry.content);
    const deflated = deflateRawSync(raw);
    const crc = crc32(raw);

    const header = Buffer.alloc(30);

    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(8, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(0, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(deflated.length, 18);
    header.writeUInt32LE(raw.length, 22);
    header.writeUInt16LE(name.length, 26);
    header.writeUInt16LE(0, 28);

    local.push(header, Buffer.from(name), deflated);

    const directory = Buffer.alloc(46);

    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(0, 8);
    directory.writeUInt16LE(8, 10);
    directory.writeUInt16LE(0, 12);
    directory.writeUInt16LE(0, 14);
    directory.writeUInt32LE(crc, 16);
    directory.writeUInt32LE(deflated.length, 20);
    directory.writeUInt32LE(raw.length, 24);
    directory.writeUInt16LE(name.length, 28);
    directory.writeUInt16LE(0, 30);
    directory.writeUInt16LE(0, 32);
    directory.writeUInt16LE(0, 34);
    directory.writeUInt16LE(0, 36);
    directory.writeUInt32LE(0, 38);
    directory.writeUInt32LE(offset, 42);

    central.push(directory, Buffer.from(name));
    offset += header.length + name.length + deflated.length;
  }

  const centralBuffer = Buffer.concat(central);
  const end = Buffer.alloc(22);

  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...local, centralBuffer, end]);
}

const escapeText = (text: string): string =>
  text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");

function contentStream(lines: string[]): string {
  const body = lines
    .map((line, index) => (index === 0 ? `(${escapeText(line)}) Tj` : `T* (${escapeText(line)}) Tj`))
    .join("\n");

  return `BT /F1 12 Tf 14 TL 72 720 Td\n${body}\nET`;
}

export function buildPdf(pages: string[][]): Buffer {
  const objects: string[] = [];
  const pageCount = pages.length;
  const pageReferences = pages.map((_, index) => `${4 + index * 2} 0 R`).join(" ");

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${pageReferences}] /Count ${pageCount} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  for (const lines of pages) {
    const stream = contentStream(lines);

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${objects.length + 2} 0 R >>`,
    );
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }

  let document = "%PDF-1.4\n";
  const offsets: number[] = [];

  objects.forEach((object, index) => {
    offsets.push(document.length);
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const startxref = document.length;

  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (const offset of offsets) {
    document += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }

  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return Buffer.from(document, "latin1");
}

export type DocxParagraph = { text: string; style?: string; list?: boolean; raw?: boolean };

/** The numbering of the list items of `buildDocx`: one abstract list with a bullet, and one list that uses it. */
const docxNumbering =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/>' +
  '<w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl></w:abstractNum>' +
  '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>' +
  "</w:numbering>";

export function buildDocx(paragraphs: DocxParagraph[]): Buffer {
  const body = paragraphs
    .map((paragraph) => {
      // A raw paragraph carries the XML of its runs itself, which is the only way to write a `<w:br/>`, a hyperlink or
      // an entity of the document as the converter of Word writes them.
      if (paragraph.raw === true) {
        return `<w:p>${paragraph.text}</w:p>`;
      }

      const numbering =
        paragraph.list === true
          ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'
          : "";
      const style =
        paragraph.style === undefined ? "" : `<w:pStyle w:val="${paragraph.style}"/>`;
      const properties =
        numbering === "" && style === "" ? "" : `<w:pPr>${style}${numbering}</w:pPr>`;

      return `<w:p>${properties}<w:r><w:t xml:space="preserve">${paragraph.text}</w:t></w:r></w:p>`;
    })
    .join("");
  const list = paragraphs.some((paragraph) => paragraph.list === true);

  return zip([
    {
      name: "[Content_Types].xml",
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        (list
          ? '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'
          : "") +
        "</Types>",
    },
    {
      name: "_rels/.rels",
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        "</Relationships>",
    },
    ...(list
      ? [
          {
            name: "word/_rels/document.xml.rels",
            content:
              '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
              '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
              '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>' +
              "</Relationships>",
          },
          { name: "word/numbering.xml", content: docxNumbering },
        ]
      : []),
    {
      name: "word/document.xml",
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        `<w:body>${body}<w:sectPr/></w:body></w:document>`,
    },
  ]);
}
