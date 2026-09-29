// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createClient } from "@libsql/client";
import { afterAll, describe, expect, it } from "vitest";
import { POST } from "@/app/api/voice/tool/route";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import { ingestFolder } from "@/lib/ingest";
import { closeSharedStores } from "@/lib/store/instance";
import { voiceText } from "@/lib/voice/tool";

// Every scenario of the requirement "The agent asks through a protected server tool" of
// `openspec/changes/elevenlabs-voice-agent/specs/voice-agent/spec.md`, against the route and the store and never
// against ElevenLabs or a model provider: the deterministic `fake` providers run the pipeline.

const repositoryRoot = resolve(import.meta.dirname, "..");
const samples = join(repositoryRoot, "samples");
const priceQuestion = "¿Cuánto cuesta una afinación de bicicleta?";
const secret = "un-secreto-de-herramienta-de-voz-de-prueba";
const address = "203.0.113.9";
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
  "VOICE_TOOL_SECRET",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_AGENT_ID",
  "MAX_QUESTION_CHARS",
  "RATE_LIMIT_PER_IP_PER_HOUR",
  "DAILY_MODEL_CALL_LIMIT",
  "MAX_ANSWER_TOKENS",
];

function setEnvironment(overrides: Record<string, string | undefined>): void {
  for (const name of managed) {
    if (preserved.has(name) === false) {
      preserved.set(name, process.env[name]);
    }
  }

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

async function corpusStore(): Promise<string> {
  const root = mkdtempSync(join(tmpdir(), "katalis-voice-tool-"));

  roots.push(root);

  const path = join(root, "store.sqlite");

  setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret });

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

function toolRequest(
  body: unknown,
  headers: Record<string, string> = {},
  raw?: { contentType: string; body: string },
): Request {
  return new Request("http://localhost/api/voice/tool", {
    method: "POST",
    headers: {
      "content-type": raw?.contentType ?? "application/json",
      ...headers,
    },
    body: raw?.body ?? JSON.stringify(body),
  });
}

function authorized(): Record<string, string> {
  return { authorization: `Bearer ${secret}` };
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
  }
});

describe("POST /api/voice/tool without the secret", () => {
  it("answers 401 and asks no model when the Bearer is missing", async () => {
    const path = await corpusStore();

    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret });

    const response = await POST(toolRequest({ question: priceQuestion, conversation_id: "conv_1" }));
    const day = new Date().toISOString().slice(0, 10);
    const calls = await rows(path, `SELECT count AS total FROM model_calls WHERE day = '${day}'`);

    expect(response.status).toBe(401);
    expect(await response.text()).not.toContain(priceQuestion);
    expect(Number(calls[0]?.["total"] ?? 0)).toBe(0);
  });

  it("answers 401 with a wrong Bearer, with an empty one and with a scheme that is not Bearer", async () => {
    const path = await corpusStore();

    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret });

    const wrong = await POST(
      toolRequest({ question: priceQuestion, conversation_id: "conv_1" }, { authorization: "Bearer otra-cosa" }),
    );
    const empty = await POST(
      toolRequest({ question: priceQuestion, conversation_id: "conv_1" }, { authorization: "Bearer " }),
    );
    const basic = await POST(
      toolRequest({ question: priceQuestion, conversation_id: "conv_1" }, { authorization: `Basic ${secret}` }),
    );
    const day = new Date().toISOString().slice(0, 10);
    const calls = await rows(path, `SELECT count AS total FROM model_calls WHERE day = '${day}'`);

    expect([wrong.status, empty.status, basic.status]).toEqual([401, 401, 401]);
    expect(Number(calls[0]?.["total"] ?? 0)).toBe(0);
  });

  it("answers 401 when the environment carries no secret at all, so an unconfigured instance is closed", async () => {
    const path = await corpusStore();

    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: "" });

    const response = await POST(
      toolRequest({ question: priceQuestion, conversation_id: "conv_1" }, authorized()),
    );

    expect(response.status).toBe(401);
  });
});

