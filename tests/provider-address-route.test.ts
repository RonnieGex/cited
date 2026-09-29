// @vitest-environment node
import { afterAll, describe, expect, it } from "vitest";
import { POST as providersSave } from "@/app/api/admin/providers/save/route";
import { POST as providersTest } from "@/app/api/admin/providers/test/route";
import { sessionToken } from "@/lib/admin/session";
import {
  ADMIN_PASSWORD,
  ADMIN_SECRET,
  adminRequest,
  cleanup,
  environmentOf,
  sessionHeader,
} from "./admin-helpers";
import { openAiChatAnswer, providerDouble, type ProviderDouble } from "./provider-double";

// Section 10.2 of the contract, through the real routes: the Major M-1 of `katalis-dev/tasks/revision-community-12.md`
// sent the key to a service that listened only on loopback. The address of every case here is a local HTTP double of
// the suite on `127.0.0.1`: the test proves that the service receives **nothing**, and it never opens a connection to
// a private network, to the metadata service or to a real provider.

const doubleKey = "sk-del-doble-0000000000007788";
const metadata = ["169", "254", "169", "254"].join(".");
const privateAddress = ["10", "0", "0", "5"].join(".");
const doubles: ProviderDouble[] = [];

// The panel needs its own password in the environment for the routes to answer at all; the secret of the session is
// the one the suite signs its token with.
const ADMIN_PASSWORD_ENV = {
  ADMIN_PASSWORD,
  ADMIN_SESSION_SECRET: ADMIN_SECRET,
} as const;

afterAll(async () => {
  for (const double of doubles) {
    await double.close();
  }

  await cleanup();
});

async function double(): Promise<ProviderDouble> {
  const started = await providerDouble(() => ({ status: 200, body: openAiChatAnswer() }));

  doubles.push(started);

  return started;
}

function token(): string {
  return sessionToken(ADMIN_SECRET, new Date());
}

function test(body: unknown): Promise<Response> {
  return providersTest(
    adminRequest("http://localhost/api/admin/providers/test", {
      method: "POST",
      headers: sessionHeader(token()),
      body: JSON.stringify(body),
    }),
  );
}

function save(body: unknown): Promise<Response> {
  return providersSave(
    adminRequest("http://localhost/api/admin/providers/save", {
      method: "POST",
      headers: sessionHeader(token()),
      body: JSON.stringify(body),
    }),
  );
}

describe("the address of the provider through the routes", () => {
  it("refuses an address of the internal network and opens no connection", async () => {
    await environmentOf({ ...ADMIN_PASSWORD_ENV });

    const internal = await double();

    for (const baseUrl of [
      `${internal.url.replace("127.0.0.1", "0.0.0.0")}/v1`,
      `${internal.url.replace("127.0.0.1", privateAddress)}/v1`,
      `${internal.url.replace("127.0.0.1", metadata)}/v1`,
      `${internal.url}/v1`,
    ]) {
      const response = await test({ kind: "chat", provider: "ollama", key: "", baseUrl });
      const body = (await response.json()) as Record<string, unknown>;

      expect(response.status, baseUrl).toBe(400);
      expect(body["reason"], baseUrl).toBe("address_not_allowed");
      expect(body["ok"], baseUrl).toBe(false);
    }

    // The double listened on loopback the whole time and no branch of the route reached it.
    expect(internal.requests).toEqual([]);
  });

  it("refuses the same address in the save and stores nothing", async () => {
    await environmentOf({ ...ADMIN_PASSWORD_ENV });

    const internal = await double();
    const response = await save({
      kind: "chat",
      provider: "ollama",
      key: "",
      baseUrl: `${internal.url}/v1`,
    });
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(body["reason"]).toBe("address_not_allowed");
    expect(body["saved"]).toBe(false);
    expect(internal.requests).toEqual([]);
  });

  it("refuses a cloud provider that names an address the server did not set", async () => {
    const elsewhere = await double();

    // The server says its OpenAI answers somewhere else; the browser sends an address of its own. The catalogue of a
    // cloud provider is the address of the server, and the value of the body is not one of them.
    await environmentOf({
      ...ADMIN_PASSWORD_ENV,
      OPENAI_BASE_URL: "https://api.openai.com/v1",
      ALLOW_LOCAL_PROVIDERS: "1",
    });

    const response = await test({
      kind: "chat",
      provider: "openai",
      key: doubleKey,
      baseUrl: `${elsewhere.url}/v1`,
    });

    expect(response.status).toBe(400);
    expect(elsewhere.requests).toEqual([]);
  });

  it("tests the local double when the server sets ALLOW_LOCAL_PROVIDERS=1", async () => {
    await environmentOf({ ...ADMIN_PASSWORD_ENV, ALLOW_LOCAL_PROVIDERS: "1" });

    const allowed = await double();
    const response = await test({
      kind: "chat",
      provider: "ollama",
      key: "",
      model: "llama3.1",
      baseUrl: `${allowed.url}/v1`,
    });
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body["ok"]).toBe(true);
    expect(allowed.requests).toHaveLength(1);
  });

  it("does not follow a redirect to another address", async () => {
    await environmentOf({ ...ADMIN_PASSWORD_ENV, ALLOW_LOCAL_PROVIDERS: "1" });

    const target = await double();
    const redirecting = await providerDouble(() => ({
      status: 302,
      body: { location: `${target.url}/v1/chat/completions` },
    }));

    doubles.push(redirecting);

    const response = await test({
      kind: "chat",
      provider: "ollama",
      key: "",
      model: "llama3.1",
      baseUrl: `${redirecting.url}/v1`,
    });
    const body = (await response.json()) as Record<string, unknown>;

    expect(body["ok"]).toBe(false);
    expect(body["reason"]).toBe("unreachable");
    expect(target.requests).toEqual([]);
  });
});
