import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_EMBEDDINGS_BATCH, resolveEmbeddingsBatch } from "@/lib/embeddings/batch";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import type { EmbeddingProvider } from "@/lib/embeddings/types";
import { ingestPaths } from "@/lib/ingest";
import { reindexStore } from "@/lib/settings/indexing";
import { openStore, type Store } from "@/lib/store";

// `EMBEDDINGS_BATCH` is how many texts one request to the embeddings provider carries. Some OpenAI-compatible
// services accept fewer than 32 (Text Embeddings Inference accepts 16), so the owner can lower it; a value that is
// not a positive integer keeps the default, like every other limit of the environment.

const root = mkdtempSync(join(tmpdir(), "katalis-embeddings-batch-"));
const stores: Store[] = [];
let counter = 0;

/** A provider that records the size and the texts of every request and answers like the fake one. */
function recordingProvider(): EmbeddingProvider & { sizes: number[]; texts: string[] } {
  const fake = createFakeEmbeddings();
  const sizes: number[] = [];
  const texts: string[] = [];

  return {
    sizes,
    texts,
    dimensions: fake.dimensions,
    async embed(batch: string[]): Promise<number[][]> {
      sizes.push(batch.length);
      texts.push(...batch);

      return fake.embed(batch);
    },
    embedQuery: (text: string) => fake.embedQuery(text),
  };
}

/** A Markdown document of exactly `count` passages: one long paragraph each, so the chunker keeps them apart. */
function documentOf(count: number): string {
  counter += 1;

  const folder = join(root, `case-${counter}`);

  mkdirSync(folder, { recursive: true });

  const path = join(folder, "manual.md");
  const paragraphs = Array.from(
    { length: count },
    (_, index) => `Paragraph ${index + 1}. ${"word ".repeat(120)}`.trim(),
  );

  writeFileSync(path, paragraphs.join("\n\n"));

  return path;
}

async function store(): Promise<Store> {
  const opened = await openStore(join(root, `store-${counter}-${Date.now()}.sqlite`));

  stores.push(opened);

  return opened;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(async () => {
  for (const opened of stores) {
    opened.close();
  }

  // Windows keeps a closed SQLite file busy for a moment; the removal is retried the way `tests/ingest.test.ts` does.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });

      return;
    } catch {
      await new Promise((wake) => setTimeout(wake, 300));
    }
  }
});

describe("the rule of EMBEDDINGS_BATCH", () => {
  it("is 32 when the variable is absent", () => {
    expect(DEFAULT_EMBEDDINGS_BATCH).toBe(32);
    expect(resolveEmbeddingsBatch({})).toBe(32);
    expect(resolveEmbeddingsBatch({ EMBEDDINGS_BATCH: undefined })).toBe(32);
  });

  it("takes a positive integer", () => {
    expect(resolveEmbeddingsBatch({ EMBEDDINGS_BATCH: "16" })).toBe(16);
    expect(resolveEmbeddingsBatch({ EMBEDDINGS_BATCH: "4" })).toBe(4);
    expect(resolveEmbeddingsBatch({ EMBEDDINGS_BATCH: " 8 " })).toBe(8);
    expect(resolveEmbeddingsBatch({ EMBEDDINGS_BATCH: "1" })).toBe(1);
  });

  it.each(["", "   ", "0", "-8", "2.5", "abc", "16 texts", "NaN", "Infinity"])(
    "keeps 32 for %j, which is not a positive integer",
    (value) => {
      expect(resolveEmbeddingsBatch({ EMBEDDINGS_BATCH: value })).toBe(32);
    },
  );

  it("reads process.env when no environment is given", () => {
    vi.stubEnv("EMBEDDINGS_BATCH", "6");

    expect(resolveEmbeddingsBatch()).toBe(6);
  });
});

describe("the ingestion", () => {
  it("sends requests of 32 texts, in order, when the variable is absent", async () => {
    vi.stubEnv("EMBEDDINGS_BATCH", undefined);

    const provider = recordingProvider();
    const opened = await store();
    const report = await ingestPaths([documentOf(40)], { store: opened, embeddings: provider });

    expect(report.failed).toEqual([]);
    expect(provider.sizes).toEqual([32, 8]);

    const passages = await opened.getPassages({ name: "manual.md", limit: 100 });

    expect(passages).toHaveLength(40);
    expect(provider.texts).toEqual(passages.map((passage) => passage.text));
  });

  it("sends requests of at most EMBEDDINGS_BATCH texts and stores a vector for every passage", async () => {
    vi.stubEnv("EMBEDDINGS_BATCH", "16");

    const provider = recordingProvider();
    const opened = await store();
    const report = await ingestPaths([documentOf(40)], { store: opened, embeddings: provider });

    expect(report.failed).toEqual([]);
    expect(provider.sizes).toEqual([16, 16, 8]);
    await expect(opened.countPassages()).resolves.toBe(40);
    await expect(opened.countVectorized()).resolves.toBe(40);
  });

  it.each(["0", "-8", "2.5", "abc", ""])("falls back to 32 for %j", async (value) => {
    vi.stubEnv("EMBEDDINGS_BATCH", value);

    const provider = recordingProvider();
    const opened = await store();

    await ingestPaths([documentOf(40)], { store: opened, embeddings: provider });

    expect(provider.sizes).toEqual([32, 8]);
  });
});

describe("the re-index", () => {
  it("obeys the same value", async () => {
    const opened = await store();

    await ingestPaths([documentOf(40)], { store: opened, embeddings: createFakeEmbeddings() });

    vi.stubEnv("EMBEDDINGS_BATCH", "4");

    const provider = recordingProvider();
    const reindexed = await reindexStore(opened, provider, "fake:test");

    expect(reindexed).toEqual({ documents: 1, passages: 40 });
    expect(provider.sizes).toEqual(new Array<number>(10).fill(4));

    const passages = await opened.getPassages({ name: "manual.md", limit: 100 });

    expect(provider.texts).toEqual(passages.map((passage) => passage.text));
  });
});
