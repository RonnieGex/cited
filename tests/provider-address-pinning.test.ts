// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer as createHttpsServer } from "node:https";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateText } from "ai";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { embeddingsFrom } from "@/lib/embeddings/providers";
import { chatModelFrom } from "@/lib/models/providers";
import type { AddressResolver } from "@/lib/providers/address";
import { testProvider } from "@/lib/providers/test";
import { resolveChat, resolveEmbeddings } from "@/lib/settings/providers";
import { closeSharedStores, sharedStore } from "@/lib/store/instance";
import { ADMIN_PASSWORD, ADMIN_SECRET, cleanup, environmentOf } from "./admin-helpers";
import { openAiChatAnswer, providerDouble, type ProviderDouble } from "./provider-double";

// Task 11.2 of the contract, the Major M-2 of `katalis-dev/tasks/revision-community-12b.md` and the requirement "The
// address that was validated is the address that is connected to" of `specs/provider-settings/spec.md`: the host is
// resolved once, every answer is classified, and the connection is opened to the address that was classified and
// never to a second resolution of the same name.
//
// The scenario of the requirement is the first test: the resolver answers a loopback the guard allows
// (`ALLOW_LOCAL_PROVIDERS=1`, the flag of an installation with its own provider) and the real DNS of the machine
// answers another one. The name is `localhost`, so the second resolution of Node — the one the vulnerability used —
// would reach the double that listens on `127.0.0.1` and the key would travel in the header. Nothing here opens a
// real private network: the addresses are loopback, the doubles are local and the classification of the guard is a
// controlled answer of this file.

const doubledKey = "sk-del-doble-0000000000007788";

// The address the guard classifies: loopback too, so `ALLOW_LOCAL_PROVIDERS=1` accepts it, and a port nobody listens
// on, so a connection to it is refused at once and no packet leaves the machine.
const elsewhere = "127.0.0.2";
const listening = "127.0.0.1";

const doubles: ProviderDouble[] = [];
const roots: string[] = [];

function resolverOf(addresses: string[]): AddressResolver {
  return () => Promise.resolve(addresses.map((address) => ({ address, family: 4 })));
}

function portOf(url: string): string {
  return new URL(url).port;
}

function nameOf(url: string): string {
  return url.replace("127.0.0.1", "localhost");
}

