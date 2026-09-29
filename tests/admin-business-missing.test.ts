// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ failure: "no such table: business" }));

vi.mock("@/lib/store/instance", () => ({
  sharedStore: async () => {
    throw new Error(store.failure);
  },
  closeSharedStores: async () => undefined,
}));

afterEach(() => {
  vi.resetModules();
});

describe("readBusiness and the failures of the store", () => {
  it("answers null when the table is missing", async () => {
    store.failure = "SQLITE_ERROR: no such table: business";

    const { readBusiness } = await import("@/lib/settings/business");

    await expect(readBusiness()).resolves.toBeNull();
  });

  it("lets every other failure through", async () => {
    store.failure = "TURSO_AUTH_TOKEN is empty: a remote libSQL database needs its token";

    const { readBusiness } = await import("@/lib/settings/business");

    await expect(readBusiness()).rejects.toThrow("TURSO_AUTH_TOKEN");
  });
});
