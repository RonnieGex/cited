// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createClient } from "@libsql/client";
import { afterAll, describe, expect, it } from "vitest";
import { POST } from "@/app/api/ask/route";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import { ingestFolder } from "@/lib/ingest";
import { closeSharedStores } from "@/lib/store/instance";

const repositoryRoot = resolve(import.meta.dirname, "..");
const samples = join(repositoryRoot, "samples");
const priceQuestion = "¿Cuánto cuesta una afinación de bicicleta?";
const address = "203.0.113.7";
const embeddings = createFakeEmbeddings();

const roots: string[] = [];
const preserved = new Map<string, string | undefined>();
const managed = [
  "DATABASE_URL",
  "TURSO_DATABASE_URL",
  "EMBEDDINGS_PROVIDER",
  "CHAT_PROVIDER",
  "CHAT_MODEL",
  "TRUST_PROXY",
  "ADMIN_SESSION_SECRET",
  "MAX_QUESTION_CHARS",
  "RATE_LIMIT_PER_IP_PER_HOUR",
  "DAILY_MODEL_CALL_LIMIT",
  "MAX_ANSWER_TOKENS",
  "CONVERSATION_RETENTION_DAYS",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
];

function remember(): void {
  for (const name of managed) {
    if (preserved.has(name) === false) {
      preserved.set(name, process.env[name]);
    }
  }
}

