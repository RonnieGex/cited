import { resolve } from "node:path";
import { resolveEmbeddingsProvider } from "../lib/embeddings/providers.ts";
import { MAX_FILE_BYTES, MAX_PAGES, ingestFolder } from "../lib/ingest/index.ts";
import { openStore } from "../lib/store/index.ts";
import { prepareStorePath, storeLocation } from "./lib/store-path.ts";

const targets = process.argv.slice(2);

async function main(): Promise<void> {
  if (targets.length === 0) {
    console.error("Usage: npm run ingest -- <folder-or-file> [<folder-or-file> ...]");
    process.exit(2);
  }

  const storePath = storeLocation(process.env);
  const store = await openStore(prepareStorePath(storePath));
  const embeddings = resolveEmbeddingsProvider(process.env);
  const started = Date.now();
  let documents = 0;
  let passages = 0;
  let skipped = 0;

  for (const target of targets) {
    const report = await ingestFolder(resolve(target), {
      store,
      embeddings,
      limits: { maxBytes: MAX_FILE_BYTES, maxPages: MAX_PAGES },
    });

    for (const document of report.ingested) {
      documents += 1;
      passages += document.passages;
      console.log(
        `ingested ${document.name} (${document.type}, ${document.pages ?? "no pages"}, ${document.passages} passages)`,
      );
    }

    for (const failure of report.failed) {
      skipped += 1;
      console.error(`skipped ${failure.path}: ${failure.reason}`);
    }
  }

  console.log(
    `documents ${documents}, passages ${passages}, skipped ${skipped}, store ${storePath}, ${Date.now() - started} ms, rss ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
  );

  store.close();
}

await main();
