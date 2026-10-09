/**
 * Fills a store with a folder of documents in keyword mode, for the manual verification and the gate of the MCP
 * change: no embeddings provider is called and the search ranks with the full-text index alone.
 *
 * Usage: node scripts/mcp-seed.ts <store-path> <folder>
 */

import { resolve } from "node:path";
import { MAX_FILE_BYTES, MAX_PAGES, ingestFolder } from "../lib/ingest/index.ts";
import { openStore } from "../lib/store/index.ts";
import { prepareStorePath } from "../lib/store/path.ts";

const [storePath, folder] = process.argv.slice(2);

async function main(): Promise<void> {
  if (storePath === undefined || folder === undefined) {
    console.error("Usage: node scripts/mcp-seed.ts <store-path> <folder>");
    process.exit(2);
  }

  const store = await openStore(prepareStorePath(storePath));
  const report = await ingestFolder(resolve(folder), {
    store,
    embeddings: null,
    signature: "keyword",
    limits: { maxBytes: MAX_FILE_BYTES, maxPages: MAX_PAGES },
  });

  for (const document of report.ingested) {
    console.log(`ingested ${document.name} (${document.type}, ${document.passages} passages)`);
  }

  for (const failure of report.failed) {
    console.error(`skipped ${failure.path}: ${failure.reason}`);
  }

  console.log(`documents ${report.ingested.length}, store ${storePath}`);

  store.close();
}

await main();
