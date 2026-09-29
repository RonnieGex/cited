import { createFakeEmbeddings } from "./fake.ts";
import type { EmbeddingEnvironment, EmbeddingProvider, EmbeddingProviderName } from "./types.ts";
import { DEFAULT_EMBEDDING_DIMENSIONS, EMBEDDING_PROVIDER_NAMES } from "./types.ts";

const requestTimeoutMs = 30_000;

function required(
  environment: EmbeddingEnvironment,
  name: string,
  provider: EmbeddingProviderName,
): string {
  const value = environment[name]?.trim() ?? "";

  if (value.length === 0) {
    throw new Error(
      `The ${provider} embeddings provider needs ${name}. Fill it in the environment of the server; an empty value is an absent value.`,
    );
  }

  return value;
}

function dimensionsFrom(environment: EmbeddingEnvironment, fallback: number): number {
  const declared = Number(environment["EMBEDDINGS_DIMENSIONS"] ?? "");

  return Number.isInteger(declared) && declared > 0 ? declared : fallback;
}

type EmbeddingResponse = { data?: Array<{ embedding?: number[]; index?: number }> };

async function post(url: string, body: unknown, headers: Record<string, string>): Promise<number[][]> {
  const answer = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  if (!answer.ok) {
    throw new Error(`The embeddings provider answered ${answer.status}.`);
  }

  const parsed = (await answer.json()) as EmbeddingResponse;
  const vectors = parsed.data ?? [];

  if (vectors.length === 0) {
    throw new Error("The embeddings provider answered without vectors.");
  }

  return vectors.map((entry) => entry.embedding ?? []);
}

function openAiCompatible(environment: EmbeddingEnvironment): EmbeddingProvider {
  const baseUrl = required(environment, "EMBEDDINGS_BASE_URL", "openai").replace(/\/+$/, "");
  const model = required(environment, "EMBEDDINGS_MODEL", "openai");
  const apiKey = required(environment, "EMBEDDINGS_API_KEY", "openai");
  const dimensions = dimensionsFrom(environment, DEFAULT_EMBEDDING_DIMENSIONS.openai);
  const url = `${baseUrl}/embeddings`;

  const embed = async (texts: string[]): Promise<number[][]> => {
    if (texts.length === 0) {
      return [];
    }

    return post(url, { model, input: texts }, { authorization: `Bearer ${apiKey}` });
  };

  return {
    dimensions,
    embed,
    async embedQuery(text: string): Promise<number[]> {
      const [vector] = await embed([text]);

      return vector ?? [];
    },
  };
}

type OllamaResponse = { embeddings?: number[][] };

function ollama(environment: EmbeddingEnvironment): EmbeddingProvider {
  const baseUrl = (environment["OLLAMA_BASE_URL"]?.trim() || "http://localhost:11434").replace(
    /\/+$/,
    "",
  );
  const model = required(environment, "EMBEDDINGS_MODEL", "ollama");
  const dimensions = dimensionsFrom(environment, DEFAULT_EMBEDDING_DIMENSIONS.ollama);
  const url = `${baseUrl}/api/embed`;

  const embed = async (texts: string[]): Promise<number[][]> => {
    if (texts.length === 0) {
      return [];
    }

    const answer = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, input: texts }),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    if (!answer.ok) {
      throw new Error(`The Ollama server answered ${answer.status}.`);
    }

    const parsed = (await answer.json()) as OllamaResponse;

    return parsed.embeddings ?? [];
  };

  return {
    dimensions,
    embed,
    async embedQuery(text: string): Promise<number[]> {
      const [vector] = await embed([text]);

      return vector ?? [];
    },
  };
}

export function resolveEmbeddingsProvider(environment: EmbeddingEnvironment): EmbeddingProvider {
  const selected = environment["EMBEDDINGS_PROVIDER"]?.trim().toLowerCase() ?? "";

  if (!EMBEDDING_PROVIDER_NAMES.includes(selected as EmbeddingProviderName)) {
    throw new Error(
      `EMBEDDINGS_PROVIDER must be one of ${EMBEDDING_PROVIDER_NAMES.join(", ")}; received an empty or unknown value.`,
    );
  }

  const provider = selected as EmbeddingProviderName;

  if (provider === "fake") {
    return createFakeEmbeddings();
  }

  return provider === "ollama" ? ollama(environment) : openAiCompatible(environment);
}
