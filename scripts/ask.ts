import { askQuestion } from "../lib/answer/ask.ts";
import { embeddingsFrom } from "../lib/embeddings/providers.ts";
import { chatModelFrom } from "../lib/models/providers.ts";
import { chatProblem, resolveChat, resolveEmbeddings } from "../lib/settings/providers.ts";
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
  const chat = await resolveChat({ environment: process.env, store });
  const problem = chatProblem(chat);

  if (chat.provider === null || problem !== null) {
    console.error(`status: unavailable`);
    console.error(problem ?? "the AI is not connected yet");
    store.close();
    process.exit(2);
  }

  const embeddings = embeddingsFrom(await resolveEmbeddings({ environment: process.env, store }));
  const model = chatModelFrom({
    provider: chat.provider,
    model: chat.model,
    key: chat.key,
    baseUrl: chat.baseUrl,
    // The address of the panel travels with its pinned transport, exactly as it does in `/api/ask`.
    ...(chat.fetch === undefined ? {} : { fetch: chat.fetch }),
  });
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
        `  [${citation.n}] ${citation.document} [${citation.heading ?? "no heading"}] position ${citation.position} lead ${citation.lead}`,
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
