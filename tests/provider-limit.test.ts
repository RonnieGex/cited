// @vitest-environment node
import { randomBytes } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { POST as providersTest } from "@/app/api/admin/providers/test/route";
import { PROVIDER_TESTS_PER_HOUR, reserveProviderTest } from "@/lib/admin/provider-panel";
import { sessionToken } from "@/lib/admin/session";
import { sharedStore } from "@/lib/store/instance";
import {
  ADMIN_PASSWORD,
  ADMIN_SECRET,
  adminRequest,
  cleanup,
  environmentOf,
  sessionHeader,
} from "./admin-helpers";
import { openAiChatAnswer, providerDouble, type ProviderDouble } from "./provider-double";

// Section 10.3 of the contract and the requirement "The test limit holds under concurrency" of
// `specs/provider-settings/spec.md`: the Major M-2 of `katalis-dev/tasks/revision-community-12.md` was
// `RATE_REPRO allowed=40 limited=0 provider_calls=40`, because the routes read the counter and incremented it in two
// separate operations. The provider of this file is the local HTTP double of the suite: no test reaches a real
// provider.

const encryptionKey = randomBytes(32).toString("base64");
const doubles: ProviderDouble[] = [];

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

describe("the limit of twenty tests per hour", () => {
  it("reserves the twentieth slot and refuses the twenty-first", async () => {
    await environmentOf({ ADMIN_PASSWORD, ADMIN_SESSION_SECRET: ADMIN_SECRET });

    const store = await sharedStore(process.env);
    const now = new Date("2026-09-29T10:00:00.000Z");
    const results: boolean[] = [];

    for (let attempt = 1; attempt <= PROVIDER_TESTS_PER_HOUR + 1; attempt += 1) {
      const slot = await reserveProviderTest(store, now);

      results.push(slot.allowed);
    }

    expect(results.filter((allowed) => allowed)).toHaveLength(PROVIDER_TESTS_PER_HOUR);
    expect(results.at(-1)).toBe(false);
  });

  it("reserves exactly twenty slots when forty arrive at the same time", async () => {
    await environmentOf({ ADMIN_PASSWORD, ADMIN_SESSION_SECRET: ADMIN_SECRET });

    const store = await sharedStore(process.env);
    const now = new Date("2026-09-29T10:00:00.000Z");
    const slots = await Promise.all(
      Array.from({ length: 40 }, () => reserveProviderTest(store, now)),
    );
    const allowed = slots.filter((slot) => slot.allowed).length;

    expect(allowed).toBe(PROVIDER_TESTS_PER_HOUR);
  });

  it("lets exactly twenty of forty concurrent requests reach the provider", async () => {
    const seen = await double();

    await environmentOf({
      ADMIN_PASSWORD,
      ADMIN_SESSION_SECRET: ADMIN_SECRET,
      ENCRYPTION_KEY: encryptionKey,
      ALLOW_LOCAL_PROVIDERS: "1",
      OLLAMA_BASE_URL: `${seen.url}/v1`,
    });

    const responses = await Promise.all(
      Array.from({ length: 40 }, () =>
        test({
          kind: "chat",
          provider: "ollama",
          key: "",
          model: "llama3.1",
          baseUrl: `${seen.url}/v1`,
        }),
      ),
    );
    const allowed = responses.filter((response) => response.status === 200).length;
    const limited = responses.filter((response) => response.status === 429).length;

    expect(allowed).toBe(PROVIDER_TESTS_PER_HOUR);
    expect(limited).toBe(40 - PROVIDER_TESTS_PER_HOUR);
    expect(seen.requests).toHaveLength(PROVIDER_TESTS_PER_HOUR);

    const body = (await responses[0]?.json()) as Record<string, unknown>;

    expect(body["ok"]).toBe(true);
  }, 60_000);

  it("keeps the twentieth slot when the requests arrive in bursts of one window", async () => {
    await environmentOf({ ADMIN_PASSWORD, ADMIN_SESSION_SECRET: ADMIN_SECRET });

    const store = await sharedStore(process.env);
    const first = new Date("2026-09-29T10:00:00.000Z");
    const second = new Date("2026-09-29T11:00:00.000Z");

    const one = await Promise.all(Array.from({ length: 25 }, () => reserveProviderTest(store, first)));
    const two = await Promise.all(Array.from({ length: 3 }, () => reserveProviderTest(store, second)));

    expect(one.filter((slot) => slot.allowed)).toHaveLength(PROVIDER_TESTS_PER_HOUR);
    expect(two.filter((slot) => slot.allowed)).toHaveLength(3);
  });
});
