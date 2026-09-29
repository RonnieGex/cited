import { askQuestion } from "../lib/answer/ask.ts";
import { resolveEmbeddingsProvider } from "../lib/embeddings/providers.ts";
import { resolveChatModel } from "../lib/models/providers.ts";
import { openStore } from "../lib/store/index.ts";
import { prepareStorePath, storeLocation } from "../lib/store/path.ts";

const question = process.argv.slice(2).join(" ").trim();

async function main(): Promise<void> {
  if (question.length === 0) {
    console.error('Usage: npm run ask -- "<question>"');
    process.exit(2);
  }

  const storePath = storeLocation(process.env);
  const store = await openStore(prepareStorePath(storePath));
  const embeddings = resolveEmbeddingsProvider(process.env);
  const model = resolveChatModel(process.env);
  const started = Date.now();
  const outcome = await askQuestion({
    question,
    store,
    embeddings,
    model,
    environment: process.env,
    ip: "cli",
  });

  if (
    outcome.status === "invalid" ||
    outcome.status === "rate_limited" ||
    outcome.status === "unavailable"
  ) {
    console.error(`status: ${outcome.status}`);
    console.error(outcome.message);
    store.close();
    process.exit(2);
  }

  console.log(`question: ${question}`);
  console.log(`store: ${storePath}`);
  console.log(`status: ${outcome.status}`);
  console.log(`answer: ${outcome.answer}`);

  if (outcome.citations.length > 0) {
    console.log("citations:");

    for (const citation of outcome.citations) {
      console.log(
        `  [${citation.n}] ${citation.document} [${citation.heading ?? "no heading"}] position ${citation.position}`,
      );
      console.log(`      ${citation.excerpt.slice(0, 240).replace(/\s+/g, " ")}`);
    }
  }

  console.log(
    `citations ${outcome.citations.length}, ${Date.now() - started} ms, rss ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
  );

  store.close();
}

await main();
