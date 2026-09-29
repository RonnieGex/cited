// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { DIRECT_BUCKET, clientIp, hashIp } from "@/lib/guards/ip";
import { DEFAULT_LIMITS, resolveLimits } from "@/lib/guards/limits";
import { PURGE_INTERVAL_MS, purgeStore, shouldPurge } from "@/lib/guards/retention";
import { openStore, type Store } from "@/lib/store";

const roots: string[] = [];
const stores: Store[] = [];

function workspace(): string {
  const root = mkdtempSync(join(tmpdir(), "katalis-guards-"));

  roots.push(root);

  return root;
}

async function emptyStore(): Promise<Store> {
  const opened = await openStore(join(workspace(), "store.sqlite"));

  stores.push(opened);

  return opened;
}

function request(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/ask", { method: "POST", headers });
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

afterAll(async () => {
  for (const opened of stores) {
    opened.close();
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

    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      continue;
    }
  }
});

describe("the limits of the owner", () => {
  it("uses the defaults of the contract with an empty environment", () => {
    expect(DEFAULT_LIMITS).toEqual({
      maxQuestionChars: 1000,
      rateLimitPerIpPerHour: 30,
      dailyModelCallLimit: 500,
      maxAnswerTokens: 600,
      conversationRetentionDays: 30,
    });
    expect(resolveLimits({})).toEqual(DEFAULT_LIMITS);
  });

  it("reads every variable of the environment", () => {
    expect(
      resolveLimits({
        MAX_QUESTION_CHARS: "250",
        RATE_LIMIT_PER_IP_PER_HOUR: "5",
        DAILY_MODEL_CALL_LIMIT: "7",
        MAX_ANSWER_TOKENS: "120",
        CONVERSATION_RETENTION_DAYS: "3",
      }),
    ).toEqual({
      maxQuestionChars: 250,
      rateLimitPerIpPerHour: 5,
      dailyModelCallLimit: 7,
      maxAnswerTokens: 120,
      conversationRetentionDays: 3,
    });
  });

  it("keeps the default when a value is empty, zero, negative or not a number", () => {
    for (const value of ["", "0", "-3", "nonsense", "1.5"]) {
      expect(resolveLimits({ MAX_QUESTION_CHARS: value }).maxQuestionChars, value).toBe(1000);
      expect(resolveLimits({ RATE_LIMIT_PER_IP_PER_HOUR: value }).rateLimitPerIpPerHour, value).toBe(
        30,
      );
      expect(resolveLimits({ DAILY_MODEL_CALL_LIMIT: value }).dailyModelCallLimit, value).toBe(500);
      expect(resolveLimits({ MAX_ANSWER_TOKENS: value }).maxAnswerTokens, value).toBe(600);
      expect(
        resolveLimits({ CONVERSATION_RETENTION_DAYS: value }).conversationRetentionDays,
        value,
      ).toBe(30);
    }
  });
});

describe("the address of the visitor", () => {
  it("hashes the address with the salt and never keeps it in clear", () => {
    const hashed = hashIp("203.0.113.7", "sal-de-prueba");

    expect(hashed).toMatch(/^[0-9a-f]{64}$/);
    expect(hashed).not.toContain("203.0.113.7");
    expect(hashIp("203.0.113.7", "sal-de-prueba")).toBe(hashed);
    expect(hashIp("203.0.113.8", "sal-de-prueba")).not.toBe(hashed);
    expect(hashIp("203.0.113.7", "otra-sal")).not.toBe(hashed);
  });

  it("uses a random per-process salt when ADMIN_SESSION_SECRET is missing", () => {
    expect(hashIp("203.0.113.7", undefined)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashIp("203.0.113.7", "")).toBe(hashIp("203.0.113.7", undefined));
    expect(hashIp("203.0.113.7", undefined)).not.toBe(hashIp("203.0.113.7", "sal-de-prueba"));
  });

  it("reads x-forwarded-for only when TRUST_PROXY is 1", () => {
    const forwarded = request({
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      "x-real-ip": "10.0.0.2",
    });

    expect(clientIp(forwarded, { TRUST_PROXY: "1" })).toBe("203.0.113.7");
    expect(clientIp(forwarded, { TRUST_PROXY: "true" })).toBe("203.0.113.7");
    expect(clientIp(forwarded, {})).toBe(DIRECT_BUCKET);
    expect(clientIp(forwarded, { TRUST_PROXY: "0" })).toBe(DIRECT_BUCKET);
    expect(clientIp(forwarded, { TRUST_PROXY: "no" })).toBe(DIRECT_BUCKET);
  });

  it("falls back to x-real-ip and then to a single bucket behind a proxy", () => {
    expect(clientIp(request({ "x-real-ip": "203.0.113.9" }), { TRUST_PROXY: "1" })).toBe(
      "203.0.113.9",
    );
    expect(clientIp(request({}), { TRUST_PROXY: "1" })).toBe("unknown");
  });
});

