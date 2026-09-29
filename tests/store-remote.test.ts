import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { openStore } from "@/lib/store";

type RecordedConfig = { url: string; authToken?: string };

const recorded = vi.hoisted(() => [] as RecordedConfig[]);

vi.mock("@libsql/client", () => ({
  createClient: (config: RecordedConfig) => {
    recorded.push(config);

    return {
      async execute() {
        return { rows: [], columns: [], columnTypes: [] };
      },
      close() {},
    };
  },
}));

const remoteUrl = "libsql://example.turso.io";
const testToken = "token-de-prueba";
const roots: string[] = [];

function workspace(): string {
  const root = mkdtempSync(join(tmpdir(), "katalis-store-remote-"));

  roots.push(root);

  return root;
}

afterAll(() => {
  for (const root of roots) {
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

describe("a remote libSQL database", () => {
  it("stops before creating a client when its token is empty", async () => {
    recorded.splice(0);

    let message = "";

    try {
      await openStore(remoteUrl, { environment: { TURSO_AUTH_TOKEN: "" } });
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toMatch(/TURSO_AUTH_TOKEN/);
    expect(message).not.toMatch(/example\.turso\.io|token-de-prueba/);
    expect(recorded).toEqual([]);
  });

  it("creates the client with the url and the token", async () => {
    recorded.splice(0);

    const store = await openStore(remoteUrl, { environment: { TURSO_AUTH_TOKEN: testToken } });

    expect(recorded).toEqual([{ url: remoteUrl, authToken: testToken }]);
    await expect(store.countDocuments()).resolves.toBe(0);
    store.close();
  });

  it("creates the client without a token for a local file", async () => {
    recorded.splice(0);

    const store = await openStore(join(workspace(), "store.sqlite"), {
      environment: { TURSO_AUTH_TOKEN: testToken },
    });

    expect(recorded).toHaveLength(1);
    expect(recorded[0]?.url.startsWith("file:")).toBe(true);
    expect(recorded[0]?.authToken).toBeUndefined();
    store.close();
  });
});
