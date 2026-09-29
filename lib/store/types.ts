export type StoreEnvironment = Record<string, string | undefined>;

export type PassageInput = {
  position: number;
  heading: string | null;
  text: string;
  embedding: number[];
};

export type StoredDocument = {
  id: number;
  name: string;
  sha256: string;
  type: string;
  pages: number | null;
  ingestedAt: string;
};

export type DocumentInput = {
  name: string;
  sha256: string;
  type: string;
  pages: number | null;
};

export type StoredPassage = {
  id: number;
  name: string;
  position: number;
  heading: string | null;
  text: string;
};

export type KeywordMatch = {
  passageId: number;
  rank: number;
  score: number;
};

export type VectorMatch = {
  passageId: number;
  rank: number;
  distance: number;
};

export type PassageFilter = {
  name?: string;
  limit?: number;
};
