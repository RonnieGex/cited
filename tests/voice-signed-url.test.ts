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

// Every scenario of the requirement "The browser never sees the ElevenLabs key" of
// `openspec/changes/elevenlabs-voice-agent/specs/voice-agent/spec.md`. The double of the ElevenLabs API answers and
// records; no test opens a socket.

const key = "sk-katalis-de-prueba-que-no-debe-viajar";
const agent = "agent_de_la_prueba";
const secret = "un-secreto-de-herramienta-de-voz-de-prueba";
const minuteLimit = 10;

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

async function emptyStore(): Promise<string> {
  const root = mkdtempSync(join(tmpdir(), "katalis-voice-url-"));

  roots.push(root);

  const path = join(root, "store.sqlite");

  setEnvironment({
    DATABASE_URL: path,
    VOICE_TOOL_SECRET: secret,
    ELEVENLABS_API_KEY: key,
    ELEVENLABS_AGENT_ID: agent,
    DAILY_VOICE_MINUTE_LIMIT: String(minuteLimit),
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

describe("GET /api/voice/signed-url", () => {
  it("asks the double for a signed URL with the key of the server and returns the URL alone", async () => {
    const path = await emptyStore();
    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);
    setEnvironment({
      DATABASE_URL: path,
      VOICE_TOOL_SECRET: secret,
      ELEVENLABS_API_KEY: key,
      ELEVENLABS_AGENT_ID: agent,
      DAILY_VOICE_MINUTE_LIMIT: String(minuteLimit),
    });

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    const text = JSON.stringify(body);
    const asked = double.callsTo("GET", "/v1/convai/conversation/get-signed-url");

    expect(response.status).toBe(200);
    expect(Object.keys(body)).toEqual(["url"]);
    expect(String(body["url"])).toContain("agent_id=");
    expect(text).not.toContain(key);
    expect(text).not.toContain("xi-api-key");
    expect(asked).toHaveLength(1);
    expect(asked[0]?.headers["xi-api-key"]).toBe(key);
    expect(new URL(String(asked[0]?.url)).searchParams.get("agent_id")).toBe(agent);
  });

  it("prefers the agent id the panel stored over the variable of the environment", async () => {
    const path = await emptyStore();

    setEnvironment({
      DATABASE_URL: path,
      VOICE_TOOL_SECRET: secret,
      ELEVENLABS_API_KEY: key,
      ELEVENLABS_AGENT_ID: "",
      DAILY_VOICE_MINUTE_LIMIT: String(minuteLimit),
    });

    const { openStore } = await import("@/lib/store");

    const store = await openStore(path);

    await store.saveVoiceAgent({
      agentId: "agent_del_panel",
      secretId: "secret_1",
      toolId: "tool_1",
      sourcesToolId: "tool_2",
      language: "en",
    });
    store.close();

    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);

    const response = await GET();
    const asked = double.callsTo("GET", "/v1/convai/conversation/get-signed-url");

    expect(response.status).toBe(200);
    expect(new URL(String(asked[0]?.url)).searchParams.get("agent_id")).toBe("agent_del_panel");
  });

  it("answers 503 naming the variable of the missing key and never its value", async () => {
    const path = await emptyStore();

    setEnvironment({
      DATABASE_URL: path,
      VOICE_TOOL_SECRET: secret,
      ELEVENLABS_API_KEY: "",
      ELEVENLABS_AGENT_ID: agent,
      DAILY_VOICE_MINUTE_LIMIT: String(minuteLimit),
    });

    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(text).toContain("ELEVENLABS_API_KEY");
    expect(text).not.toContain(key);
    expect(double.calls).toHaveLength(0);
  });

  it("answers 503 naming the agent when neither the variable nor the panel has one", async () => {
    const path = await emptyStore();

    setEnvironment({
      DATABASE_URL: path,
      VOICE_TOOL_SECRET: secret,
      ELEVENLABS_API_KEY: key,
      ELEVENLABS_AGENT_ID: "",
      DAILY_VOICE_MINUTE_LIMIT: String(minuteLimit),
    });

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(text).toContain("ELEVENLABS_AGENT_ID");
    expect(text).not.toContain(key);
  });

  it("answers 503 and keeps the key out when ElevenLabs refuses", async () => {
    const path = await emptyStore();

    setEnvironment({
      DATABASE_URL: path,
      VOICE_TOOL_SECRET: secret,
      ELEVENLABS_API_KEY: key,
      ELEVENLABS_AGENT_ID: agent,
      DAILY_VOICE_MINUTE_LIMIT: String(minuteLimit),
    });

    const double = elevenLabsDouble({
      failures: { "GET /v1/convai/conversation/get-signed-url": 401 },
    });

    useVoiceTransport(double.transport);

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(text).not.toContain(key);
    expect(text).not.toContain("xi-api-key");
  });
});

describe("the daily cap of voice minutes", () => {
  it("counts a conservative five minutes per session and answers 429 at the ceiling", async () => {
    const path = await emptyStore();

    setEnvironment({
      DATABASE_URL: path,
      VOICE_TOOL_SECRET: secret,
      ELEVENLABS_API_KEY: key,
      ELEVENLABS_AGENT_ID: agent,
      DAILY_VOICE_MINUTE_LIMIT: String(minuteLimit),
    });

    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);

    const first = await GET();
    const second = await GET();
    const third = await GET();
    const day = new Date().toISOString().slice(0, 10);
    const counted = await rows(path, `SELECT minutes FROM voice_minutes WHERE day = '${day}'`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(await third.text()).not.toContain(key);
    expect(Number(counted[0]?.["minutes"] ?? 0)).toBe(minuteLimit);
    expect(double.callsTo("GET", "/v1/convai/conversation/get-signed-url")).toHaveLength(2);
  });

  it("answers 429 before asking ElevenLabs when the day is already spent", async () => {
    const path = await emptyStore();

    setEnvironment({
      DATABASE_URL: path,
      VOICE_TOOL_SECRET: secret,
      ELEVENLABS_API_KEY: key,
      ELEVENLABS_AGENT_ID: agent,
      DAILY_VOICE_MINUTE_LIMIT: String(minuteLimit),
    });

    const { openStore } = await import("@/lib/store");

    const store = await openStore(path);
    const day = new Date().toISOString().slice(0, 10);

    await store.reserveVoiceMinutes(day, minuteLimit, minuteLimit);
    store.close();

    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);

    const response = await GET();

    expect(response.status).toBe(429);
    expect(double.calls).toHaveLength(0);
  });

  it("keeps a bucket per UTC day", async () => {
    const path = await emptyStore();

    setEnvironment({
      DATABASE_URL: path,
      VOICE_TOOL_SECRET: secret,
      ELEVENLABS_API_KEY: key,
      ELEVENLABS_AGENT_ID: agent,
      DAILY_VOICE_MINUTE_LIMIT: String(minuteLimit),
    });

    const { openStore } = await import("@/lib/store");

    const store = await openStore(path);

    await store.reserveVoiceMinutes("2026-09-28", 5, minuteLimit);
    await store.reserveVoiceMinutes("2026-09-29", 5, minuteLimit);
    store.close();

    const counted = await rows(path, "SELECT day, minutes FROM voice_minutes ORDER BY day");

    expect(counted.map((row) => `${String(row["day"])}=${String(row["minutes"])}`)).toEqual([
      "2026-09-28=5",
      "2026-09-29=5",
    ]);
  });
});
