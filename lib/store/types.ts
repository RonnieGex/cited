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

// Decision 2 of `openspec/changes/provider-keys-in-panel/design.md`: the table of the providers the owner connects in
// the panel. The voice key joins in a later change.
export const PROVIDER_KINDS = ["chat", "embeddings"] as const;

export type ProviderKind = (typeof PROVIDER_KINDS)[number];

export type StoredProviderSetting = {
  kind: ProviderKind;
  provider: string;
  model: string | null;
  keyCiphertext: string | null;
  keyLast4: string | null;
  baseUrl: string | null;
  mode: string | null;
  testedAt: string | null;
  testLatencyMs: number | null;
  updatedAt: string;
};

export type ProviderSettingInput = {
  kind: ProviderKind;
  provider: string;
  model: string | null;
  keyCiphertext: string | null;
  keyLast4: string | null;
  baseUrl: string | null;
  mode: string | null;
  testedAt: string | null;
  testLatencyMs: number | null;
};
