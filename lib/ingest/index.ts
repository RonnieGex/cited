import { createHash } from "node:crypto";
import { readdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import type { EmbeddingProvider } from "../embeddings/types.ts";
import type { PassageInput } from "../store/types.ts";
import { chunkText } from "./chunk.ts";
import { MAX_FILE_BYTES, MAX_PAGES, acceptedExtensions, parseFile } from "./parse.ts";
import type { IngestFailure, IngestOptions, IngestReport, SourceType } from "./types.ts";

export { chunkText } from "./chunk.ts";
export { MAX_FILE_BYTES, MAX_PAGES, parseFile } from "./parse.ts";
export type {
  ChunkOptions,
  ChunkedPassage,
  IngestOptions,
  IngestReport,
  ParsedDocument,
  SourceType,
} from "./types.ts";

const embeddingBatch = 32;

function isAccepted(path: string): boolean {
  const lower = path.toLowerCase();

  return acceptedExtensions().some((extension) => lower.endsWith(extension));
}

async function listFiles(folder: string): Promise<string[]> {
  const entries = await readdir(folder, { withFileTypes: true });
  const found: string[] = [];

  for (const entry of entries) {
    const path = join(folder, entry.name);

    if (entry.isDirectory()) {
      found.push(...(await listFiles(path)));
      continue;
    }

    if (entry.isFile() && isAccepted(path)) {
      found.push(path);
    }
  }

  return found.sort();
}

type PreparedDocument = {
  name: string;
  sha256: string;
  type: SourceType;
  pages: number | null;
  passages: Array<{ position: number; heading: string | null; text: string }>;
};

async function embedAll(provider: EmbeddingProvider, texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];

  for (let index = 0; index < texts.length; index += embeddingBatch) {
    vectors.push(...(await provider.embed(texts.slice(index, index + embeddingBatch))));
  }

  return vectors;
}

export async function ingestFolder(folder: string, options: IngestOptions): Promise<IngestReport> {
  const information = await stat(folder);

  if (!information.isDirectory()) {
    return ingestPaths([folder], options);
  }

  return ingestPaths(await listFiles(folder), options);
}

export async function ingestPaths(paths: string[], options: IngestOptions): Promise<IngestReport> {
  const limits = options.limits ?? { maxBytes: MAX_FILE_BYTES, maxPages: MAX_PAGES };
  const ingested: IngestReport["ingested"] = [];
  const failed: IngestFailure[] = [];
  const prepared: PreparedDocument[] = [];

  for (const path of paths) {
    try {
      const parsed = await parseFile(path, limits);
      const passages = chunkText(parsed.text);

      if (passages.length === 0) {
        failed.push({ path, reason: "the file has no readable text" });
        continue;
      }

      prepared.push({
        name: basename(path),
        sha256: createHash("sha256").update(parsed.text, "utf8").digest("hex"),
        type: parsed.type,
        pages: parsed.pages,
        passages,
      });
    } catch (error) {
      failed.push({ path, reason: error instanceof Error ? error.message : String(error) });
    }
  }

  const vectors = await embedAll(
    options.embeddings,
    prepared.flatMap((document) => document.passages.map((passage) => passage.text)),
  );
  let cursor = 0;

  for (const document of prepared) {
    const embeddings = vectors.slice(cursor, cursor + document.passages.length);

    cursor += document.passages.length;

    const passages: PassageInput[] = document.passages.map((passage, index) => ({
      position: passage.position,
      heading: passage.heading,
      text: passage.text,
      embedding: embeddings[index] ?? [],
    }));

    await options.store.replaceDocument(
      { name: document.name, sha256: document.sha256, type: document.type, pages: document.pages },
      passages,
    );

    ingested.push({
      name: document.name,
      type: document.type,
      pages: document.pages,
      passages: passages.length,
    });
  }

  return { ingested, failed };
}