describe("the purge of what expired", () => {
  it("runs at most once per hour", () => {
    const now = new Date("2026-09-29T12:00:00.000Z");

    expect(PURGE_INTERVAL_MS).toBe(60 * 60 * 1000);
    expect(shouldPurge(null, now)).toBe(true);
    expect(shouldPurge(now.getTime() - 30 * 60 * 1000, now)).toBe(false);
    expect(shouldPurge(now.getTime() - 61 * 60 * 1000, now)).toBe(true);
  });

  it("deletes the conversations older than the retention and keeps the recent ones", async () => {
    const store = await emptyStore();

    await store.appendTurn({
      sessionId: "vieja",
      question: "pregunta vieja",
      answer: "respuesta vieja [1]",
      createdAt: daysAgo(40),
    });
    await store.appendTurn({
      sessionId: "nueva",
      question: "pregunta nueva",
      answer: "respuesta nueva [1]",
    });

    const report = await purgeStore(store, {
      now: new Date(),
      retentionDays: 30,
      lastPurgeAt: null,
    });

    expect(report.purged).toBe(true);
    expect(report.conversations).toBe(1);
    expect(report.lastPurgeAt).toBeGreaterThan(0);
    await expect(store.turnsOf("vieja", 6)).resolves.toEqual([]);
    await expect(store.turnsOf("nueva", 6)).resolves.toHaveLength(1);
  });

  it("forgets the windows of past hours and the days before today", async () => {
    const store = await emptyStore();
    const now = new Date();
    const currentWindow = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()),
    ).toISOString();
    const pastWindow = new Date(Date.parse(currentWindow) - 3 * 60 * 60 * 1000).toISOString();
    const today = now.toISOString().slice(0, 10);
    const yesterday = new Date(Date.parse(today) - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await store.recordQuestion("a".repeat(64), pastWindow);
    await store.recordQuestion("a".repeat(64), currentWindow);
    await store.recordModelCall(yesterday);
    await store.recordModelCall(today);

    const report = await purgeStore(store, { now, retentionDays: 30, lastPurgeAt: null });

    expect(report.windows).toBe(1);
    expect(report.days).toBe(1);
    await expect(store.questionsInWindow("a".repeat(64), pastWindow)).resolves.toBe(0);
    await expect(store.questionsInWindow("a".repeat(64), currentWindow)).resolves.toBe(1);
    await expect(store.modelCallsOn(yesterday)).resolves.toBe(0);
    await expect(store.modelCallsOn(today)).resolves.toBe(1);
  });

  it("does not touch the store when the last purge was less than an hour ago", async () => {
    const store = await emptyStore();

    await store.appendTurn({
      sessionId: "vieja",
      question: "pregunta vieja",
      answer: "respuesta vieja [1]",
      createdAt: daysAgo(40),
    });

    const report = await purgeStore(store, {
      now: new Date(),
      retentionDays: 30,
      lastPurgeAt: Date.now() - 5 * 60 * 1000,
    });

    expect(report.purged).toBe(false);
    expect(report.conversations).toBe(0);
    await expect(store.turnsOf("vieja", 6)).resolves.toHaveLength(1);
  });
});

describe("the counters of the store", () => {
  it("counts the questions of a window and the model calls of a day", async () => {
    const store = await emptyStore();

    await expect(store.recordQuestion("b".repeat(64), "2026-09-29T12:00:00.000Z")).resolves.toBe(1);
    await expect(store.recordQuestion("b".repeat(64), "2026-09-29T12:00:00.000Z")).resolves.toBe(2);
    await expect(store.questionsInWindow("b".repeat(64), "2026-09-29T12:00:00.000Z")).resolves.toBe(
      2,
    );
    await expect(store.questionsInWindow("c".repeat(64), "2026-09-29T12:00:00.000Z")).resolves.toBe(
      0,
    );

    await expect(store.recordModelCall("2026-09-29")).resolves.toBe(1);
    await expect(store.recordModelCall("2026-09-29")).resolves.toBe(2);
    await expect(store.modelCallsOn("2026-09-29")).resolves.toBe(2);
    await expect(store.modelCallsOn("2026-09-28")).resolves.toBe(0);
  });

  it("numbers the turns of a session and returns the last ones in order", async () => {
    const store = await emptyStore();

    for (let turn = 1; turn <= 8; turn += 1) {
      await expect(
        store.appendTurn({
          sessionId: "sesion",
          question: `pregunta ${turn}`,
          answer: `respuesta ${turn} [1]`,
        }),
      ).resolves.toBe(turn);
    }

    const last = await store.turnsOf("sesion", 6);

    expect(last).toHaveLength(6);
    expect(last[0]?.turn).toBe(3);
    expect(last.at(-1)?.turn).toBe(8);
    expect(last[0]?.question).toBe("pregunta 3");
    expect(last.at(-1)?.answer).toBe("respuesta 8 [1]");
    await expect(store.turnsOf("otra", 6)).resolves.toEqual([]);
  });
});
