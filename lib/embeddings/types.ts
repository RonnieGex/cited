export type EmbeddingProvider = {
  readonly dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
};

export type EmbeddingEnvironment = Record<string, string | undefined>;

export const EMBEDDING_PROVIDER_NAMES = ["openai", "ollama", "fake"] as const;

export type EmbeddingProviderName = (typeof EMBEDDING_PROVIDER_NAMES)[number];

export const DEFAULT_EMBEDDING_DIMENSIONS: Record<EmbeddingProviderName, number> = {
  openai: 1536,
  ollama: 768,
  fake: 64,
};
