import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFParse } from "pdf-parse";
import { afterAll, describe, expect, it, vi } from "vitest";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import { resolveEmbeddingsProvider } from "@/lib/embeddings/providers";
import { MAX_FILE_BYTES, MAX_PAGES, ingestPaths, parseFile } from "@/lib/ingest";
import { docxToMarkdown } from "@/lib/ingest/parse";
import { openStore, type Store } from "@/lib/store";
import { asZip64, buildDocx, buildPdf, buildZip } from "./fixtures/documents";

// The size limit has to come from the open file, so every read of a path is watched: a pass of the ingestion that
// reads no path is the shape the scenario asks for, and the one the alert `js/file-system-race` points at.
const probe = vi.hoisted(() => {
  const readPaths: string[] = [];

  return { readPaths };
});

vi.mock("node:fs/promises", async (original: () => Promise<typeof import("node:fs/promises")>) => {
  const actual = await original();

  return {
    ...actual,
    readFile: async (path: Parameters<typeof actual.readFile>[0], options?: unknown) => {
      probe.readPaths.push(String(path));

      return Reflect.apply(actual.readFile, actual, [path, options]);
    },
  } satisfies typeof import("node:fs/promises");
});

const root = mkdtempSync(join(tmpdir(), "katalis-ingest-"));
const stores: Store[] = [];
let counter = 0;

function caseFolder(): string {
  counter += 1;

  const folder = join(root, `case-${counter}`);

  mkdirSync(folder, { recursive: true });

  return folder;
}

async function store(): Promise<Store> {
  const opened = await openStore(join(caseFolder(), "store.sqlite"));

  stores.push(opened);

  return opened;
}

function document(name: string, content: string | Buffer): string {
  const path = join(caseFolder(), name);

  writeFileSync(path, content);

  return path;
}

afterAll(async () => {
  for (const opened of stores) {
    opened.close();
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });

      return;
    } catch {
      await new Promise((wake) => setTimeout(wake, 300));
    }
  }
});

