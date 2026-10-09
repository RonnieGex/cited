// Shared setup of the MCP suite: a temporary store seeded like the tests of the answers, the environment of one case
// and the cleanup of the workspaces. No test of this suite talks to a provider: the corpus is the sample one, the
// embeddings of the vector cases are the deterministic double and the chat provider is `fake`.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import { MAX_FILE_BYTES, MAX_PAGES, ingestFolder } from "@/lib/ingest";
import { openStore } from "@/lib/store";

export const repositoryRoot = resolve(import.meta.dirname, "..");
export const samples = join(repositoryRoot, "samples");

// Every name a case of this suite may set: the ones of the store, of the providers, of the tools and of the limits.
// `CITED_MCP_TOKEN` is deleted rather than set, so a case that forgets it starts with the server off.
const managed = [
  "DATABASE_URL",
  "TURSO_DATABASE_URL",
  "CHAT_PROVIDER",
  "CHAT_MODEL",
  "EMBEDDINGS_PROVIDER",
  "EMBEDDINGS_BASE_URL",
  "EMBEDDINGS_MODEL",
  "EMBEDDINGS_API_KEY",
  "EMBEDDINGS_DIMENSIONS",
  "CITED_MCP_TOKEN",
  "MCP_RATE_LIMIT_PER_HOUR",
  "MAX_QUESTION_CHARS",
  "RATE_LIMIT_PER_IP_PER_HOUR",
  "DAILY_MODEL_CALL_LIMIT",
  "MAX_ANSWER_TOKENS",
  "CONVERSATION_RETENTION_DAYS",
  "TRUST_PROXY",
  "ADMIN_SESSION_SECRET",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
];

const preserved = new Map<string, string | undefined>();
const roots: string[] = [];

function remember(): void {
  for (const name of managed) {
    if (preserved.has(name) === false) {
      preserved.set(name, process.env[name]);
    }
  }
}

export function setEnvironment(overrides: Record<string, string | undefined> = {}): void {
  remember();

  for (const name of managed) {
    delete process.env[name];
  }

  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

export function restoreEnvironment(): void {
  for (const [name, value] of preserved) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

async function workspace(): Promise<string> {
  const root = mkdtempSync(join(tmpdir(), "katalis-mcp-"));

  roots.push(root);

  return root;
}

export async function workspacePath(): Promise<string> {
  return join(await workspace(), "store.sqlite");
}

/** The sample corpus in keyword mode: no embeddings are stored and the search ranks with FTS5 alone. */
export async function keywordStore(): Promise<string> {
  const path = await workspacePath();
  const store = await openStore(path);

  await ingestFolder(samples, {
    store,
    embeddings: null,
    signature: "keyword",
    limits: { maxBytes: MAX_FILE_BYTES, maxPages: MAX_PAGES },
  });
  store.close();

  return path;
}

/** The sample corpus with the deterministic embeddings, which is what the cases of `cited_ask` drive. */
export async function vectorStore(): Promise<string> {
  const path = await workspacePath();
  const store = await openStore(path);

  await ingestFolder(samples, {
    store,
    embeddings: createFakeEmbeddings(),
    signature: "vectors:fake:fake::0",
    limits: { maxBytes: MAX_FILE_BYTES, maxPages: MAX_PAGES },
  });
  store.close();

  return path;
}

export async function cleanupWorkspaces(): Promise<void> {
  for (const root of roots) {
    await new Promise((wake) => setTimeout(wake, 50));

    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
        break;
      } catch {
        await new Promise((wake) => setTimeout(wake, 150));
      }
    }
  }

  roots.length = 0;
}
