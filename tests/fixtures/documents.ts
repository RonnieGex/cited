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

type ZipEntry = { name: string; content: string };

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

export type DocxParagraph = { text: string; style?: string };

export function buildDocx(paragraphs: DocxParagraph[]): Buffer {
  const body = paragraphs
    .map((paragraph) => {
      const properties =
        paragraph.style === undefined ? "" : `<w:pPr><w:pStyle w:val="${paragraph.style}"/></w:pPr>`;

      return `<w:p>${properties}<w:r><w:t xml:space="preserve">${paragraph.text}</w:t></w:r></w:p>`;
    })
    .join("");

  return zip([
    {
      name: "[Content_Types].xml",
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
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
    {
      name: "word/document.xml",
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        `<w:body>${body}<w:sectPr/></w:body></w:document>`,
    },
  ]);
}