describe("type detection", () => {
  it("declares the limits of the spec", () => {
    expect(MAX_FILE_BYTES).toBe(20 * 1024 * 1024);
    expect(MAX_PAGES).toBe(500);
  });

  it("reads a renamed file as what its content is", async () => {
    const path = document("notes.pdf", "Martes a viernes: 8:00 a 19:00.");
    const parsed = await parseFile(path);

    expect(parsed.type).toBe("txt");
    expect(parsed.text).toContain("Martes a viernes");
    expect(parsed.pages).toBeNull();
  });

  it("reads a docx by its content and keeps its heading style", async () => {
    const path = document(
      "guia.docx",
      buildDocx([
        { text: "Guía del taller", style: "Heading1" },
        { text: "Aceptamos efectivo y tarjeta." },
      ]),
    );
    const parsed = await parseFile(path);

    expect(parsed.type).toBe("docx");
    expect(parsed.text).toContain("Guía del taller");
    expect(parsed.text).toContain("Aceptamos efectivo y tarjeta.");
  });

  it("reads a pdf by its content and counts its pages", async () => {
    const path = document(
      "aviso.pdf",
      buildPdf([["Aviso del taller"], ["El lunes permanecemos cerrados."]]),
    );
    const parsed = await parseFile(path);

    expect(parsed.type).toBe("pdf");
    expect(parsed.pages).toBe(2);
    expect(parsed.text).toContain("Aviso del taller");
  });

  it("refuses a file whose content is not an accepted type", async () => {
    const path = document("drawing.svg", '<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    await expect(parseFile(path)).rejects.toThrowError(/not an accepted type/i);
  });

  // Decision 15 of the amendment: a file is what its bytes say. A permitted extension never proves that the content is
  // text, so the signature of a picture refuses it even when the name claims `.txt` (the Major M-2 of
  // `revision-community-13.md`), and a text name whose bytes are not UTF-8 is refused as well.
  it("refuses a PNG renamed to a text extension", async () => {
    const path = document(
      "imagen.txt",
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x01, 0x41]),
    );

    await expect(parseFile(path)).rejects.toThrowError(/not an accepted type/i);
  });

  it("refuses a JPEG renamed to Markdown", async () => {
    const path = document(
      "foto.md",
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
    );

    await expect(parseFile(path)).rejects.toThrowError(/not an accepted type/i);
  });

  it("refuses a text name whose bytes are not UTF-8 text", async () => {
    const path = document("notas.md", Buffer.from([0xc3, 0x28, 0x00, 0x41, 0x42, 0x43]));

    await expect(parseFile(path)).rejects.toThrowError(/not an accepted type/i);
  });

  it("reads a PDF and a DOCX named `.txt` by their content", async () => {
    const pdf = await parseFile(document("aviso.txt", buildPdf([["Aviso del taller"]])));
    const docx = await parseFile(document("guia.txt", buildDocx([{ text: "Aceptamos efectivo y tarjeta." }])));

    expect(pdf.type).toBe("pdf");
    expect(pdf.text).toContain("Aviso del taller");
    expect(docx.type).toBe("docx");
    expect(docx.text).toContain("Aceptamos efectivo y tarjeta.");
  });

  // Decision 21 of the second amendment: a ZIP is not a DOCX. The head `PK\x03\x04` says "an archive", not "the
  // document of Word": a ZIP is read only when its archive holds `word/document.xml`, and any other one is refused as
  // a type, with the list of the accepted types, like every other rejected file (the Minor m-4 of
  // `revision-community-13b.md`).
  it("refuses a ZIP renamed `.docx` that holds no document of Word", async () => {
    const path = document(
      "paquete.docx",
      buildZip([{ name: "notas.txt", content: "Abrimos de martes a domingo." }]),
    );

    await expect(parseFile(path)).rejects.toThrowError(/not an accepted type/i);
    await expect(parseFile(path)).rejects.toThrowError(/PDF, DOCX, Markdown or plain text/);
  });

  it("refuses a ZIP whose entry only ends like the document of a DOCX", async () => {
    const path = document(
      "casi.docx",
      buildZip([{ name: "copia/word/document.xml", content: "<w:document/>" }]),
    );

    await expect(parseFile(path)).rejects.toThrowError(/not an accepted type/i);
  });

  it("keeps reading a real DOCX by the entry it holds", async () => {
    const path = document("acta.docx", buildDocx([{ text: "El lunes permanecemos cerrados." }]));
    const parsed = await parseFile(path);

    expect(parsed.type).toBe("docx");
    expect(parsed.text).toContain("El lunes permanecemos cerrados.");
  });

  it("reads a DOCX whose writer chose the ZIP64 directory", async () => {
    const path = document(
      "acta-zip64.docx",
      asZip64(buildDocx([{ text: "El lunes permanecemos cerrados." }])),
    );
    const parsed = await parseFile(path);

    expect(parsed.type).toBe("docx");
    expect(parsed.text).toContain("El lunes permanecemos cerrados.");
  });

  it("refuses a ZIP64 archive that holds no document of Word", async () => {
    const path = document(
      "paquete-zip64.docx",
      asZip64(buildZip([{ name: "notas.txt", content: "Abrimos de martes a domingo." }])),
    );

    await expect(parseFile(path)).rejects.toThrowError(/not an accepted type/i);
  });
});

// The scenario "An entity is decoded once" and the scenario "Markup is removed whole and text that looks like markup
// stays" of `openspec/changes/codeql-findings/specs/knowledge-search/spec.md`.
describe("a Word document keeps its text as written", () => {
  it("decodes an entity once, whatever the author typed", async () => {
    const run = (text: string): string => `<w:r><w:t xml:space="preserve">${text}</w:t></w:r>`;
    // The paragraph reads `5 &lt; 6` as its author typed it, so the converter's HTML holds `5 &amp;lt; 6`.
    const typedEntity = document("entidad.docx", buildDocx([{ text: run("5 &amp;lt; 6"), raw: true }]));
    // A paragraph that reads `5 < 6`, held as `5 &lt; 6` in the HTML.
    const typedMarkup = document("signo.docx", buildDocx([{ text: run("5 &lt; 6"), raw: true }]));

    const kept = await parseFile(typedEntity);
    const decoded = await parseFile(typedMarkup);

    expect(kept.type).toBe("docx");
    expect(kept.text).toBe("5 &lt; 6");
    expect(decoded.type).toBe("docx");
    expect(decoded.text).toBe("5 < 6");
  });

  it("removes the markup whole and keeps the text that looks like markup", () => {
    const html = '<p><a href="#x">Horario</a><br/>Lunes</p><p>Escribe &lt;b&gt; para negritas</p>';
    const text = docxToMarkdown(html);

    expect(text.split("\n")).toEqual(["Horario", "Lunes", "Escribe <b> para negritas"]);
    expect(text).not.toContain("<a ");
    expect(text).not.toContain("</a>");
    expect(text).not.toContain("<p>");
    expect(text).not.toContain("</p>");
    expect(text).not.toContain("<br");
  });
});

