import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import { MAX_FILE_BYTES, MAX_PAGES, chunkText, ingestPaths } from "@/lib/ingest";
import { openStore, type Store } from "@/lib/store";
import { hybridSearch } from "@/lib/search";
import type { EmbeddingProvider } from "@/lib/embeddings/types";

const roots: string[] = [];
const stores: Store[] = [];
const embeddings = createFakeEmbeddings();

const target = [
  "## Cambios y cancelaciones",
  "",
  "Puedes mover tu cita sin costo si avisas con dos días de anticipación. Si avisas más tarde,",
  "el taller cobra la mitad de la mano de obra. Si no llegas, se cobra el trabajo completo.",
].join("\n");

const noise = [
  "## Horario",
  "",
  "Martes a viernes de 8:00 a 19:00. Sábado de 9:00 a 20:00. Domingo de 9:00 a 14:00.",
  "El lunes el taller permanece cerrado por mantenimiento.",
].join("\n");

const payments = [
  "## Formas de pago",
  "",
  "Efectivo y tarjeta en el mostrador. Para consumos menores a 200 pesos no aceptamos",
  "transferencias. La factura se pide el mismo día de la compra.",
].join("\n");

function workspace(): string {
  const root = mkdtempSync(join(tmpdir(), "katalis-search-"));

  roots.push(root);

  return root;
}

function corpus(): string {
  const root = workspace();

  writeFileSync(join(root, "politicas.md"), `# Políticas del taller\n\n${target}`);
  writeFileSync(join(root, "horario.md"), `# Horario\n\n${noise}`);
  writeFileSync(join(root, "pagos.md"), `# Pagos\n\n${payments}`);

  return root;
}

async function loadedStore(): Promise<{ store: Store; provider: EmbeddingProvider }> {
  const opened = await openStore(join(workspace(), "store.sqlite"));
  const folder = corpus();

  stores.push(opened);

  await ingestPaths(
    [join(folder, "politicas.md"), join(folder, "horario.md"), join(folder, "pagos.md")],
    {
      store: opened,
      embeddings,
      limits: { maxBytes: MAX_FILE_BYTES, maxPages: MAX_PAGES },
    },
  );

  return { store: opened, provider: embeddings };
}

let shared: { store: Store; provider: EmbeddingProvider };

beforeAll(async () => {
  shared = await loadedStore();
});

afterAll(async () => {
  for (const opened of stores) {
    opened.close();
  }

  for (const root of roots) {
    await new Promise((wake) => setTimeout(wake, 100));

    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
        break;
      } catch {
        await new Promise((wake) => setTimeout(wake, 200));
      }
    }
  }
});

describe("the store keeps where each passage came from", () => {
  it("stores the document, the position and the nearest heading", async () => {
    const passages = await shared.store.getPassages({ limit: 50 });
    const passage = passages.find((row) => row.text.includes("Cambios y cancelaciones"));

    expect(passage?.name).toBe("politicas.md");
    expect(passage?.heading).toBe("Cambios y cancelaciones");
    expect(passage?.position).toBeGreaterThanOrEqual(0);
  });

  it("stores the hash of the file it ingested", async () => {
    const stored = await shared.store.findDocument("politicas.md");

    expect(stored?.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(stored?.type).toBe("md");
    expect(stored?.pages).toBeNull();
  });
});

describe("hybrid search", () => {
  it("returns the top passages with document, heading, position and score", async () => {
    const hits = await hybridSearch("cancelaciones", {
      store: shared.store,
      embeddings: shared.provider,
    });

    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.name).toBe("politicas.md");
    expect(hits[0]?.text).toContain("Cambios y cancelaciones");
    expect(hits[0]?.heading).toBe("Cambios y cancelaciones");
    expect(hits[0]?.position).toBeGreaterThanOrEqual(0);
    expect(hits[0]?.score).toBeGreaterThan(0);
    expect(hits[0]?.text.length).toBeGreaterThan(20);
    expect(hits[0]?.text).toContain("Cambios y cancelaciones");
  });

  it("ranks a keyword-only match", async () => {
    const hits = await hybridSearch("taller", { store: shared.store, embeddings: shared.provider });
    const documents = hits.map((hit) => hit.name);

    expect(documents).toContain("horario.md");
  });

  it("ranks a meaning-only match with the fake provider", async () => {
    const hits = await hybridSearch("¿puedo mover mi cita a otro día?", {
      store: shared.store,
      embeddings: shared.provider,
    });

    expect(hits[0]?.name).toBe("politicas.md");
    expect(hits[0]?.text).toContain("Cambios y cancelaciones");
  });

  it("returns the top eight by default and no more than the limit", async () => {
    const hits = await hybridSearch("taller", { store: shared.store, embeddings: shared.provider });

    expect(hits.length).toBeLessThanOrEqual(8);

    const one = await hybridSearch("taller", {
      store: shared.store,
      embeddings: shared.provider,
      limit: 1,
    });

    expect(one).toHaveLength(1);
  });

  it("answers an empty store without failing", async () => {
    const empty = await openStore(join(workspace(), "empty.sqlite"));

    stores.push(empty);

    await expect(
      hybridSearch("horario", { store: empty, embeddings: shared.provider }),
    ).resolves.toEqual([]);
  });
});

describe("chunking", () => {
  it("keeps paragraphs together and carries the heading", () => {
    const text = [
      "# Horario",
      "",
      "Martes a viernes de 8:00 a 19:00.",
      "",
      "## Precios",
      "",
      "Espresso de 35 pesos.",
    ].join("\n");
    const passages = chunkText(text, { size: 200, overlap: 40 });

    expect(passages[0]?.heading).toBe("Horario");
    expect(passages[0]?.text).toContain("Martes a viernes");
    expect(passages.at(-1)?.heading).toBe("Precios");
    expect(passages.at(-1)?.position).toBe(passages.length - 1);
  });

  it("overlaps consecutive passages of a long paragraph", () => {
    const long = "palabra ".repeat(300);
    const passages = chunkText(long, { size: 800, overlap: 120 });

    expect(passages.length).toBeGreaterThan(2);
    expect(passages[0]?.text.length).toBeLessThanOrEqual(800);
    expect(passages[1]?.text).toContain(passages[0]?.text.slice(-120) ?? "");
    expect(passages[1]?.text).toContain(passages[0]?.text.slice(-60) ?? "");
  });

  it("uses about 800 characters with 120 of overlap by default", () => {
    const long = "frase de prueba ".repeat(200);
    const passages = chunkText(long);

    expect(passages[0]?.text.length).toBeLessThanOrEqual(800);
    expect(passages.length).toBeGreaterThan(2);
    expect(passages[1]?.text).toContain(passages[0]?.text.slice(-120) ?? "");
  });
});
