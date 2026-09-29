import { embeddingsProblem, type EmbeddingsResolution } from "../settings/providers.ts";
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

export type EmbeddingsCredentials = {
  baseUrl: string;
  model: string;
  key: string;
  dimensions: number;
};

function openAiCompatible(input: EmbeddingsCredentials): EmbeddingProvider {
  const url = `${input.baseUrl.replace(/\/+$/, "")}/embeddings`;

  const embed = async (texts: string[]): Promise<number[][]> => {
    if (texts.length === 0) {
      return [];
    }

    return post(
      url,
      { model: input.model, input: texts },
      input.key.length === 0 ? {} : { authorization: `Bearer ${input.key}` },
    );
  };

  return {
    dimensions: input.dimensions,
    embed,
    async embedQuery(text: string): Promise<number[]> {
      const [vector] = await embed([text]);

      return vector ?? [];
    },
  };
}

type OllamaResponse = { embeddings?: number[][] };

function ollama(input: Omit<EmbeddingsCredentials, "key">): EmbeddingProvider {
  const url = `${input.baseUrl.replace(/\/+$/, "")}/api/embed`;

  const embed = async (texts: string[]): Promise<number[][]> => {
    if (texts.length === 0) {
      return [];
    }

    const answer = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: input.model, input: texts }),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    if (!answer.ok) {
      throw new Error(`The Ollama server answered ${answer.status}.`);
    }

    const parsed = (await answer.json()) as OllamaResponse;

    return parsed.embeddings ?? [];
  };

  return {
    dimensions: input.dimensions,
    embed,
    async embedQuery(text: string): Promise<number[]> {
      const [vector] = await embed([text]);

      return vector ?? [];
    },
  };
}

// The one place that builds the embeddings of a resolved provider: the server environment or the panel, through
// `resolveEmbeddings()`. `null` is keyword mode, which ranks with FTS5 alone and stores no vector; a configuration
// that is missing or unreadable stops the caller with a message that names what is missing and never a value.
export function embeddingsFrom(resolution: EmbeddingsResolution): EmbeddingProvider | null {
  if (resolution.mode === "keyword") {
    return null;
  }

  const problem = embeddingsProblem(resolution);

  if (resolution.mode === "none" || problem !== null) {
    throw new Error(problem ?? "the embeddings provider is not configured");
  }

  if (resolution.provider === "fake") {
    return createFakeEmbeddings();
  }

  if (resolution.provider === "ollama") {
    return ollama({
      baseUrl: resolution.baseUrl,
      model: resolution.model,
      dimensions: resolution.dimensions,
    });
  }

  return openAiCompatible({
    baseUrl: resolution.baseUrl,
    model: resolution.model,
    key: resolution.key,
    dimensions: resolution.dimensions,
  });
}

// The embeddings the installer configured in the environment of the server, for the read-only check of the page "For
// the installer". The pipeline of the answers and of the ingestion reads `resolveEmbeddings()`.
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

  if (provider === "ollama") {
    return ollama({
      baseUrl: (environment["OLLAMA_BASE_URL"]?.trim() || "http://localhost:11434").replace(/\/+$/, ""),
      model: required(environment, "EMBEDDINGS_MODEL", "ollama"),
      dimensions: dimensionsFrom(environment, DEFAULT_EMBEDDING_DIMENSIONS.ollama),
    });
  }

  return openAiCompatible({
    baseUrl: required(environment, "EMBEDDINGS_BASE_URL", "openai"),
    model: required(environment, "EMBEDDINGS_MODEL", "openai"),
    key: required(environment, "EMBEDDINGS_API_KEY", "openai"),
    dimensions: dimensionsFrom(environment, DEFAULT_EMBEDDING_DIMENSIONS.openai),
  });
}
