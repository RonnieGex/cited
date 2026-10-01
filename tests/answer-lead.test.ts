// Requirement "A citation says where its own words start" of the delta `answering` (decision 4 of `design.md`): each
// citation of `POST /api/ask` carries `lead`, the length of the repeated words at its start, and `extractCitations`
// stays pure. `askQuestion` adds it from the passage at `position - 1` of the same document, which the helper reads
// from the store.

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { askQuestion } from "@/lib/answer/ask";
import { citationsWithLead, leadOf } from "@/lib/answer/lead";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import { ingestFolder } from "@/lib/ingest";
import { createFakeChatModel } from "@/lib/models/fake";
import { hybridSearch } from "@/lib/search";
import { openStore, type Store } from "@/lib/store";

const roots: string[] = [];
const stores: Store[] = [];
const embeddings = createFakeEmbeddings();
const repetition = "cambio de cámara: pesos ";
const longParagraph = repetition.repeat(24).trim();

const fields = (citation: { n: number; document: string; heading: string | null; position: number; excerpt: string }) => ({
  n: citation.n,
  document: citation.document,
  heading: citation.heading,
  position: citation.position,
  excerpt: citation.excerpt,
});

function workspace(): string {
  const root = mkdtempSync(join(tmpdir(), "katalis-lead-"));

  roots.push(root);

  return root;
}

async function storeWith(name: string, text: string): Promise<Store> {
  const root = workspace();

  writeFileSync(join(root, name), text);

  const store = await openStore(join(root, "store.sqlite"));

  stores.push(store);

  await ingestFolder(root, { store, embeddings, limits: { maxBytes: 1024 * 1024, maxPages: 10 } });

  return store;
}

beforeAll(() => {
  expect(longParagraph.length).toBeGreaterThan(800);
});

afterAll(async () => {
  for (const store of stores) {
    store.close();
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

describe("leadOf", () => {
  it("reads the passage at position - 1 of the same document", async () => {
    const store = await storeWith("precios.md", `# Precios\n\n${longParagraph}`);
    const passages = await store.getPassages({ name: "precios.md" });
    const first = passages[0];
    const second = passages[1];

    expect(passages.length).toBeGreaterThanOrEqual(2);
    expect(first?.text.startsWith("Precios")).toBe(true);

    const tail = (first?.text ?? "").slice(-120);
    const boundary = tail.search(/\s/);
    const repeated = boundary === -1 ? tail : tail.slice(boundary + 1).trimEnd();

    expect(second?.text.startsWith(repeated)).toBe(true);
    expect(await leadOf(store, "precios.md", 1, second?.text ?? "")).toBe(repeated.length);
  });

  it("is zero for the first passage of a section and for a passage with no neighbour", async () => {
    const store = await storeWith("precios.md", `# Precios\n\n${longParagraph}`);

    expect(await leadOf(store, "precios.md", 0, "Precios algo.")).toBe(0);
    expect(await leadOf(store, "otro.md", 1, "Un texto.")).toBe(0);
  });
});

describe("the citations of an answer carry the lead of their passage", () => {
  it("carries the length of the repeated words for a passage that continues the one before it", async () => {
    const store = await storeWith("precios.md", `# Precios\n\n${longParagraph}`);
    const passages = await store.getPassages({ name: "precios.md" });
    const second = passages[1];
    const search = await hybridSearch("cambio de cámara", { store, embeddings });
    const repeated = (passages[0]?.text ?? "").slice(-120);
    const boundary = repeated.search(/\s/);
    const lead = boundary === -1 ? repeated : repeated.slice(boundary + 1).trimEnd();
    const { outcome } = await ask(store, "cambio de cámara pesos", "El cambio cuesta 120 pesos [1].");

    expect(passages.length).toBeGreaterThanOrEqual(2);
    expect(search[0]?.position, "the search finds the passage that repeats the words").toBe(1);

    expect(outcome.status).toBe("answered");

    if (outcome.status !== "answered") {
      return;
    }

    const citation = outcome.citations[0];

    expect(citation?.position).toBe(1);
    expect(citation?.excerpt).toBe(second?.text);
    expect(citation?.lead).toBe(lead.length);
    expect(citation?.excerpt.slice(lead.length).startsWith("cambio")).toBe(true);
  });

  it("carries zero for the first passage of a section, and names no other field", () => {
    const hits = [
      {
        passageId: 1,
        name: "cafe-la-horquilla.md",
        heading: "Precios",
        position: 2,
        text: "Precios - Espresso: 35 pesos.",
        score: 0.03,
      },
    ];
    const [citation] = citationsWithLead(
      [{ n: 1, document: "cafe-la-horquilla.md", heading: "Precios", position: 2, excerpt: hits[0]?.text ?? "" }],
      hits,
    );

    expect(citation?.lead).toBe(0);
    expect(Object.keys(citation ?? {}).sort()).toEqual(["document", "excerpt", "heading", "lead", "n", "position"]);
  });

  it("keeps the fields of a citation of the store as they are read", () => {
    const citations = citationsWithLead([], []);

    expect(citations).toEqual([]);
    expect(fields({ n: 1, document: "uno.md", heading: null, position: 0, excerpt: "Uno." })).toEqual({
      n: 1,
      document: "uno.md",
      heading: null,
      position: 0,
      excerpt: "Uno.",
    });
  });
});

async function ask(
  store: Store,
  question: string,
  reply: string,
): Promise<{ outcome: Awaited<ReturnType<typeof askQuestion>> }> {
  const outcome = await askQuestion({
    question,
    store,
    embeddings,
    model: createFakeChatModel({ reply }),
    environment: {},
    ip: "203.0.113.7",
  });

  return { outcome };
}
