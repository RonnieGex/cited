import type { EmbeddingProvider } from "../embeddings/types.ts";
import type { Store } from "../store/index.ts";

export type SourceType = "pdf" | "docx" | "md" | "txt";

export type ParsedDocument = {
  type: SourceType;
  text: string;
  pages: number | null;
};

export type ChunkedPassage = {
  position: number;
  heading: string | null;
  text: string;
};

export type IngestFailure = {
  path: string;
  reason: string;
};

export type IngestedDocument = {
  name: string;
  type: SourceType;
  pages: number | null;
  passages: number;
};

export type IngestReport = {
  ingested: IngestedDocument[];
  failed: IngestFailure[];
};

export type IngestLimits = {
  maxBytes: number;
  maxPages: number;
};

export type IngestOptions = {
  store: Store;
  /** `null` is keyword mode: the passages are stored with no vector and the search ranks with FTS5 alone. */
  embeddings: EmbeddingProvider | null;
  limits?: IngestLimits;
  /** The signature of the embeddings that made the vectors, written with the document for the re-index warning. */
  signature?: string;
};

export type ChunkOptions = {
  size: number;
  overlap: number;
};