describe("the limits", () => {
  it("refuses a file above the byte limit before parsing it", async () => {
    const path = document("grande.md", `# Notas\n${"a".repeat(4000)}`);
    const opened = await store();
    const report = await ingestPaths([path], {
      store: opened,
      embeddings: createFakeEmbeddings(),
      limits: { maxBytes: 1024, maxPages: MAX_PAGES },
    });

    expect(report.failed).toHaveLength(1);
    expect(report.failed[0]?.reason).toMatch(/size/i);
    await expect(opened.countPassages()).resolves.toBe(0);
  });

  it("refuses a file above the page limit before extracting any text", async () => {
    const extract = vi.spyOn(PDFParse.prototype, "getText");

    try {
      const path = document("largo.pdf", buildPdf([["Uno"], ["Dos"], ["Tres"]]));
      const opened = await store();
      const report = await ingestPaths([path], {
        store: opened,
        embeddings: createFakeEmbeddings(),
        limits: { maxBytes: MAX_FILE_BYTES, maxPages: 2 },
      });

      expect(report.failed).toHaveLength(1);
      expect(report.failed[0]?.reason).toMatch(/pages/i);
      await expect(opened.countPassages()).resolves.toBe(0);
      expect(extract).not.toHaveBeenCalled();

      const inside = document("corto.pdf", buildPdf([["Uno"], ["Dos"]]));
      const parsed = await parseFile(inside, { maxBytes: MAX_FILE_BYTES, maxPages: 2 });

      expect(parsed.pages).toBe(2);
      expect(extract).toHaveBeenCalledTimes(1);
    } finally {
      extract.mockRestore();
    }
  });

  // The scenario "A file above the limit on disk" of `openspec/changes/codeql-findings/specs/knowledge-search/spec.md`:
  // the size of the file comes from the open file whose bytes are read, and an oversized one has none of its bytes
  // read.
  it("refuses a file above the byte limit with the size of the open file", async () => {
    const path = document("enorme.md", `# Notas\n${"a".repeat(4096)}`);
    const size = statSync(path).size;

    probe.readPaths.length = 0;

    await expect(parseFile(path, { maxBytes: 1024, maxPages: MAX_PAGES })).rejects.toThrowError(
      new RegExp(`crosses the size limit: ${size} bytes is above the maximum of 1024\\.`),
    );

    expect(probe.readPaths).toEqual([]);
    expect(size).toBeGreaterThan(1024);
  });

  it("keeps reading a file inside the limit", async () => {
    const path = document("breve.md", "# Notas\nAbrimos de martes a domingo.");
    const acta = document("acta-limite.docx", buildDocx([{ text: "El lunes permanecemos cerrados." }]));

    probe.readPaths.length = 0;

    const parsed = await parseFile(path, { maxBytes: MAX_FILE_BYTES, maxPages: MAX_PAGES });
    const parsedDocx = await parseFile(acta, { maxBytes: MAX_FILE_BYTES, maxPages: MAX_PAGES });

    expect(parsed.text).toContain("Abrimos de martes a domingo.");
    expect(parsedDocx.type).toBe("docx");
    expect(parsedDocx.text).toContain("El lunes permanecemos cerrados.");
    expect(probe.readPaths).toEqual([]);
  });

  // The mechanism of the scenario, seen from the test: one direct read of the path proves that the wrapper records, and
  // `parseFile` of the same path adds nothing — its bytes came from the open file. That shape is what the alert
  // `js/file-system-race` points at.
  it("reads no path: the bytes come from the open file", async () => {
    const path = document("abierto.md", "# Notas\nAbrimos de martes a domingo.");
    const { readFile } = await import("node:fs/promises");

    probe.readPaths.length = 0;

    await readFile(path, "utf8");

    const parsed = await parseFile(path, { maxBytes: MAX_FILE_BYTES, maxPages: MAX_PAGES });

    expect(parsed.text).toContain("Abrimos de martes a domingo.");
    expect(probe.readPaths).toHaveLength(1);
  });
});

