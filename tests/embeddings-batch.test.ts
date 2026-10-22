import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
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
function documentOf(count: number, name = "manual.md"): string {
  counter += 1;

  const folder = join(root, `case-${counter}`);

  mkdirSync(folder, { recursive: true });

  const path = join(folder, name);
  const paragraphs = Array.from(
    { length: count },
    (_, index) => `${name} paragraph ${index + 1}. ${"word ".repeat(120)}`.trim(),
  );

  writeFileSync(path, paragraphs.join("\n\n"));

  return path;
}

async function openCase(): Promise<{ store: Store; path: string }> {
  const path = join(root, `store-${counter}-${Date.now()}.sqlite`);
  const opened = await openStore(path);

  stores.push(opened);

  return { store: opened, path };
}

/**
 * Every stored vector, read back from the file as the raw float32 bytes libSQL keeps in the `F32_BLOB` column, must be
 * the vector of its own text: a request that came back out of order, or a batch stored one slot off, fails here.
 */
async function expectEveryVectorToBeItsTexts(path: string, expected: number): Promise<void> {
  const fake = createFakeEmbeddings();
  const database = new DatabaseSync(path, { readOnly: true });

  try {
    const rows = database
      .prepare("SELECT text, embedding FROM passages ORDER BY id")
      .all() as Array<{ text: string; embedding: Uint8Array }>;

    expect(rows).toHaveLength(expected);

    for (const row of rows) {
      const stored = Array.from(
        new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / 4),
      );
      const [vector] = await fake.embed([row.text]);

      expect(stored).toHaveLength(vector?.length ?? -1);

      for (const [slot, value] of stored.entries()) {
        expect(Math.abs(value - (vector?.[slot] ?? Number.NaN)), `${row.text.slice(0, 32)} slot ${slot}`).toBeLessThan(1e-6);
      }
    }
  } finally {
    database.close();
  }
}

type ConsoleSpy = { mock: { calls: unknown[][] } };

/** The first output of the console that mentions `value`, or `undefined` when nothing did. */
function consoleMentions(spies: ConsoleSpy[], value: string): string | undefined {
  return spies
    .flatMap((spy) => spy.mock.calls)
    .map((call) => call.map((argument: unknown) => String(argument)).join(" "))
    .find((line) => line.includes(value));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

afterAll(async () => {
  for (const opened of stores) {
    opened.close();
  }

  // Windows keeps a closed libSQL file busy for a while after `close()`; the removal is retried the way
  // `tests/ingest.test.ts` does, for a bounded time, and a folder left behind is said out loud with its path instead
  // of being swallowed: the suite stays green on that platform and the leftover is visible in the output.
  let lastError: unknown;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });

      return;
    } catch (error) {
      lastError = error;
      await new Promise((wake) => setTimeout(wake, 300));
    }
  }

  console.warn(`embeddings-batch: the temporary folder ${root} could not be removed: ${String(lastError)}`);
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
    const { store, path } = await openCase();
    const report = await ingestPaths([documentOf(40)], { store, embeddings: provider });

    expect(report.failed).toEqual([]);
    expect(provider.sizes).toEqual([32, 8]);

    const passages = await store.getPassages({ name: "manual.md", limit: 100 });

    expect(passages).toHaveLength(40);
    expect(provider.texts).toEqual(passages.map((passage) => passage.text));
    await expectEveryVectorToBeItsTexts(path, 40);
  });

  it("sends requests of at most EMBEDDINGS_BATCH texts and stores a vector for every passage", async () => {
    vi.stubEnv("EMBEDDINGS_BATCH", "16");

    const provider = recordingProvider();
    const { store, path } = await openCase();
    const report = await ingestPaths([documentOf(40)], { store, embeddings: provider });

    expect(report.failed).toEqual([]);
    expect(provider.sizes).toEqual([16, 16, 8]);
    await expect(store.countPassages()).resolves.toBe(40);
    await expect(store.countVectorized()).resolves.toBe(40);
    await expectEveryVectorToBeItsTexts(path, 40);
  });

  it.each([
    ["1", new Array<number>(47).fill(1)],
    ["16", [16, 16, 15]],
  ])(
    "keeps every vector with its own passage across two documents and the batch boundaries, with EMBEDDINGS_BATCH=%s",
    async (value, sizes) => {
      vi.stubEnv("EMBEDDINGS_BATCH", value);

      const provider = recordingProvider();
      const { store, path } = await openCase();
      const report = await ingestPaths([documentOf(40, "first.md"), documentOf(7, "second.md")], {
        store,
        embeddings: provider,
      });

      expect(report.failed).toEqual([]);
      expect(provider.sizes).toEqual(sizes);
      await expect(store.countPassages({ name: "first.md" })).resolves.toBe(40);
      await expect(store.countPassages({ name: "second.md" })).resolves.toBe(7);
      await expectEveryVectorToBeItsTexts(path, 47);
    },
  );

  it.each(["0", "-8", "2.5", "abc", ""])("falls back to 32 for %j and says nothing about it", async (value) => {
    vi.stubEnv("EMBEDDINGS_BATCH", value);

    const spies = [
      vi.spyOn(console, "log").mockImplementation(() => undefined),
      vi.spyOn(console, "info").mockImplementation(() => undefined),
      vi.spyOn(console, "warn").mockImplementation(() => undefined),
      vi.spyOn(console, "error").mockImplementation(() => undefined),
    ];
    const provider = recordingProvider();
    const { store } = await openCase();

    await ingestPaths([documentOf(40)], { store, embeddings: provider });

    expect(provider.sizes).toEqual([32, 8]);
    expect(consoleMentions(spies, "EMBEDDINGS_BATCH")).toBeUndefined();

    if (value.trim() !== "") {
      expect(consoleMentions(spies, value)).toBeUndefined();
    }
  });
});

