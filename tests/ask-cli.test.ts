// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import { ingestFolder } from "@/lib/ingest";
import { openStore } from "@/lib/store";

const repositoryRoot = resolve(import.meta.dirname, "..");
const samples = join(repositoryRoot, "samples");
const priceQuestion = "¿Cuánto cuesta una afinación de bicicleta?";
const cliTimeout = 30_000;
const roots: string[] = [];

async function storePath(withSamples: boolean): Promise<string> {
  const root = mkdtempSync(join(tmpdir(), "katalis-ask-cli-"));
  const path = join(root, "store.sqlite");

  roots.push(root);

  const store = await openStore(path);

  if (withSamples) {
    await ingestFolder(samples, {
      store,
      embeddings: createFakeEmbeddings(),
      limits: { maxBytes: 1024 * 1024, maxPages: 10 },
    });
  }

  store.close();

  return path;
}

function runAsk(question: string, path: string): { stdout: string; stderr: string; status: number } {
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: path,
    EMBEDDINGS_PROVIDER: "fake",
    CHAT_PROVIDER: "fake",
  };

  delete environment["TURSO_DATABASE_URL"];

  const result = spawnSync(process.execPath, ["scripts/ask.ts", question], {
    cwd: repositoryRoot,
    env: environment,
    encoding: "utf8",
  });

  return { stdout: result.stdout ?? "", stderr: result.stderr ?? "", status: result.status ?? 1 };
}

afterAll(async () => {
  for (const root of roots) {
    await new Promise((wake) => setTimeout(wake, 100));

    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
        break;
      } catch {
        await new Promise((wake) => setTimeout(wake, 200));
      }
    }

    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      continue;
    }
  }
});

describe("npm run ask", () => {
  it("answers without keys and prints the citation of the document it came from", { timeout: cliTimeout }, async () => {
    const path = await storePath(true);
    const { stdout, status } = runAsk(priceQuestion, path);

    expect(status).toBe(0);
    expect(stdout).toContain("status: answered");
    expect(stdout).toContain("[1]");
    expect(stdout).toContain("cafe-la-horquilla.md");
    expect(stdout).toContain("380 pesos");
    expect(stdout).toContain(path);
    // The line of a citation names the lead of `passage-display-polish`: the characters of the excerpt that repeat the
    // passage before it.
    expect(stdout).toMatch(/position \d+ lead \d+/);
  });

  it("prints the refusal instead of an invented answer", { timeout: cliTimeout }, async () => {
    const path = await storePath(false);
    const { stdout, status } = runAsk(priceQuestion, path);

    expect(status).toBe(0);
    expect(stdout).toContain("status: refused");
    expect(stdout).toContain("No encuentro eso en los documentos de este negocio.");
    expect(stdout).not.toContain("[1]");
  });

  it("refuses a question longer than the limit and says which variable it crossed", { timeout: cliTimeout }, async () => {
    const path = await storePath(true);
    const { stderr, status } = runAsk("a".repeat(1001), path);

    expect(status).toBe(2);
    expect(stderr).toContain("MAX_QUESTION_CHARS");
  });
});
