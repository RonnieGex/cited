// @vitest-environment node
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { embeddingsFrom } from "@/lib/embeddings/providers";
import { ingestPaths } from "@/lib/ingest";
import { sealSecret } from "@/lib/secrets";
import { hybridSearch } from "@/lib/search";
import { reindexStore } from "@/lib/settings/indexing";
import { embeddingsSignature, resolveEmbeddings } from "@/lib/settings/providers";
import { openStore, type Store } from "@/lib/store";
import { inputsOf, openAiEmbeddingsAnswer, providerDouble, type ProviderDouble } from "./provider-double";

// The MODIFIED requirements "Embeddings come from a configured provider" and "Hybrid search with rank fusion" of
// `specs/knowledge-search/spec.md`: the embeddings come from the panel or the server, keyword mode ranks with FTS5
// alone and stores no vectors, and a change of embeddings marks every passage for re-indexing until the owner
// re-indexes. No test calls a real provider.

const encryptionKey = randomBytes(32).toString("base64");
const roots: string[] = [];
const opened: Store[] = [];
const doubles: ProviderDouble[] = [];

const corpus = [
  "# Precios",
  "",
  "Una afinación de bicicleta cuesta 380 pesos.",
  "",
  "# Horarios",
  "",
  "Abrimos de martes a sábado, de nueve a siete.",
  "",
].join("\n");

async function freshStore(): Promise<Store> {
  const root = mkdtempSync(join(tmpdir(), "cited-index-"));
  const store = await openStore(join(root, "store.sqlite"));

  roots.push(root);
  opened.push(store);

  return store;
}

async function keywordPanel(store: Store): Promise<void> {
  await store.saveProviderSetting({
    kind: "embeddings",
    provider: "keyword",
    model: null,
    keyCiphertext: null,
    keyLast4: null,
    baseUrl: null,
    mode: "keyword",
    testedAt: "2026-09-29T10:00:00.000Z",
    testLatencyMs: null,
  });
}

async function ingestSample(store: Store, signature: string): Promise<number> {
  const root = mkdtempSync(join(tmpdir(), "cited-doc-"));
  const path = join(root, "cafe.md");

  roots.push(root);
  writeFileSync(path, corpus, "utf8");

  const report = await ingestPaths([path], { store, embeddings: null, signature });

  expect(report.failed).toEqual([]);
  expect(report.ingested[0]?.passages).toBeGreaterThan(1);

  return report.ingested[0]?.passages ?? 0;
}

afterAll(async () => {
  for (const store of opened) {
    store.close();
  }

  for (const double of doubles) {
    await double.close();
  }

  for (const root of roots) {
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

describe("keyword mode", () => {
  it("finds a passage by its words without calling any embeddings provider", async () => {
    const store = await freshStore();

    await keywordPanel(store);

    const resolution = await resolveEmbeddings({ environment: {}, store });
    const signature = embeddingsSignature(resolution);

    expect(resolution.mode).toBe("keyword");
    expect(embeddingsFrom(resolution)).toBeNull();

    await ingestSample(store, signature);

    const hits = await hybridSearch("¿Cuánto cuesta una afinación?", {
      store,
      embeddings: null,
    });

    expect(hits.map((hit) => hit.name)).toContain("cafe.md");
    expect(hits[0]?.text).toContain("380 pesos");
    expect(hits[0]?.heading).toBe("Precios");
    expect(await store.countVectorized()).toBe(0);
    expect(await store.countPassages()).toBeGreaterThan(0);
    expect(await store.countPassagesNeedingIndex(signature)).toBe(0);
  });

  it("names what is missing when neither the server nor the panel chose embeddings", async () => {
    const store = await freshStore();
    const resolution = await resolveEmbeddings({ environment: {}, store });

    expect(resolution.mode).toBe("none");
    expect(() => embeddingsFrom(resolution)).toThrowError(/EMBEDDINGS_PROVIDER/);
    expect(() => embeddingsFrom(resolution)).toThrowError(/panel/);
    expect(await store.countPassages()).toBe(0);
  });
});

describe("a change of embeddings", () => {
  it("marks every passage for re-indexing and re-indexes them on demand", async () => {
    const store = await freshStore();
    const seen = await providerDouble((request) => ({
      status: 200,
      body: openAiEmbeddingsAnswer(1536, inputsOf(request)),
    }));
    const sealed = sealSecret("sk-embeddings-0000000000004321", { ENCRYPTION_KEY: encryptionKey });

    doubles.push(seen);

    if (sealed.ok === false) {
      throw new Error("the seal failed");
    }

    await keywordPanel(store);

    const keyword = await resolveEmbeddings({ environment: {}, store });
    const passages = await ingestSample(store, embeddingsSignature(keyword));

    expect(await store.countPassagesNeedingIndex(embeddingsSignature(keyword))).toBe(0);

    await store.saveProviderSetting({
      kind: "embeddings",
      provider: "openai",
      model: "text-embedding-3-small",
      keyCiphertext: sealed.value,
      keyLast4: "4321",
      baseUrl: `${seen.url}/v1`,
      mode: null,
      testedAt: "2026-09-29T10:00:00.000Z",
      testLatencyMs: 80,
    });

    // The address of the panel is validated again and pinned on every call (task 11.2), so the resolution describes
    // an installation the product can write: the gateway of OpenAI points at the double and local providers are
    // allowed, which is the flag of a provider on the machine of the owner.
    const vectors = await resolveEmbeddings({
      environment: {
        ENCRYPTION_KEY: encryptionKey,
        OPENAI_BASE_URL: `${seen.url}/v1`,
        ALLOW_LOCAL_PROVIDERS: "1",
      },
      store,
    });
    const signature = embeddingsSignature(vectors);

    expect(vectors.mode).toBe("vectors");
    expect(await store.countPassagesNeedingIndex(signature)).toBe(passages);
    expect(seen.requests).toEqual([]);

    const reindexed = await reindexStore(store, embeddingsFrom(vectors), signature);

    expect(reindexed.passages).toBe(passages);
    expect(reindexed.documents).toBe(1);
    expect(await store.countVectorized()).toBe(passages);
    expect(await store.countPassagesNeedingIndex(signature)).toBe(0);
    expect(seen.requests.length).toBeGreaterThan(0);
    expect(seen.requests[0]?.path).toBe("/v1/embeddings");

    const hits = await hybridSearch("¿Cuánto cuesta una afinación?", {
      store,
      embeddings: embeddingsFrom(vectors),
    });

    expect(hits[0]?.text).toContain("380 pesos");
  });

  it("re-indexes into keyword mode without storing a vector", async () => {
    const store = await freshStore();

    await keywordPanel(store);

    const resolution = await resolveEmbeddings({ environment: {}, store });
    const signature = embeddingsSignature(resolution);

    await ingestSample(store, signature);

    const reindexed = await reindexStore(store, null, signature);

    expect(reindexed.passages).toBeGreaterThan(0);
    expect(await store.countVectorized()).toBe(0);
    expect(await store.countPassagesNeedingIndex(signature)).toBe(0);
  });
});