describe("the re-index", () => {
  it("obeys the same value and keeps every vector with its own passage", async () => {
    const { store, path } = await openCase();

    await ingestPaths([documentOf(40)], { store, embeddings: createFakeEmbeddings() });

    vi.stubEnv("EMBEDDINGS_BATCH", "4");

    const provider = recordingProvider();
    const reindexed = await reindexStore(store, provider, "fake:test");

    expect(reindexed).toEqual({ documents: 1, passages: 40 });
    expect(provider.sizes).toEqual(new Array<number>(10).fill(4));

    const passages = await store.getPassages({ name: "manual.md", limit: 100 });

    expect(provider.texts).toEqual(passages.map((passage) => passage.text));
    await expectEveryVectorToBeItsTexts(path, 40);
  });

  it("re-indexes two documents one request at a time with EMBEDDINGS_BATCH=1", async () => {
    const { store, path } = await openCase();

    await ingestPaths([documentOf(40, "first.md"), documentOf(7, "second.md")], {
      store,
      embeddings: createFakeEmbeddings(),
    });

    vi.stubEnv("EMBEDDINGS_BATCH", "1");

    const provider = recordingProvider();
    const reindexed = await reindexStore(store, provider, "fake:test");

    expect(reindexed).toEqual({ documents: 2, passages: 47 });
    expect(provider.sizes).toEqual(new Array<number>(47).fill(1));
    await expectEveryVectorToBeItsTexts(path, 47);
  });
});

describe("the documentation of EMBEDDINGS_BATCH", () => {
  const readme = readFileSync(join(import.meta.dirname, "..", "README.md"), "utf8");
  const spanish = readFileSync(join(import.meta.dirname, "..", "README.es.md"), "utf8");
  const template = readFileSync(join(import.meta.dirname, "..", ".env.example"), "utf8");

  function rowOf(text: string): string[] {
    const line = text.split("\n").find((candidate) => candidate.startsWith("| `EMBEDDINGS_BATCH` |"));

    expect(line, "the configuration table carries the row").toBeDefined();

    return (line ?? "")
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
  }

  it("is a row of both configuration tables, read today, with its default and its fallback", () => {
    const english = rowOf(readme);
    const row = rowOf(spanish);

    expect(english[2]).toBe("yes");
    expect(row[2]).toBe("sí");

    for (const purpose of [english[1] ?? "", row[1] ?? ""]) {
      expect(purpose).toContain("32");
      expect(purpose).toContain("16");
    }

    expect(english[1]).toMatch(/not a positive integer keeps 32/);
    expect(row[1]).toMatch(/no sea un entero positivo conserva 32/);
  });

  it("is in the template, empty, next to the other embeddings variables", () => {
    expect(template).toMatch(/^EMBEDDINGS_BATCH=$/m);
    expect(template).toMatch(/EMBEDDINGS_BATCH is how many texts one request to the provider carries, 32 by default/);
  });
});
