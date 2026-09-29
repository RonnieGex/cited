import { resolveEmbeddingsProvider } from "../lib/embeddings/providers.ts";
import { hybridSearch } from "../lib/search/index.ts";
import { openStore } from "../lib/store/index.ts";
import { prepareStorePath, storeLocation } from "./lib/store-path.ts";

const question = process.argv.slice(2).join(" ").trim();

async function main(): Promise<void> {
  if (question.length === 0) {
    console.error('Usage: npm run search -- "<question>"');
    process.exit(2);
  }

  const storePath = storeLocation(process.env);
  const store = await openStore(prepareStorePath(storePath));
  const embeddings = resolveEmbeddingsProvider(process.env);
  const started = Date.now();
  const hits = await hybridSearch(question, { store, embeddings });

  console.log(`question: ${question}`);
  console.log(`store: ${storePath}`);

  if (hits.length === 0) {
    console.log("no results");
  }

  hits.forEach((hit, index) => {
    console.log(
      `\n${index + 1}. ${hit.name} [${hit.heading ?? "no heading"}] position ${hit.position} score ${hit.score.toFixed(6)}`,
    );
    console.log(`   ${hit.text.slice(0, 240).replace(/\s+/g, " ")}`);
  });

  console.log(
    `\n${hits.length} results, ${Date.now() - started} ms, rss ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
  );

  store.close();
}

await main();
