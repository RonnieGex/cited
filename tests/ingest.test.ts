import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFParse } from "pdf-parse";
import { afterAll, describe, expect, it, vi } from "vitest";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import { resolveEmbeddingsProvider } from "@/lib/embeddings/providers";
import { MAX_FILE_BYTES, MAX_PAGES, ingestPaths, parseFile } from "@/lib/ingest";
import { openStore, type Store } from "@/lib/store";
import { buildDocx, buildPdf } from "./fixtures/documents";

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
