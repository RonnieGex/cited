// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/store/instance", () => ({
  sharedStore: async () => {
    throw new Error("no such table: business");
  },
  closeSharedStores: async () => undefined,
}));

afterEach(() => {
  vi.resetModules();
});

describe("readBusiness without the table", () => {
  it("answers null instead of throwing", async () => {
    const { readBusiness } = await import("@/lib/settings/business");

    await expect(readBusiness()).resolves.toBeNull();
  });
});
