// Requirement "A citation says where its own words start" of the delta `answering` (decision 4 of `design.md`): each
// citation of `POST /api/ask` carries `lead`, the length of the repeated words at its start, and `extractCitations`
// stays pure. `askQuestion` adds it from the passage at `position - 1` of the same document, which the helper reads
// from the store.

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { askQuestion } from "@/lib/answer/ask";
import { citationsWithLeadFromPassages, citationsWithLeadFromStore, leadLength, leadOf } from "@/lib/answer/lead";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import { ingestFolder } from "@/lib/ingest";
import { createFakeChatModel } from "@/lib/models/fake";
import { openStore, type Store } from "@/lib/store";

const roots: string[] = [];
const stores: Store[] = [];
const embeddings = createFakeEmbeddings();
const repetition = "cambio de cámara: pesos ";
const longParagraph = repetition.repeat(40).trim();

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

async function ask(
  store: Store,
  question: string,
  reply: string,
): Promise<Awaited<ReturnType<typeof askQuestion>>> {
  return askQuestion({
    question,
    store,
    embeddings,
    model: createFakeChatModel({ reply }),
    environment: {},
    ip: "203.0.113.7",
  });
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
    // The heading is a passage of its own, so the text that continues is the one at position 2 and the passage before
    // it is the one at position 1.
    const head = passages[0];
    const first = passages[1];
    const second = passages[2];
    const tail = (first?.text ?? "").slice(-120);
    const boundary = tail.search(/\s/);
    const carried = boundary === -1 ? tail : tail.slice(boundary + 1).trimEnd();
    const repeated = carried.trimEnd();

    expect(passages.length).toBeGreaterThanOrEqual(3);
    expect(head?.text).toBe("Precios");
    expect(second?.text.startsWith(repeated)).toBe(true);
    // The chunker joins the carry to what comes before it, so the body may repeat the carry without its last space:
    // the lead is the length of the repeated words, and the first own word starts after them.
    expect(await leadOf(store, "precios.md", 2, second?.text ?? "")).toBe(leadLength(first?.text, second?.text ?? ""));
    expect(repeated.length).toBeGreaterThan(100);
  });

  it("is zero for the first passage of a section and for a passage with no neighbour", async () => {
    const store = await storeWith("precios.md", `# Precios\n\n${longParagraph}`);

    // Position 0 is the heading, which no passage follows in the same section: the chunker resets the overlap when the
    // heading changes, so its own text repeats nothing.
    expect(await leadOf(store, "precios.md", 0, "Precios algo.")).toBe(0);
    expect(await leadOf(store, "otro.md", 1, "Un texto.")).toBe(0);
  });
});

describe("the citations of an answer carry the lead of their passage", () => {
  it("carries the length of the repeated words for a passage that continues the one before it", async () => {
    // A section whose first block is longer than the window of the chunker: the block is cut, and the passage that
    // follows repeats the tail of the one before it.
    const first = "palabra ".repeat(24).trim();
    const second = `${"consulta ".repeat(80).trim()} pesos cambio de cámara: 120 pesos.`;
    const store = await storeWith(
      "largos.md",
      `# Precios\n\n${"palabra ".repeat(100).trim()}\n\n# Cambio\n\n${first}\n\n${second}`,
    );
    const passages = await store.getPassages({ name: "largos.md" });
    const continues = passages[4];
    const carried = leadLength(passages[3]?.text, continues?.text ?? "");
    const ranked: Store = {
      ...store,
      keywordSearch: async () => [{ passageId: continues?.id ?? 0, rank: 0, score: 1 }],
      vectorSearch: async () => [],
    };
    const outcome = await ask(ranked, "consulta cambio de cámara", "El cambio cuesta 120 pesos [1].");

    expect(passages.length).toBe(5);
    expect(carried).toBeGreaterThan(0);
    expect((continues?.text ?? "").slice(carried)).toContain("pesos cambio de cámara");

    if (outcome.status !== "answered") {
      throw new Error(`the answer was ${outcome.status}`);
    }

    const cited = outcome.citations[0];

    expect(cited?.position).toBe(continues?.position);
    expect(cited?.excerpt).toBe(continues?.text);
    expect(cited?.lead).toBe(carried);
    expect(cited?.excerpt.slice(cited.lead)).toContain("pesos cambio de cámara");
  }, 30_000);

  it("carries zero for the first passage of a section, and names no other field", async () => {
    const store = await storeWith("cafe-la-horquilla.md", "# Precios\n\nEspresso: 35 pesos.");
    const passages = await store.getPassages({ name: "cafe-la-horquilla.md" });
    const body = passages[1];
    const citations = await citationsWithLeadFromStore(store, [
      {
        n: 1,
        document: "cafe-la-horquilla.md",
        heading: "Precios",
        position: 1,
        excerpt: body?.text ?? "",
        lead: 0,
      },
    ]);

    // The passage at position 0 is the heading, which the chunker stores as a passage of its own: the first passage of
    // the section repeats nothing of it, so the chunker reset the overlap when the heading changed.
    expect(citations[0]?.lead).toBe(0);
    expect(Object.keys(citations[0] ?? {}).sort()).toEqual([
      "document",
      "excerpt",
      "heading",
      "lead",
      "n",
      "position",
    ]);
  });

  it("keeps the text and the length of the passage of a document the store holds", async () => {
    const body = "pesos cambio de cámara: 120 pesos.";
    const citations = citationsWithLeadFromPassages(
      [
        { n: 1, document: "uno.md", heading: null, position: 2, excerpt: body, lead: 0 },
        { n: 2, document: "uno.md", heading: null, position: 1, excerpt: "El primero.", lead: 0 },
      ],
      [
        // The carry of the chunker: the passage before the excerpt ends with the words it repeats.
        { name: "uno.md", position: 1, text: "El precio es 120 pesos" },
        { name: "uno.md", position: 2, text: body },
      ],
    );
    const store = await storeWith("vacio.md", "# Nada\n\nUn texto sin repeticiones.");

    expect(citations[0]?.lead).toBe("pesos".length);
    expect(citations[1]?.lead).toBe(0);
    await expect(citationsWithLeadFromStore(store, [])).resolves.toEqual([]);
  });
});
