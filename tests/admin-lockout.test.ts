// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  LOGIN_MAX_FAILURES,
  LOGIN_WINDOW_MINUTES,
  clearFailures,
  lockState,
  registerFailure,
} from "@/lib/admin/lockout";
import { hashIp } from "@/lib/guards/ip";
import { openStore, type Store } from "@/lib/store";

const address = "203.0.113.9";
const other = "198.51.100.4";
const salt = "sal-de-prueba";
const start = new Date("2026-09-29T12:00:00.000Z");

const roots: string[] = [];
let store: Store;
let databasePath: string;

function at(minutes: number): Date {
  return new Date(start.getTime() + minutes * 60 * 1000);
}

beforeAll(async () => {
  const root = mkdtempSync(join(tmpdir(), "katalis-lockout-"));

  roots.push(root);
  databasePath = join(root, "store.sqlite");
  store = await openStore(databasePath);
});

afterAll(async () => {
  store.close();

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

describe("the lockout of the login", () => {
  it("locks the sixth attempt for fifteen minutes", async () => {
    const ipHash = hashIp(address, salt);
    const fresh = await lockState(store, ipHash, start);

    expect(LOGIN_MAX_FAILURES).toBe(5);
    expect(LOGIN_WINDOW_MINUTES).toBe(15);
    expect(fresh).toEqual({ locked: false, retryAfterSeconds: 0, failures: 0 });

    for (let attempt = 1; attempt <= LOGIN_MAX_FAILURES; attempt += 1) {
      const state = await registerFailure(store, ipHash, start);

      expect(state.failures, `attempt ${attempt}`).toBe(attempt);
      expect(state.locked, `attempt ${attempt}`).toBe(attempt === LOGIN_MAX_FAILURES);
    }

    const locked = await lockState(store, ipHash, at(1));

    expect(locked.locked).toBe(true);
    expect(locked.failures).toBe(LOGIN_MAX_FAILURES);
    expect(locked.retryAfterSeconds).toBeGreaterThan(0);
    expect(locked.retryAfterSeconds).toBeLessThanOrEqual(LOGIN_WINDOW_MINUTES * 60);

    const last = await lockState(store, ipHash, at(LOGIN_WINDOW_MINUTES - 1));

    expect(last.locked).toBe(true);
    expect(last.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("forgets the failures of a window older than fifteen minutes", async () => {
    const ipHash = hashIp("203.0.113.77", salt);
    const moment = new Date("2026-09-29T14:00:00.000Z");

    for (let attempt = 1; attempt <= LOGIN_MAX_FAILURES; attempt += 1) {
      await registerFailure(store, ipHash, moment);
    }

    const later = new Date(moment.getTime() + (LOGIN_WINDOW_MINUTES + 1) * 60 * 1000);

    expect((await lockState(store, ipHash, later)).locked).toBe(false);

    const again = await registerFailure(store, ipHash, later);

    expect(again.failures).toBe(1);
    expect(again.locked).toBe(false);
  });

  it("keeps one bucket per address and forgets it when the owner enters", async () => {
    const ipHash = hashIp(other, salt);

    for (let attempt = 1; attempt <= LOGIN_MAX_FAILURES; attempt += 1) {
      await registerFailure(store, ipHash, start);
    }

    expect((await lockState(store, ipHash, at(1))).locked).toBe(true);
    expect((await lockState(store, hashIp("203.0.113.200", salt), at(1))).locked).toBe(false);

    await clearFailures(store, ipHash);

    expect(await lockState(store, ipHash, at(1))).toEqual({
      locked: false,
      retryAfterSeconds: 0,
      failures: 0,
    });

    const client = createClient({ url: `file:${databasePath}` });
    const stored = await client.execute("SELECT * FROM login_attempts");

    client.close();

    const serialized = JSON.stringify(stored.rows.map((row) => ({ ...row })));

    expect(serialized).not.toContain(address);
    expect(serialized).not.toContain(other);
  });

  it("clears the windows that expired before an attempt", async () => {
    const ipHash = hashIp("203.0.113.150", salt);
    const old = new Date("2026-09-29T08:00:00.000Z");

    await registerFailure(store, ipHash, old);
    await registerFailure(store, hashIp("203.0.113.151", salt), at(30));

    const client = createClient({ url: `file:${databasePath}` });
    const remaining = await client.execute({
      sql: "SELECT ip_hash FROM login_attempts WHERE window_start < ?",
      args: [at(29).toISOString()],
    });

    client.close();

    expect(remaining.rows.length).toBe(0);
  });
});
