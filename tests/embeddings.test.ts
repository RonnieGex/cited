import { createServer, type Server } from "node:http";
import { afterAll, describe, expect, it } from "vitest";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import { resolveEmbeddingsProvider } from "@/lib/embeddings/providers";

type Recorded = { path: string; authorization: string; body: string };

const recorded: Recorded[] = [];
let server: Server | null = null;
let baseUrl = "";

async function recordedProvider(): Promise<ReturnType<typeof resolveEmbeddingsProvider>> {
  server = createServer((request, answer) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      recorded.push({
        path: request.url ?? "",
        authorization: String(request.headers["authorization"] ?? ""),
        body: Buffer.concat(chunks).toString("utf8"),
      });

      answer.writeHead(200, { "content-type": "application/json" });
      answer.end(
        JSON.stringify({ data: [{ embedding: [0.5, 0.5, 0.5, 0.5], index: 0 }] }),
      );
    });
  });

  await new Promise<void>((ready) => server?.listen(0, "127.0.0.1", ready));

  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;

  baseUrl = `http://127.0.0.1:${port}/v1`;

  return resolveEmbeddingsProvider({
    EMBEDDINGS_PROVIDER: "openai",
    EMBEDDINGS_BASE_URL: baseUrl,
    EMBEDDINGS_MODEL: "small-embedding",
    EMBEDDINGS_API_KEY: "test-key",
    EMBEDDINGS_DIMENSIONS: "4",
  });
}

afterAll(async () => {
  if (server !== null) {
    await new Promise<void>((closed) => server?.close(() => closed()));
  }
});

describe("the OpenAI-compatible provider against a recorded answer", () => {
  it("posts to /embeddings with the key in the header and reads the vector", async () => {
    const provider = await recordedProvider();
    const vectors = await provider.embed(["¿Cuánto cuesta la afinación?"]);
    const [call] = recorded;

    expect(baseUrl).toContain("127.0.0.1");
    expect(provider.dimensions).toBe(4);
    expect(vectors[0]).toEqual([0.5, 0.5, 0.5, 0.5]);
    expect(call?.path).toBe("/v1/embeddings");
    expect(call?.authorization).toBe("Bearer test-key");
    expect(call?.body).toContain("small-embedding");
    expect(call?.body).toContain("afinación");
  });

  it("names the status when the answer is an error", async () => {
    server = createServer((_request, answer) => {
      answer.writeHead(500, { "content-type": "application/json" });
      answer.end("{}");
    });

    await new Promise<void>((ready) => server?.listen(0, "127.0.0.1", ready));

    const address = server.address();
    const port = typeof address === "object" && address !== null ? address.port : 0;
    const provider = resolveEmbeddingsProvider({
      EMBEDDINGS_PROVIDER: "openai",
      EMBEDDINGS_BASE_URL: `http://127.0.0.1:${port}/v1`,
      EMBEDDINGS_MODEL: "small-embedding",
      EMBEDDINGS_API_KEY: "test-key",
    });

    await expect(provider.embed(["hola"])).rejects.toThrowError(/500/);
  });
});

describe("the fake provider", () => {
  it("is deterministic and normalized", async () => {
    const provider = createFakeEmbeddings();
    const [first] = await provider.embed(["the workshop opens at nine"]);
    const [again] = await provider.embed(["the workshop opens at nine"]);
    const length = Math.hypot(...(first ?? []));

    expect(provider.dimensions).toBe(64);
    expect(first).toEqual(again);
    expect(first).toHaveLength(provider.dimensions);
    expect(length).toBeCloseTo(1, 6);
  });

  it("places a paraphrase closer than an unrelated text", async () => {
    const provider = createFakeEmbeddings();
    const [question, paraphrase, unrelated] = await provider.embed([
      "aceptan tarjeta de credito",
      "Formas de pago: efectivo, tarjeta de débito y crédito.",
      "Martes a viernes: 8:00 a 19:00.",
    ]);

    const distance = (left: number[] = [], right: number[] = []): number =>
      1 - left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);

    expect(distance(question, paraphrase)).toBeLessThan(distance(question, unrelated));
  });

  it("answers an empty list without calling anything", async () => {
    const provider = createFakeEmbeddings();

    await expect(provider.embed([])).resolves.toEqual([]);
  });
});

describe("the provider factory", () => {
  it("stops on a missing key and names the variable", () => {
    expect(() =>
      resolveEmbeddingsProvider({
        EMBEDDINGS_PROVIDER: "openai",
        EMBEDDINGS_BASE_URL: "https://embeddings.invalid/v1",
        EMBEDDINGS_MODEL: "small-embedding",
        EMBEDDINGS_API_KEY: "",
      }),
    ).toThrowError(/EMBEDDINGS_API_KEY/);
  });

  it("stops on a missing model and names the variable", () => {
    expect(() =>
      resolveEmbeddingsProvider({
        EMBEDDINGS_PROVIDER: "openai",
        EMBEDDINGS_BASE_URL: "https://embeddings.invalid/v1",
        EMBEDDINGS_MODEL: "",
        EMBEDDINGS_API_KEY: "test-key",
      }),
    ).toThrowError(/EMBEDDINGS_MODEL/);
  });

  it("does not print the value of the key", () => {
    try {
      resolveEmbeddingsProvider({
        EMBEDDINGS_PROVIDER: "openai",
        EMBEDDINGS_BASE_URL: "https://embeddings.invalid/v1",
        EMBEDDINGS_MODEL: "small-embedding",
        EMBEDDINGS_API_KEY: "",
      });

      throw new Error("the factory accepted an empty key");
    } catch (error) {
      expect((error as Error).message).not.toContain("test-key");
    }
  });

  it("builds the OpenAI-compatible provider from the environment", () => {
    const provider = resolveEmbeddingsProvider({
      EMBEDDINGS_PROVIDER: "openai",
      EMBEDDINGS_BASE_URL: "https://embeddings.invalid/v1",
      EMBEDDINGS_MODEL: "small-embedding",
      EMBEDDINGS_API_KEY: "test-key",
    });

    expect(provider.dimensions).toBe(1536);
    expect(typeof provider.embed).toBe("function");
  });

  it("builds the Ollama provider from the environment", () => {
    const provider = resolveEmbeddingsProvider({
      EMBEDDINGS_PROVIDER: "ollama",
      OLLAMA_BASE_URL: "http://localhost:11434",
      EMBEDDINGS_MODEL: "nomic-embed-text",
    });

    expect(provider.dimensions).toBe(768);
  });

  it("stops on an unknown provider and lists the accepted names", () => {
    expect(() => resolveEmbeddingsProvider({ EMBEDDINGS_PROVIDER: "something-else" })).toThrowError(
      /openai, ollama, fake/,
    );
  });

  it("builds the fake provider for a test run", () => {
    const provider = resolveEmbeddingsProvider({ EMBEDDINGS_PROVIDER: "fake" });

    expect(provider.dimensions).toBe(64);
  });
});
