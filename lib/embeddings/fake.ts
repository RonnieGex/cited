import type { EmbeddingProvider } from "./types.ts";
import { DEFAULT_EMBEDDING_DIMENSIONS } from "./types.ts";

type Feature = { term: string; weight: number };

const wordPattern = /[\p{L}\p{N}]+/gu;
const runPattern = /[\p{L}\p{N} ]+/gu;
const ngramSize = 3;

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function embeddingFeatures(text: string): Feature[] {
  const normalized = normalize(text);
  const features: Feature[] = [];

  for (const word of normalized.match(wordPattern) ?? []) {
    features.push({ term: `w:${word}`, weight: 1 });
  }

  for (const run of normalized.match(runPattern) ?? []) {
    const compact = run.replace(/\s+/g, " ").trim();

    for (let index = 0; index + ngramSize <= compact.length; index += 1) {
      features.push({ term: `g:${compact.slice(index, index + ngramSize)}`, weight: 0.5 });
    }
  }

  return features;
}

function hash(term: string): number {
  let value = 2166136261;

  for (let index = 0; index < term.length; index += 1) {
    value ^= term.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }

  return value >>> 0;
}

function vectorize(text: string, dimensions: number): number[] {
  const vector = new Array<number>(dimensions).fill(0);

  for (const feature of embeddingFeatures(text)) {
    const slot = hash(feature.term) % dimensions;

    vector[slot] = (vector[slot] ?? 0) + feature.weight;
  }

  const length = Math.hypot(...vector);

  if (length === 0) {
    return vector;
  }

  return vector.map((value) => value / length);
}

export function createFakeEmbeddings(
  dimensions = DEFAULT_EMBEDDING_DIMENSIONS.fake,
): EmbeddingProvider {
  const embed = async (texts: string[]): Promise<number[][]> =>
    texts.map((text) => vectorize(text, dimensions));

  return {
    dimensions,
    embed,
    async embedQuery(text: string): Promise<number[]> {
      const [vector] = await embed([text]);

      return vector ?? new Array<number>(dimensions).fill(0);
    },
  };
}
