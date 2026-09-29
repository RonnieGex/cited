// @vitest-environment node
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { POST } from "@/app/api/ask/route";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import { ingestFolder } from "@/lib/ingest";
import { sealSecret } from "@/lib/secrets";
import { closeSharedStores, sharedStore } from "@/lib/store/instance";
import { openAiChatAnswer, providerDouble, type ProviderDouble } from "./provider-double";

// The MODIFIED requirement "The chat model is chosen by variables" of `specs/answering/spec.md`: the chat provider is
// the one of the server or, when the server sets none, the one saved in the panel, whose key is opened only in the
// server process. The provider of this test is a local HTTP double: no test calls a real provider.

const repositoryRoot = resolve(import.meta.dirname, "..");
const samples = join(repositoryRoot, "samples");
const encryptionKey = randomBytes(32).toString("base64");
const panelKey = "sk-panel-deepseek-0000000000099001";
const question = "¿Cuánto cuesta una afinación de bicicleta?";
const address = "203.0.113.9";
const embeddings = createFakeEmbeddings();

const roots: string[] = [];
const doubles: ProviderDouble[] = [];
const preserved = new Map<string, string | undefined>();
const managed = [
  "DATABASE_URL",
  "TURSO_DATABASE_URL",
  "EMBEDDINGS_PROVIDER",
  "EMBEDDINGS_MODEL",
  "EMBEDDINGS_API_KEY",
  "EMBEDDINGS_BASE_URL",
  "CHAT_PROVIDER",
  "CHAT_MODEL",
  "DEEPSEEK_API_KEY",
  "OPENAI_API_KEY",
  "ENCRYPTION_KEY",
  "TRUST_PROXY",
  "ADMIN_SESSION_SECRET",
  "RATE_LIMIT_PER_IP_PER_HOUR",
  "DAILY_MODEL_CALL_LIMIT",
  "ALLOW_LOCAL_PROVIDERS",
  "DEEPSEEK_BASE_URL",
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
  process.env["TRUST_PROXY"] = "1";

  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

async function corpusStore(): Promise<string> {
  const root = mkdtempSync(join(tmpdir(), "cited-answering-"));
  const path = join(root, "store.sqlite");

  roots.push(root);
  setEnvironment({ DATABASE_URL: path });

  const store = await sharedStore(process.env);

  await ingestFolder(samples, {
    store,
    embeddings,
    limits: { maxBytes: 1024 * 1024, maxPages: 10 },
  });

  return path;
}

async function panelChat(baseUrl: string): Promise<void> {
  const sealed = sealSecret(panelKey, { ENCRYPTION_KEY: encryptionKey });

  if (sealed.ok === false) {
    throw new Error("the seal failed");
  }

  const store = await sharedStore(process.env);

  await store.saveProviderSetting({
    kind: "chat",
    provider: "deepseek",
    model: "deepseek-flash",
    keyCiphertext: sealed.value,
    keyLast4: "9001",
    baseUrl,
    mode: null,
    testedAt: "2026-09-29T10:00:00.000Z",
    testLatencyMs: 90,
  });
}

function askRequest(body: unknown): Request {
  return new Request("http://localhost/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": address },
    body: JSON.stringify(body),
  });
}

// The key of the panel is sealed and opened with the same encryption key of the run, which lives only in the process
// environment: the test never writes it in a file.
//
// `address` is the address the panel saved. Since task 11.2 the answer path validates that address again before every
// call and pins the connection to the address it classified, so the row has to describe an installation the product
// can actually write: a provider on the machine of the owner, with `ALLOW_LOCAL_PROVIDERS=1`, and the gateway of the
// provider — `DEEPSEEK_BASE_URL` — pointing at the same double. The panel save route refuses any other combination.
function withEncryptionKey(address?: string): void {
  setEnvironment({
    DATABASE_URL: process.env["DATABASE_URL"],
    ENCRYPTION_KEY: encryptionKey,
    ...(address === undefined ? {} : { ALLOW_LOCAL_PROVIDERS: "1", DEEPSEEK_BASE_URL: address }),
  });
}

afterAll(async () => {
  await closeSharedStores();

  for (const double of doubles) {
    await double.close();
  }

  for (const [name, value] of preserved) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  for (const root of roots) {
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

describe("POST /api/ask with the provider saved in the panel", () => {
  it("asks the panel provider with the key opened in the server process", async () => {
    const seen = await providerDouble(() => ({
      status: 200,
      body: openAiChatAnswer("Una afinación de bicicleta cuesta 380 pesos [1]."),
    }));

    doubles.push(seen);

    await corpusStore();
    await panelChat(`${seen.url}/v1`);
    withEncryptionKey(`${seen.url}/v1`);

    const response = await POST(askRequest({ question }));
    const text = await response.text();
    const body = JSON.parse(text) as {
      status: string;
      answer: string;
      citations: Array<{ document: string; heading: string | null }>;
    };

    expect(response.status, text).toBe(200);
    expect(body.status).toBe("answered");
    expect(body.answer).toContain("380 pesos");
    expect(body.citations.length).toBeGreaterThan(0);
    expect(body.citations[0]?.document).toContain("cafe-la-horquilla");
    expect(text).not.toContain(panelKey);
    expect(text).not.toContain("sk-");

    expect(seen.requests).toHaveLength(1);
    expect(seen.requests[0]?.path).toBe("/v1/chat/completions");
    expect(seen.requests[0]?.authorization).toBe(`Bearer ${panelKey}`);
    expect(seen.requests[0]?.body?.["model"]).toBe("deepseek-flash");

    const store = await sharedStore(process.env);
    const row = await store.readProviderSetting("chat");

    expect(JSON.stringify(row)).not.toContain(panelKey);
    expect(row?.keyCiphertext?.startsWith("v1:")).toBe(true);
  });

  it("answers 503 saying the AI is not connected when nothing is configured anywhere", async () => {
    await corpusStore();

    const response = await POST(askRequest({ question }));
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(text.toLowerCase()).toContain("not connected");
    expect(text.toLowerCase()).toContain("panel");
  });

  it("keeps the name of the missing variable of the server out of the answer and never its value", async () => {
    await corpusStore();
    setEnvironment({
      DATABASE_URL: process.env["DATABASE_URL"],
      CHAT_PROVIDER: "openai",
      OPENAI_API_KEY: "",
      ADMIN_SESSION_SECRET: "un-secreto-de-sesion-de-prueba",
    });

    const response = await POST(askRequest({ question }));
    const text = await response.text();

    expect(response.status).toBe(503);
    // Whoever installs reads the name of the variable in the command line (`npm run ask`), which is where
    // `chatProblem()` is read; the public route answers its own sentence (task 10.4 of the contract).
    expect(text).not.toContain("OPENAI_API_KEY");
    expect(text).not.toContain(panelKey);
    expect(text.toLowerCase()).toContain("panel");
  });
});