afterAll(async () => {
  for (const double of doubles) {
    await double.close();
  }

  await cleanup();

  for (const root of roots) {
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

async function openDouble(): Promise<ProviderDouble> {
  const started = await providerDouble((request) =>
    request.path.endsWith("/api/embed")
      ? { status: 200, body: { embeddings: [new Array<number>(8).fill(0.1)] } }
      : { status: 200, body: openAiChatAnswer("pong") },
  );

  doubles.push(started);

  return started;
}

// The environment of the panel with the flag of an installation that runs its provider on its own machine.
async function panelEnvironment(): Promise<void> {
  await environmentOf({
    ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: ADMIN_SECRET,
    ALLOW_LOCAL_PROVIDERS: "1",
    PROVIDER_TEST_TIMEOUT_MS: "3000",
  });
}

async function panelRow(kind: "chat" | "embeddings", baseUrl: string): Promise<void> {
  const store = await sharedStore(process.env);

  await store.saveProviderSetting({
    kind,
    provider: "ollama",
    model: kind === "chat" ? "llama3.1" : "nomic-embed-text",
    keyCiphertext: null,
    keyLast4: null,
    baseUrl,
    mode: null,
    testedAt: "2026-09-29T10:00:00.000Z",
    testLatencyMs: 20,
  });
}

describe("the test follows the classified address", () => {
  it("never reaches the second answer of the name", async () => {
    await panelEnvironment();

    const double = await openDouble();
    const outcome = await testProvider({
      kind: "chat",
      provider: "ollama",
      key: doubledKey,
      model: "llama3.1",
      baseUrl: `${nameOf(double.url)}/v1`,
      resolve: resolverOf([elsewhere]),
    });

    // The connection went to the address the guard classified, which does not answer; the double that the second
    // resolution of the name would have reached never received the request.
    expect(outcome.ok === false && outcome.reason).toBe("unreachable");
    expect(double.requests).toEqual([]);
  });

  it("keeps the name of the host and the path of the call in the request it makes", async () => {
    await panelEnvironment();

    const double = await openDouble();
    const outcome = await testProvider({
      kind: "chat",
      provider: "ollama",
      key: "",
      model: "llama3.1",
      baseUrl: `${nameOf(double.url)}/v1`,
      resolve: resolverOf([listening]),
    });

    expect(outcome.ok, JSON.stringify(outcome)).toBe(true);
    expect(double.requests).toHaveLength(1);
    expect(double.requests[0]?.path).toBe("/v1/chat/completions");
    expect(double.requests[0]?.headers["host"]).toBe(`localhost:${portOf(double.url)}`);
  });
});

describe("the clients of a base URL of the panel use the pinned transport", () => {
  it("sends no chat request when the classified address is not the one the name resolves to", async () => {
    await panelEnvironment();

    const double = await openDouble();

    await panelRow("chat", `${nameOf(double.url)}/v1`);

    const chat = await resolveChat({ environment: process.env, resolve: resolverOf([elsewhere]) });
    const model = chatModelFrom({
      provider: "ollama",
      model: chat.model,
      key: chat.key,
      baseUrl: chat.baseUrl,
      fetch: chat.fetch,
    });

    await expect(
      generateText({ model, prompt: "ping", maxRetries: 0 }),
    ).rejects.toThrow();
    expect(double.requests).toEqual([]);
  });

  it("answers through the pinned transport when the classified address is the double", async () => {
    await panelEnvironment();

    const double = await openDouble();

    await panelRow("chat", `${nameOf(double.url)}/v1`);

    const chat = await resolveChat({ environment: process.env, resolve: resolverOf([listening]) });
    const model = chatModelFrom({
      provider: "ollama",
      model: chat.model,
      key: chat.key,
      baseUrl: chat.baseUrl,
      fetch: chat.fetch,
    });
    const answered = await generateText({ model, prompt: "ping", maxRetries: 0 });

    expect(answered.text).toContain("pong");
    expect(double.requests).toHaveLength(1);
    expect(double.requests[0]?.path).toBe("/v1/chat/completions");
  });

  it("uses the same transport for the embeddings of the panel", async () => {
    await panelEnvironment();

    const double = await openDouble();

    await panelRow("embeddings", `${nameOf(double.url)}`);

    const refused = await resolveEmbeddings({ environment: process.env, resolve: resolverOf([elsewhere]) });
    const refusedProvider = embeddingsFrom(refused);

    await expect(refusedProvider?.embedQuery("ping")).rejects.toThrow();
    expect(double.requests).toEqual([]);

    const allowed = await resolveEmbeddings({ environment: process.env, resolve: resolverOf([listening]) });
    const vector = await embeddingsFrom(allowed)?.embedQuery("ping");

    expect(vector?.length).toBe(8);
    expect(double.requests).toHaveLength(1);
    expect(double.requests[0]?.path).toBe("/api/embed");
  });

  it("resolves and classifies once per request, never once more for the connection", async () => {
    await panelEnvironment();

    const double = await openDouble();

    await panelRow("chat", `${nameOf(double.url)}/v1`);

    let asked = 0;
    const counting: AddressResolver = () => {
      asked += 1;

      return Promise.resolve([{ address: listening, family: 4 }]);
    };

    const chat = await resolveChat({ environment: process.env, resolve: counting });
    const model = chatModelFrom({
      provider: "ollama",
      model: chat.model,
      key: chat.key,
      baseUrl: chat.baseUrl,
      fetch: chat.fetch,
    });

    await generateText({ model, prompt: "ping", maxRetries: 0 });

    expect(asked).toBe(1);
    expect(double.requests).toHaveLength(1);
  });
});

// The name of the certificate in the handshake is the name of the host and not the address of the connection. The
// server is a local TLS double whose certificate is generated by this run in a temporary folder; it is never
// committed (a private key in the repository is a finding, and gitleaks refuses it) and the test is skipped when the
// machine has no `openssl` to generate it.
function opensslAvailable(): boolean {
  try {
    return spawnSync("openssl", ["version"], { stdio: "ignore" }).status === 0;
  } catch {
    return false;
  }
}

const withOpenssl = opensslAvailable();

describe.runIf(withOpenssl)("the name of TLS", () => {
  const folder = mkdtempSync(join(tmpdir(), "cited-tls-"));
  let tls: ReturnType<typeof createHttpsServer>;
  let tlsPort = "";
  const names: Array<string | undefined> = [];
  let requests = 0;
  let previous: string | undefined;

  beforeAll(async () => {
    roots.push(folder);

    const generated = spawnSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        join(folder, "key.pem"),
        "-out",
        join(folder, "cert.pem"),
        "-days",
        "1",
        "-subj",
        "/CN=localhost",
        "-addext",
        "subjectAltName=DNS:localhost",
      ],
      { stdio: "ignore" },
    );

    if (generated.status !== 0) {
      throw new Error("openssl could not generate the certificate of the test");
    }

    tls = createHttpsServer(
      { key: readFileSync(join(folder, "key.pem")), cert: readFileSync(join(folder, "cert.pem")) },
      (_request, response) => {
        requests += 1;
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(openAiChatAnswer("pong")));
      },
    );

    tls.on("secureConnection", (socket) => {
      names.push(socket.servername);
    });

    await new Promise<void>((resolve) => tls.listen(0, "127.0.0.1", resolve));

    tlsPort = String((tls.address() as { port: number }).port);

    previous = process.env["NODE_TLS_REJECT_UNAUTHORIZED"];
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => tls.close(() => resolve()));

    if (previous === undefined) {
      delete process.env["NODE_TLS_REJECT_UNAUTHORIZED"];
    } else {
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = previous;
    }
  });

  it("goes to the classified address and hands the handshake the name of the host", async () => {
    await panelEnvironment();

    const baseUrl = `https://localhost:${tlsPort}/v1`;
    const refused = await testProvider({
      kind: "chat",
      provider: "ollama",
      key: "",
      model: "llama3.1",
      baseUrl,
      resolve: resolverOf([elsewhere]),
    });

    expect(refused.ok === false && refused.reason).toBe("unreachable");
    expect(requests).toBe(0);

    const accepted = await testProvider({
      kind: "chat",
      provider: "ollama",
      key: "",
      model: "llama3.1",
      baseUrl,
      resolve: resolverOf([listening]),
    });

    expect(accepted.ok, JSON.stringify(accepted)).toBe(true);
    expect(requests).toBe(1);
    expect(names).toEqual(["localhost"]);
  });
});
