// @vitest-environment node
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { POST as ask } from "@/app/api/ask/route";
import { POST as providersSave } from "@/app/api/admin/providers/save/route";
import { GET as providersState } from "@/app/api/admin/providers/route";
import { POST as providersTest } from "@/app/api/admin/providers/test/route";
import { sessionToken } from "@/lib/admin/session";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import { ingestFolder } from "@/lib/ingest";
import { sealSecret } from "@/lib/secrets";
import { closeSharedStores, sharedStore } from "@/lib/store/instance";
import {
  ADMIN_PASSWORD,
  ADMIN_SECRET,
  adminRequest,
  sessionHeader,
} from "./admin-helpers";
import { providerDouble, type ProviderDouble } from "./provider-double";

// Section 10.1 of the contract, the requirement "No provider error reaches the browser" of
// `specs/provider-settings/spec.md`, and the Blocker B-1 of `katalis-dev/tasks/revision-community-12.md`: a provider
// that echoes the key it received must never have its text leave the server, neither through `/api/ask` nor through
// the test route of the panel. The provider of this file is the local HTTP double: no test opens a connection to a
// real provider and no test opens a private network.
//
// The requirement M-3 of the same review makes the other half of this file: no page and no response of the
// application names a variable of the environment outside "For the installer". The command-line messages that whoever
// installs reads may name it, which is why the messages of `chatProblem()` stay for the scripts.

const repositoryRoot = resolve(import.meta.dirname, "..");
const samples = join(repositoryRoot, "samples");
const encryptionKey = randomBytes(32).toString("base64");
const savedKey = "sk-guardada-0000000000007788";
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
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
  "RATE_LIMIT_PER_IP_PER_HOUR",
  "DAILY_MODEL_CALL_LIMIT",
  "PROVIDER_TEST_TIMEOUT_MS",
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

// A fresh store with the corpus of `samples/`, everything else in the environment at its empty state. The password and
// the secret of the panel are those of the suite, so the admin routes answer instead of refusing the request.
async function corpusStore(overrides: Record<string, string | undefined> = {}): Promise<void> {
  const root = mkdtempSync(join(tmpdir(), "cited-review-"));
  const path = join(root, "store.sqlite");

  roots.push(root);
  setEnvironment({
    DATABASE_URL: path,
    ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: ADMIN_SECRET,
    // The doubles of the suite listen on `127.0.0.1`: the flag is the one of an installation that runs its provider
    // on its own machine, which is what a test does.
    ALLOW_LOCAL_PROVIDERS: "1",
    ...overrides,
  });

  const store = await sharedStore(process.env);

  await ingestFolder(samples, {
    store,
    embeddings,
    limits: { maxBytes: 1024 * 1024, maxPages: 10 },
  });
}