function setEnvironment(overrides: Record<string, string | undefined>): void {
  remember();

  for (const name of managed) {
    delete process.env[name];
  }

  process.env["EMBEDDINGS_PROVIDER"] = "fake";
  process.env["CHAT_PROVIDER"] = "fake";

  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

async function workspace(): Promise<string> {
  const root = mkdtempSync(join(tmpdir(), "katalis-ask-route-"));

  roots.push(root);

  return root;
}

async function corpusStore(): Promise<string> {
  const root = await workspace();
  const path = join(root, "store.sqlite");

  setEnvironment({ DATABASE_URL: path });

  const { openStore } = await import("@/lib/store");

  const store = await openStore(path);

  await ingestFolder(samples, {
    store,
    embeddings,
    limits: { maxBytes: 1024 * 1024, maxPages: 10 },
  });
  store.close();

  return path;
}

function askRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function rows(path: string, sql: string): Promise<Array<Record<string, unknown>>> {
  await closeSharedStores();

  const client = createClient({ url: `file:${path}` });
  const found = await client.execute(sql);
  const result = found.rows.map((row) => ({ ...row }));

  client.close();

  return result;
}

afterAll(async () => {
  await closeSharedStores();

  for (const [name, value] of preserved) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

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

describe("POST /api/ask answers with citations", () => {
  it("answers the question with the passage it came from", async () => {
    await corpusStore();

    const response = await POST(askRequest({ question: priceQuestion }));
    const body = (await response.json()) as {
      status: string;
      answer: string;
      citations: Array<Record<string, unknown>>;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body.status).toBe("answered");
    expect(body.answer).toContain("[1]");
    expect(body.citations.length).toBeGreaterThanOrEqual(1);
    expect(body.citations[0]?.["document"]).toBe("cafe-la-horquilla.md");
    expect(body.citations[0]?.["heading"]).toBe("Precios");
    expect(body.citations[0]?.["position"]).toBe(2);
    expect(String(body.citations[0]?.["excerpt"])).toContain("380 pesos");

    const cited = body.citations.map((citation) => Number(citation["n"]));

    for (const marker of [...body.answer.matchAll(/\[(\d+)\]/g)].map((match) => Number(match[1]))) {
      expect(cited).toContain(marker);
    }

    expect([...new Set(cited)].sort()).toEqual([...cited].sort());
  });

  it("refuses instead of inventing when no document has the answer", async () => {
    await corpusStore();

    const response = await POST(
      askRequest({ question: "¿Cuál es la capital de Australia?", sessionId: "sesion" }),
    );
    const body = (await response.json()) as { status: string; answer: string; citations: unknown[] };

    expect(response.status).toBe(200);
    expect(body.status).toBe("refused");
    expect(body.citations).toEqual([]);
    expect(body.answer.length).toBeGreaterThan(10);
  });
});

describe("POST /api/ask protects the wallet of the owner", () => {
  it("answers 400 to a question longer than MAX_QUESTION_CHARS and never echoes it", async () => {
    await corpusStore();

    const question = "a".repeat(1001);
    const response = await POST(askRequest({ question }));
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(JSON.stringify(body)).not.toContain(question);
    expect(JSON.stringify(body)).not.toContain("a".repeat(60));
  });

  it("answers 429 with Retry-After to the 31st question of one address in an hour", async () => {
    const path = await corpusStore();

    setEnvironment({
      DATABASE_URL: path,
      TRUST_PROXY: "1",
      RATE_LIMIT_PER_IP_PER_HOUR: "30",
    });

    for (let question = 1; question <= 30; question += 1) {
      const response = await POST(
        askRequest({ question: priceQuestion }, { "x-forwarded-for": address }),
      );

      expect(response.status, `question ${question}`).toBe(200);
    }

    const limited = await POST(
      askRequest({ question: priceQuestion }, { "x-forwarded-for": address }),
    );
    const body = (await limited.json()) as Record<string, unknown>;
    const retryAfter = Number(limited.headers.get("retry-after"));

    expect(limited.status).toBe(429);
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(3600);
    expect(JSON.stringify(body)).not.toContain(priceQuestion);

    const calls = await rows(
      path,
      `SELECT count AS total FROM model_calls WHERE day = '${new Date().toISOString().slice(0, 10)}'`,
    );

    expect(Number(calls[0]?.["total"] ?? 0)).toBe(30);
  });

  it("answers 503 with the daily limit after DAILY_MODEL_CALL_LIMIT calls", async () => {
    const path = await corpusStore();

    setEnvironment({ DATABASE_URL: path, DAILY_MODEL_CALL_LIMIT: "1" });

    const first = await POST(askRequest({ question: priceQuestion }));
    const second = await POST(askRequest({ question: priceQuestion }));
    const body = (await second.json()) as Record<string, unknown>;
    const calls = await rows(
      path,
      `SELECT count AS total FROM model_calls WHERE day = '${new Date().toISOString().slice(0, 10)}'`,
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(503);
    expect(JSON.stringify(body)).toMatch(/daily|diario/i);
    expect(Number(calls[0]?.["total"] ?? 0)).toBe(1);
  });

  it("keeps no address in clear in the store", async () => {
    const path = await corpusStore();

    setEnvironment({
      DATABASE_URL: path,
      TRUST_PROXY: "1",
      ADMIN_SESSION_SECRET: "sal-de-prueba",
    });

    await POST(askRequest({ question: priceQuestion }, { "x-forwarded-for": address }));

    const stored = await rows(path, "SELECT * FROM rate_limits");
    const serialized = JSON.stringify(stored);

    expect(stored.length).toBeGreaterThan(0);
    expect(serialized).not.toContain(address);
    expect(serialized).not.toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
    expect(String(stored[0]?.["ip_hash"])).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("POST /api/ask refuses an unusable configuration", () => {
  it("answers 503 naming the variable of the missing key and never its value", async () => {
    await corpusStore();

    setEnvironment({
      CHAT_PROVIDER: "openai",
      OPENAI_API_KEY: "",
      ANTHROPIC_API_KEY: "sk-ant-value-that-must-not-travel",
    });

    const response = await POST(askRequest({ question: priceQuestion }));
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(text).toContain("OPENAI_API_KEY");
    expect(text).not.toContain("sk-ant-value-that-must-not-travel");
    expect(text).not.toMatch(/sk-[a-z0-9]/i);
  });

  it("answers 503 when the embeddings provider is not configured", async () => {
    await corpusStore();

    setEnvironment({ CHAT_PROVIDER: "fake", EMBEDDINGS_PROVIDER: "" });

    const response = await POST(askRequest({ question: priceQuestion }));
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(text).toContain("EMBEDDINGS_PROVIDER");
  });

  it("refuses a body that is not JSON and a question that is not a question", async () => {
    await corpusStore();

    const notJson = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "question=precio",
      }),
    );
    const empty = await POST(askRequest({}));
    const number = await POST(askRequest({ question: 42 }));
    const broken = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    );

    expect(notJson.status).toBe(415);
    expect(empty.status).toBe(400);
    expect(number.status).toBe(400);
    expect(broken.status).toBe(400);
  });
});
