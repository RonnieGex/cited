import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, sep } from "node:path";
import type { EmbeddingProvider } from "../embeddings/types.ts";
import { ingestPaths } from "../ingest/index.ts";
import { MAX_FILE_BYTES } from "../ingest/parse.ts";
import type { IngestReport } from "../ingest/types.ts";
import { reindexDocument } from "../settings/indexing.ts";
import type { Store } from "../store/index.ts";

export type DocumentSummary = {
  name: string;
  type: string;
  pages: number | null;
  ingestedAt: string;
  passages: number;
};

export type IngestedDocument = {
  name: string;
  passages: number;
};

function safeName(name: string): string {
  const cleaned = basename(name)
    .replaceAll(/[^\w.\- ]+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 120);

  return cleaned.length === 0 ? "document.txt" : cleaned;
}

function inside(folder: string, path: string): string {
  return path.split(folder + sep).join("");
}

export async function documentSummaries(store: Store): Promise<DocumentSummary[]> {
  const documents = await store.listDocuments();
  const summaries: DocumentSummary[] = [];

  for (const document of documents) {
    summaries.push({
      name: document.name,
      type: document.type,
      pages: document.pages,
      ingestedAt: document.ingestedAt,
      passages: await store.countPassages({ name: document.name }),
    });
  }

  return summaries;
}

export async function ingestUpload(
  store: Store,
  embeddings: EmbeddingProvider | null,
  name: string,
  bytes: Uint8Array,
  signature?: string,
): Promise<IngestReport> {
  if (bytes.length > MAX_FILE_BYTES) {
    throw new Error(
      `${safeName(name)} crosses the size limit: ${bytes.length} bytes is above the maximum of ${MAX_FILE_BYTES}.`,
    );
  }

  const folder = await mkdtemp(join(tmpdir(), "cited-upload-"));

  try {
    const path = join(folder, safeName(name));

    await writeFile(path, bytes);

    const report = await ingestPaths([path], { store, embeddings, signature });

    return {
      ingested: report.ingested,
      failed: report.failed.map((failure) => ({
        path: safeName(failure.path),
        reason: inside(folder, failure.reason),
      })),
    };
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}

export async function reingestDocument(
  store: Store,
  embeddings: EmbeddingProvider | null,
  signature: string,
  name: string,
): Promise<IngestedDocument | null> {
  const document = await store.findDocument(name);

  if (document === null) {
    return null;
  }

  const passages = await reindexDocument(store, embeddings, signature, document.name);

  return { name: document.name, passages };
}