describe("POST /api/voice/tool answers the agent", () => {
  it("answers the question with its citations as plain text the agent can speak", async () => {
    const path = await corpusStore();

    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret });

    const response = await POST(
      toolRequest({ question: priceQuestion, conversation_id: "conv_a" }, authorized()),
    );
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(text).toContain("380 pesos");
    expect(text).toContain("answer:");
    expect(text).toContain("sources:");
    expect(text).toContain("title: cafe-la-horquilla.md · Precios");
    expect(text).toContain("url: /#cita-1");
    expect(text).not.toContain("NO_ANSWER");
  });

  it("names the document alone when the passage carries no heading", () => {
    const text = voiceText({
      answer: "Está en la avenida central.",
      citations: [
        {
          n: 1,
          document: "notas-del-negocio.txt",
          heading: null,
          position: 0,
          excerpt: "Dirección: avenida central.",
        },
      ],
    });

    expect(text).toContain("title: notas-del-negocio.txt\n");
    expect(text).not.toContain(" · \n");
  });

  it("answers a refusal in words and with no source when no document holds the answer", async () => {
    const path = await corpusStore();

    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret });

    const response = await POST(
      toolRequest({ question: "¿Cuál es la capital de Australia?", conversation_id: "conv_a" }, authorized()),
    );
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain("sources: none");
    expect(text.toLowerCase()).not.toContain("capital de australia es");
  });

  it("refuses a body that is not the shape of the tool and a request that is not JSON", async () => {
    const path = await corpusStore();

    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret });

    const empty = await POST(toolRequest({}, authorized()));
    const number = await POST(toolRequest({ question: 42, conversation_id: "conv_a" }, authorized()));
    const noConversation = await POST(toolRequest({ question: priceQuestion }, authorized()));
    const notJson = await POST(
      toolRequest({}, authorized(), { contentType: "text/plain", body: "question=precio" }),
    );

    expect([empty.status, number.status, noConversation.status]).toEqual([400, 400, 400]);
    expect(notJson.status).toBe(415);
  });

  it("keeps the guards of the pipeline: a question over the ceiling is a 400 and no model call", async () => {
    const path = await corpusStore();

    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret, MAX_QUESTION_CHARS: "50" });

    const response = await POST(
      toolRequest({ question: "a".repeat(51), conversation_id: "conv_a" }, authorized()),
    );
    const day = new Date().toISOString().slice(0, 10);
    const calls = await rows(path, `SELECT count AS total FROM model_calls WHERE day = '${day}'`);

    expect(response.status).toBe(400);
    expect(Number(calls[0]?.["total"] ?? 0)).toBe(0);
  });

  it("answers 503 when the daily ceiling of model calls is reached", async () => {
    const path = await corpusStore();

    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret, DAILY_MODEL_CALL_LIMIT: "1" });

    const first = await POST(
      toolRequest({ question: priceQuestion, conversation_id: "conv_a" }, authorized()),
    );
    const second = await POST(
      toolRequest({ question: priceQuestion, conversation_id: "conv_a" }, authorized()),
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(503);
    expect(await second.text()).not.toContain(priceQuestion);
  });
});

describe("POST /api/voice/tool keeps one thread per call", () => {
  it("shares the session of the conversation id and never mixes two calls", async () => {
    const path = await corpusStore();

    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret });

    const first = await POST(
      toolRequest({ question: priceQuestion, conversation_id: "conv_a" }, authorized()),
    );
    const second = await POST(
      toolRequest({ question: "¿Y el cambio de cámara?", conversation_id: "conv_a" }, authorized()),
    );
    const third = await POST(
      toolRequest({ question: "¿A qué hora abren?", conversation_id: "conv_b" }, authorized()),
    );

    expect([first.status, second.status, third.status]).toEqual([200, 200, 200]);

    const turns = await rows(
      path,
      "SELECT session_id, turn, question FROM conversations ORDER BY session_id, turn",
    );

    expect(turns.map((row) => `${String(row["session_id"])}#${String(row["turn"])}`)).toEqual([
      "conv_a#1",
      "conv_a#2",
      "conv_b#1",
    ]);

    const secondText = await second.text();

    expect(secondText).toContain("answer:");
  });

  it("carries the id of the conversation and not the address of the caller into the store", async () => {
    const path = await corpusStore();

    setEnvironment({
      DATABASE_URL: path,
      VOICE_TOOL_SECRET: secret,
      TRUST_PROXY: "1",
      ADMIN_SESSION_SECRET: "sal-de-prueba",
    });

    await POST(
      toolRequest(
        { question: priceQuestion, conversation_id: "conv_a" },
        { ...authorized(), "x-forwarded-for": address },
      ),
    );

    const stored = await rows(path, "SELECT * FROM rate_limits");
    const serialized = JSON.stringify(stored);

    expect(stored.length).toBeGreaterThan(0);
    expect(serialized).not.toContain(address);
    expect(serialized).not.toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
  });
});