// The key of the panel is sealed and opened with the encryption key of this run, which lives only in the process
// environment: no test writes it in a file and none commits it.
async function panelChat(baseUrl: string): Promise<void> {
  const sealed = sealSecret(savedKey, { ENCRYPTION_KEY: encryptionKey });

  if (sealed.ok === false) {
    throw new Error("the seal of the test failed");
  }

  const store = await sharedStore(process.env);

  await store.saveProviderSetting({
    kind: "chat",
    provider: "deepseek",
    model: "deepseek-flash",
    keyCiphertext: sealed.value,
    keyLast4: "7788",
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

// The address of the panel has to describe an installation the product can write: since task 11.2 the answer path
// validates the stored address again on every call and pins the connection to the address it classified, so the
// gateway of the provider — `DEEPSEEK_BASE_URL` — points at the same double and the server allows local providers.
function withEncryptionKey(address?: string): void {
  setEnvironment({
    DATABASE_URL: process.env["DATABASE_URL"],
    ENCRYPTION_KEY: encryptionKey,
    ...(address === undefined ? {} : { ALLOW_LOCAL_PROVIDERS: "1", DEEPSEEK_BASE_URL: address }),
  });
}

function token(): string {
  return sessionToken(ADMIN_SECRET, new Date());
}

async function openDouble(): Promise<ProviderDouble> {
  const started = await providerDouble((request) => {
    const received = String(request.headers["authorization"] ?? "").replace("Bearer ", "");

    return {
      status: 401,
      body: {
        error: {
          message: `Incorrect API key provided: ${received}. You can find your API key at the provider.`,
          type: "invalid_request_error",
          code: "invalid_api_key",
        },
      },
    };
  });

  doubles.push(started);

  return started;
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

describe("a provider that echoes the saved key", () => {
  it("leaves no part of the key or of the provider text in the answer of /api/ask", async () => {
    const echoing = await openDouble();

    await corpusStore({ ADMIN_SESSION_SECRET: ADMIN_SECRET });
    await panelChat(`${echoing.url}/v1`);
    withEncryptionKey(`${echoing.url}/v1`);

    const response = await ask(askRequest({ question }));
    const text = await response.text();

    expect(response.status, text).toBe(503);
    expect(text).not.toContain(savedKey);
    expect(text).not.toContain("7788");
    expect(text).not.toContain("Incorrect API key");
    expect(text).not.toContain("invalid_request_error");
    expect(text).not.toMatch(/sk-[a-z0-9]/i);
    expect(text.toLowerCase()).toContain("could not answer");
    expect(echoing.requests).toHaveLength(1);
  }, 30_000);

  it("leaves no part of the key or of the provider text in the answer of the test route", async () => {
    const echoing = await openDouble();

    // Ollama is one of the providers that may carry an address of its own, so the case is the text of the provider and
    // not the rule of the address; `ALLOW_LOCAL_PROVIDERS=1` is the flag of an installation with a provider at home.
    await corpusStore({ OLLAMA_BASE_URL: `${echoing.url}/v1` });

    const response = await providersTest(
      adminRequest("http://localhost/api/admin/providers/test", {
        method: "POST",
        headers: sessionHeader(token()),
        body: JSON.stringify({
          kind: "chat",
          provider: "ollama",
          key: savedKey,
          baseUrl: `${echoing.url}/v1`,
        }),
      }),
    );
    const text = await response.text();

    expect(response.status, text).toBe(200);
    expect(JSON.parse(text)).toMatchObject({ status: "ok", ok: false, reason: "rejected_key" });
    expect(text).not.toContain(savedKey);
    expect(text).not.toContain("7788");
    expect(text).not.toContain("Incorrect API key");
    expect(text).not.toMatch(/sk-[a-z0-9]/i);
    expect(echoing.requests).toHaveLength(1);
  }, 30_000);

  it("keeps the key and its ciphertext out of the save answer and of the panel state", async () => {
    const echoing = await openDouble();

    await corpusStore({ OLLAMA_BASE_URL: `${echoing.url}/v1` });

    // The double refuses every key, so the save tests first and stores nothing: the answer may say why in words and
    // never the text of the provider.
    const denied = await providersSave(
      adminRequest("http://localhost/api/admin/providers/save", {
        method: "POST",
        headers: sessionHeader(token()),
        body: JSON.stringify({
          kind: "chat",
          provider: "ollama",
          key: savedKey,
          baseUrl: `${echoing.url}/v1`,
        }),
      }),
    );
    const deniedText = await denied.text();

    expect(deniedText).not.toContain(savedKey);
    expect(deniedText).not.toContain("Incorrect API key");
    expect(deniedText).not.toMatch(/sk-[a-z0-9]/i);

    const state = await providersState(
      adminRequest("http://localhost/api/admin/providers", { headers: sessionHeader(token()) }),
    );
    const stateText = await state.text();

    expect(stateText).not.toContain(savedKey);
    expect(stateText).not.toContain("v1:");

    const store = await sharedStore(process.env);

    expect(await store.readProviderSetting("chat")).toBeNull();
  }, 30_000);
});

describe("no name of a variable outside For the installer", () => {
  it("does not name the missing chat variable in the answer of /api/ask", async () => {
    await corpusStore({
      CHAT_PROVIDER: "openai",
      OPENAI_API_KEY: "",
      EMBEDDINGS_PROVIDER: "fake",
    });

    const response = await ask(askRequest({ question }));
    const text = await response.text();

    expect(response.status, text).toBe(503);
    expect(text).not.toContain("OPENAI_API_KEY");
    expect(text).not.toMatch(/[A-Z][A-Z0-9]*_[A-Z0-9_]+/);
    expect(text.toLowerCase()).toContain("panel");
  }, 30_000);

  it("does not name the missing embeddings variable in the answer of /api/ask", async () => {
    await corpusStore({
      CHAT_PROVIDER: "fake",
      EMBEDDINGS_PROVIDER: "openai",
      EMBEDDINGS_MODEL: "",
      EMBEDDINGS_API_KEY: "",
    });

    const response = await ask(askRequest({ question }));
    const text = await response.text();

    expect(response.status, text).toBe(503);
    expect(text).not.toContain("EMBEDDINGS_PROVIDER");
    expect(text).not.toMatch(/[A-Z][A-Z0-9]*_[A-Z0-9_]+/);
    expect(text.toLowerCase()).toContain("panel");
  }, 30_000);

  it("keeps the variable of the CLI message for whoever installs", async () => {
    const { chatProblem, resolveChat } = await import("@/lib/settings/providers");

    await corpusStore({ CHAT_PROVIDER: "openai", OPENAI_API_KEY: "" });

    const store = await sharedStore(process.env);
    const resolution = await resolveChat({ environment: process.env, store });
    const message = chatProblem(resolution) ?? "";

    expect(message).toContain("OPENAI_API_KEY");
    expect(message).not.toContain(savedKey);
  }, 30_000);
});
