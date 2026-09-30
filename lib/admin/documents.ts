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

/**
 * One file of a multipart form, before anything is read from it. Decision 15: the size limit is checked on the size the
 * browser sent, so the bytes of a file that crosses it are never read into memory, and the name is reduced to its base
 * name before it is stored or shown. A file that crossed the limit carries the sentence the panel classifies, exactly
 * like the failure of the ingestion.
 */
export type UploadField =
  | { name: string; bytes: Uint8Array; failure: null }
  | { name: string; bytes: null; failure: string };

export async function readUploadField(entry: {
  name: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}): Promise<UploadField> {
  const name = safeName(entry.name);

  if (entry.size > MAX_FILE_BYTES) {
    return {
      name,
      bytes: null,
      failure: `${name} crosses the size limit: ${entry.size} bytes is above the maximum of ${MAX_FILE_BYTES}.`,
    };
  }

  return { name, bytes: new Uint8Array(await entry.arrayBuffer()), failure: null };
}

// Decision 15 of the amendment to `openspec/changes/guided-setup-and-knowledge/design.md`: a name with `..`, a slash
// or a control character never reaches the store or the panel, and the base name is what is kept. A backslash is a
// separator of a Windows path, and the store of a container is not Windows: both are reduced the same way here.
function safeName(name: string): string {
  const cleaned = basename(name.replaceAll("\\", "/"))
    .replaceAll(/[\u0000-\u001f\u007f]+/g, "_")
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

/**
 * One file of an upload, as the panel of the guided setup reads it (decision 3): the name, what the ingestion wrote
 * when it failed — with the folder of the temporary file removed, so the reason reads as a sentence of the owner and
 * carries no path of the machine — and the passages it produced. A file whose type cannot be read fails here, alone, and
 * the other files of the same upload keep going: this is the function that asks and never throws for a bad file.
 */
export async function ingestOne(
  store: Store,
  embeddings: EmbeddingProvider | null,
  name: string,
  bytes: Uint8Array,
  signature?: string,
): Promise<IngestReport["failed"][number] | IngestReport["ingested"][number]> {
  let report: IngestReport;

  try {
    report = await ingestUpload(store, embeddings, name, bytes, signature);
  } catch (error) {
    // The size limit is refused before the temporary file exists and its message quotes the name `ingestUpload()`
    // sanitized: the owner reads it in the panel and no path of this machine is in it.
    return { path: safeName(name), reason: messageOf(error) };
  }

  const read = report.ingested[0];

  return read ?? report.failed[0] ?? { path: safeName(name), reason: "the file has no readable text" };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * One file of an upload as the route answers it (decision 3): the name, whether it was read, how many passages it
 * produced and, when it failed, the sentence the ingestion wrote. The panel classifies that sentence and prints the
 * words of the owner; the raw reason never reaches the page as a sentence.
 */
export type UploadedFile = {
  name: string;
  state: "ready" | "failed";
  passages: number;
  failure: string | null;
};

export function uploadedFile(
  result: IngestReport["failed"][number] | IngestReport["ingested"][number],
): UploadedFile {
  return ingestedOne(result)
    ? { name: result.name, state: "ready", passages: result.passages, failure: null }
    : { name: result.path, state: "failed", passages: 0, failure: result.reason };
}

/**
 * Whether the ingestion read a document or not, whichever half of the report it came in. `ingested` carries the
 * passages; `failed` carries the reason and no passages.
 */
export function ingestedOne(
  result: IngestReport["failed"][number] | IngestReport["ingested"][number],
): result is IngestReport["ingested"][number] {
  return "passages" in result;
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