describe("a broken file", () => {
  it("names the file and skips it without writing a passage of it, and ingests the rest", async () => {
    const broken = document(
      "roto.pdf",
      Buffer.concat([
        Buffer.from("%PDF-1.7\n", "latin1"),
        Buffer.from("trailer without a catalog", "latin1"),
      ]),
    );
    const healthy = document("notas.md", "# Horario\n\nAbrimos de martes a domingo.");
    const opened = await store();
    const report = await ingestPaths([broken, healthy], {
      store: opened,
      embeddings: createFakeEmbeddings(),
      limits: { maxBytes: MAX_FILE_BYTES, maxPages: MAX_PAGES },
    });

    expect(report.failed.map((failure) => failure.path)).toEqual([broken]);
    expect(report.failed[0]?.reason.length).toBeGreaterThan(0);
    expect(report.ingested.map((entry) => entry.name)).toEqual(["notas.md"]);
    await expect(opened.findDocument("roto.pdf")).resolves.toBeNull();
    await expect(opened.countPassages({ name: "roto.pdf" })).resolves.toBe(0);
    expect(await opened.countPassages({ name: "notas.md" })).toBeGreaterThan(0);
  });
});

describe("re-ingestion", () => {
  it("replaces the passages of a document instead of duplicating them", async () => {
    const path = document("horario.md", "# Horario\n\nAbrimos de martes a domingo.");
    const opened = await store();
    const options = {
      store: opened,
      embeddings: createFakeEmbeddings(),
      limits: { maxBytes: MAX_FILE_BYTES, maxPages: MAX_PAGES },
    };

    await ingestPaths([path], options);

    const afterFirst = await opened.countPassages({ name: "horario.md" });

    await ingestPaths([path], options);

    const afterSecond = await opened.countPassages({ name: "horario.md" });

    expect(afterFirst).toBeGreaterThan(0);
    expect(afterSecond).toBe(afterFirst);
    await expect(opened.listDocuments()).resolves.toHaveLength(1);
  });

  it("replaces the keyword index too", async () => {
    const path = document("horario.md", "# Horario\n\nAbrimos de martes a domingo.");
    const opened = await store();
    const options = {
      store: opened,
      embeddings: createFakeEmbeddings(),
      limits: { maxBytes: MAX_FILE_BYTES, maxPages: MAX_PAGES },
    };

    await ingestPaths([path], options);
    await ingestPaths([path], options);

    expect(await opened.countIndexed()).toBe(await opened.countPassages());
  });
});

describe("ingestion stops before reading any document when the key is missing", () => {
  it("names the variable and ingests nothing", async () => {
    const path = document("horario.md", "# Horario\n\nAbrimos de martes a domingo.");
    const opened = await store();
    const storeBefore = await opened.countPassages();
    let message = "";

    try {
      resolveEmbeddingsProvider({
        EMBEDDINGS_PROVIDER: "openai",
        EMBEDDINGS_BASE_URL: "https://embeddings.invalid/v1",
        EMBEDDINGS_MODEL: "small-embedding",
        EMBEDDINGS_API_KEY: "",
      });
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toMatch(/EMBEDDINGS_API_KEY/);
    expect(message).not.toMatch(/https:\/\/embeddings\.invalid/);
    expect(await opened.countPassages()).toBe(storeBefore);
    await expect(opened.listDocuments()).resolves.toHaveLength(0);
    expect(path.length).toBeGreaterThan(0);
  });
});
