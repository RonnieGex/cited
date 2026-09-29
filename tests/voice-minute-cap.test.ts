// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/voice/signed-url/route";
import { closeSharedStores } from "@/lib/store/instance";
import { useVoiceTransport } from "@/lib/voice/transport";
import { elevenLabsDouble } from "./fakes/elevenlabs-api";

// The requirement "The minute cap never lets a session exceed it" of
// `openspec/changes/elevenlabs-voice-agent/specs/voice-agent/spec.md`: a session starts only when its reservation of
// five minutes keeps the reserved total of the UTC day within `DAILY_VOICE_MINUTE_LIMIT`, and a limit below five
// allows no session at all. The first reservation of the day is the case the review of Codex reproduced, because the
// cap lived only in the `ON CONFLICT` branch of the insert. The double of the API answers and records; no test opens a
// socket.

const key = "sk-katalis-de-prueba-que-no-debe-viajar";
const agent = "agent_de_la_prueba";
const secret = "un-secreto-de-herramienta-de-voz-de-prueba";
const limitBelow = 3;
const limitWide = 10;

const roots: string[] = [];
const preserved = new Map<string, string | undefined>();
const managed = [
  "DATABASE_URL",
  "TURSO_DATABASE_URL",
  "VOICE_TOOL_SECRET",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_AGENT_ID",
  "ELEVENLABS_VOICE_ID",
  "DAILY_VOICE_MINUTE_LIMIT",
  "ALLOWED_ORIGINS",
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

  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

async function emptyStore(limit: number): Promise<string> {
  const root = mkdtempSync(join(tmpdir(), "katalis-voice-cap-"));
  const path = join(root, "store.sqlite");

  roots.push(root);

  setEnvironment({
    DATABASE_URL: path,
    VOICE_TOOL_SECRET: secret,
    ELEVENLABS_API_KEY: key,
    ELEVENLABS_AGENT_ID: agent,
    DAILY_VOICE_MINUTE_LIMIT: String(limit),
  });

  const { openStore } = await import("@/lib/store");

  (await openStore(path)).close();

  return path;
}

async function rows(path: string, sql: string): Promise<Array<Record<string, unknown>>> {
  await closeSharedStores();

  const client = createClient({ url: `file:${path}` });
  const found = await client.execute(sql);
  const result = found.rows.map((row) => ({ ...row }));

  client.close();

  return result;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

afterEach(() => {
  useVoiceTransport(null);
});

afterAll(async () => {
  await closeSharedStores();

  for (const [name, value] of preserved) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  for (const root of roots) {
    await new Promise((wake) => setTimeout(wake, 100));
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

describe("a limit below one session", () => {
  it("refuses the first reservation of the day and stores no minute", async () => {
    const path = await emptyStore(limitBelow);
    const { openStore } = await import("@/lib/store");
    const store = await openStore(path);
    const day = today();
    const reserved = await store.reserveVoiceMinutes(day, 5, limitBelow);

    expect(reserved).toBeNull();
    expect(await store.voiceMinutesOn(day)).toBe(0);
    store.close();

    const counted = await rows(path, "SELECT minutes FROM voice_minutes");

    expect(counted).toHaveLength(0);
  });

  it("answers 429 with the reason, and asks ElevenLabs for no signed URL", async () => {
    const path = await emptyStore(limitBelow);
    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    const counted = await rows(path, "SELECT minutes FROM voice_minutes");

    expect(response.status).toBe(429);
    expect(body).toMatchObject({ status: "limited", reason: "below-session", limit: limitBelow });
    expect(String(body["error"])).toContain("DAILY_VOICE_MINUTE_LIMIT=3");
    expect(double.calls).toHaveLength(0);
    expect(counted).toHaveLength(0);
  });

  it("keeps the reason of a day that is spent apart from a limit that never fits", async () => {
    const path = await emptyStore(limitWide);
    const { openStore } = await import("@/lib/store");
    const store = await openStore(path);

    await store.reserveVoiceMinutes(today(), limitWide, limitWide);
    store.close();

    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(429);
    expect(body).toMatchObject({ status: "limited", reason: "spent", limit: limitWide });
    expect(double.calls).toHaveLength(0);
  });
});
