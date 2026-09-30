// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { closeSharedStores } from "@/lib/store/instance";
import { provisionVoiceAgent } from "@/lib/voice/agent";
import { useVoiceTransport } from "@/lib/voice/transport";
import type { Business } from "@/lib/settings/business";
import { elevenLabsDouble, type RecordedCall } from "./fakes/elevenlabs-api";

// Every scenario of the requirement "The voice agent is created in one click" of
// `openspec/changes/elevenlabs-voice-agent/specs/voice-agent/spec.md`, against the double of the ElevenLabs API:
// the shapes are the ones of `~/.claude/playbooks/elevenlabs-agentes.md` and of the API reference, and the languages
// are the ones of the current documentation of ElevenLabs
// (https://elevenlabs.io/docs/eleven-agents/customization/voice/customization/language).

const key = "sk-katalis-de-prueba-que-no-debe-viajar";
const secret = "un-secreto-de-herramienta-de-voz-de-prueba";

const roots: string[] = [];
const preserved = new Map<string, string | undefined>();
const managed = [
  "DATABASE_URL",
  "TURSO_DATABASE_URL",
  "VOICE_TOOL_SECRET",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_AGENT_ID",
  "ELEVENLABS_VOICE_ID",
  "ALLOWED_ORIGINS",
  "DAILY_VOICE_MINUTE_LIMIT",
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

async function freshStore(overrides: Record<string, string | undefined> = {}): Promise<string> {
  const root = mkdtempSync(join(tmpdir(), "katalis-voice-agent-"));

  roots.push(root);

  const path = join(root, "store.sqlite");

  setEnvironment({
    DATABASE_URL: path,
    VOICE_TOOL_SECRET: secret,
    ELEVENLABS_API_KEY: key,
    ...overrides,
  });

  const { openStore } = await import("@/lib/store");

  (await openStore(path)).close();

  return path;
}

function business(overrides: Partial<Business> = {}): Business {
  return {
    name: "Café La Horquilla",
    hasLogo: false,
    primaryColor: "#ddf469",
    tone: "",
    language: "en",
    forbiddenTopics: [],
    welcome: { en: "Ask anything about this business", es: "Pregunta lo que quieras" },
    updatedAt: "2026-09-29T00:00:00.000Z",
    ...overrides,
  };
}

function body(call: RecordedCall | undefined): Record<string, unknown> {
  return (call?.body as Record<string, unknown> | null) ?? {};
}

function toolConfigOf(call: RecordedCall | undefined): Record<string, unknown> {
  return (body(call)["tool_config"] as Record<string, unknown> | undefined) ?? {};
}

async function provision(
  input: { origins?: string[]; business?: Business | null } = {},
): Promise<Awaited<ReturnType<typeof provisionVoiceAgent>>> {
  return provisionVoiceAgent({
    environment: process.env,
    business: input.business === undefined ? business() : input.business,
    origins: input.origins ?? ["https://cited.example"],
  });
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

describe("the one-click agent", () => {
  it("creates the secret, the two tools and the agent, and stores the agent id", async () => {
    const path = await freshStore();
    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);
    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret, ELEVENLABS_API_KEY: key });

    const outcome = await provision();
    const secrets = double.callsTo("POST", "/v1/convai/secrets");
    const tools = double.callsTo("POST", "/v1/convai/tools");
    const agents = double.callsTo("POST", "/v1/convai/agents/create");

    expect(outcome.status).toBe("ok");

    if (outcome.status !== "ok") {
      return;
    }

    expect(outcome.created).toBe(true);
    expect(secrets).toHaveLength(1);
    expect(body(secrets[0])).toMatchObject({ type: "new", value: `Bearer ${secret}` });
    expect(tools).toHaveLength(2);
    expect(agents).toHaveLength(1);
    expect(outcome.agentId).toBe("agent_katalis_4");

    const webhook = tools.find((call) => toolConfigOf(call)["type"] === "webhook");
    const client = tools.find((call) => toolConfigOf(call)["type"] === "client");
    const webhookConfig = toolConfigOf(webhook);
    const schema = webhookConfig["api_schema"] as Record<string, unknown>;
    const headers = schema["request_headers"] as Record<string, { secret_id?: string }>;
    const requestSchema = schema["request_body_schema"] as {
      required?: string[];
      properties?: Record<string, Record<string, unknown>>;
    };

    expect(String(schema["url"])).toMatch(/\/api\/voice\/tool$/);
    expect(schema["method"]).toBe("POST");
    expect(schema["content_type"]).toBe("application/json");
    expect(headers["Authorization"]?.secret_id).toBe("secret_uno_1");
    expect(requestSchema.required).toEqual(["question", "conversation_id"]);
    expect(requestSchema.properties?.["conversation_id"]?.["dynamic_variable"]).toBe(
      "system__conversation_id",
    );
    expect(requestSchema.properties?.["conversation_id"]?.["description"]).toBeUndefined();

    const clientConfig = toolConfigOf(client);

    expect(clientConfig["name"]).toBe("mostrar_fuentes");
    expect(clientConfig["expects_response"]).toBe(false);

    const { openStore } = await import("@/lib/store");

    const store = await openStore(path);
    const stored = await store.readVoiceAgent();

    store.close();

    expect(stored?.agentId).toBe("agent_katalis_4");
    expect(stored?.secretId).toBe("secret_uno_1");
    expect(stored?.toolId).toBe("tool_webhook_2");
    expect(stored?.sourcesToolId).toBe("tool_fuentes_3");
  });

  it("updates the same agent and tools on the second press and creates nothing new", async () => {
    const path = await freshStore();
    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);
    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret, ELEVENLABS_API_KEY: key });

    const first = await provision();
    const posts = double.calls.filter((call) => call.method === "POST").length;
    const second = await provision();

    expect(first.status).toBe("ok");
    expect(second.status).toBe("ok");
    expect(double.calls.filter((call) => call.method === "POST")).toHaveLength(posts);
    expect(double.callsTo("PATCH", "/v1/convai/secrets/secret_uno_1")).toHaveLength(1);
    expect(double.callsTo("PATCH", "/v1/convai/tools/tool_webhook_2")).toHaveLength(1);
    expect(double.callsTo("PATCH", "/v1/convai/tools/tool_fuentes_3")).toHaveLength(1);
    expect(double.callsTo("PATCH", "/v1/convai/agents/agent_katalis_4")).toHaveLength(1);

    if (second.status !== "ok") {
      return;
    }

    expect(second.agentId).toBe("agent_katalis_4");
    expect(second.created).toBe(false);
  });

  it("makes English the first language and adds Spanish as the second one", async () => {
    const path = await freshStore();
    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);
    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret, ELEVENLABS_API_KEY: key });

    await provision({ business: business({ language: "en", welcome: { en: "Hi", es: "Hola" } }) });

    const config = body(double.callsTo("POST", "/v1/convai/agents/create")[0])[
      "conversation_config"
    ] as Record<string, unknown>;
    const agentConfig = config["agent"] as Record<string, unknown>;
    const presets = config["language_presets"] as Record<string, unknown>;
    const spanish = presets["es"] as { overrides?: { agent?: { first_message?: string } } };
    const tts = config["tts"] as Record<string, unknown>;
    const prompt = agentConfig["prompt"] as Record<string, unknown>;

    expect(agentConfig["language"]).toBe("en");
    expect(Object.keys(presets)).toEqual(["es"]);
    expect(spanish.overrides?.agent?.first_message).toBe("Hola");
    expect(tts["model_id"]).toBe("eleven_flash_v2_5");
    expect(prompt["built_in_tools"]).toMatchObject({
      language_detection: { params: { system_tool_type: "language_detection" } },
    });
  });

  it("makes Spanish the first language and English the second one for a business in Spanish", async () => {
    const path = await freshStore();
    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);
    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret, ELEVENLABS_API_KEY: key });

    await provision({ business: business({ language: "es", welcome: { en: "Hi", es: "Hola" } }) });

    const config = body(double.callsTo("POST", "/v1/convai/agents/create")[0])[
      "conversation_config"
    ] as Record<string, unknown>;
    const agentConfig = config["agent"] as Record<string, unknown>;
    const presets = config["language_presets"] as Record<string, unknown>;
    const english = presets["en"] as { overrides?: { agent?: { first_message?: string } } };

    expect(agentConfig["language"]).toBe("es");
    expect(Object.keys(presets)).toEqual(["en"]);
    expect(english.overrides?.agent?.first_message).toBe("Hi");
  });

  it("carries the lesson of Construye in the prompt of the agent", async () => {
    const path = await freshStore();
    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);
    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret, ELEVENLABS_API_KEY: key });

    await provision();

    const config = body(double.callsTo("POST", "/v1/convai/agents/create")[0])[
      "conversation_config"
    ] as Record<string, unknown>;
    const prompt = (config["agent"] as Record<string, unknown>)["prompt"] as Record<string, unknown>;
    const text = String(prompt["prompt"]);
    const tools = prompt["tool_ids"] as string[];

    expect(text).toContain("mostrar_fuentes");
    expect(text).toMatch(/not repeat|never repeat|do not repeat/i);
    expect(text).toMatch(/every question|for every question/i);
    expect(tools).toEqual(["tool_webhook_2", "tool_fuentes_3"]);
  });

  it("allows the origin of the app and the origins of ALLOWED_ORIGINS, by hostname and without a port", async () => {
    const path = await freshStore();
    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);
    setEnvironment({
      DATABASE_URL: path,
      VOICE_TOOL_SECRET: secret,
      ELEVENLABS_API_KEY: key,
      ALLOWED_ORIGINS: "https://tienda.example,https://blog.example:8443",
    });

    await provision({ origins: ["https://cited.example", "http://127.0.0.1:3100"] });

    const settings = body(double.callsTo("POST", "/v1/convai/agents/create")[0])[
      "platform_settings"
    ] as Record<string, unknown>;
    const auth = settings["auth"] as { allowlist?: Array<{ hostname: string }> };
    const hosts = auth.allowlist?.map((entry) => entry.hostname) ?? [];

    expect(hosts).toEqual(["cited.example", "127.0.0.1", "tienda.example", "blog.example"]);
  });

  it("names the business in the agent and in the first message of its language", async () => {
    const path = await freshStore();
    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);
    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret, ELEVENLABS_API_KEY: key });

    await provision({
      business: business({
        name: "Café La Horquilla",
        language: "en",
        welcome: { en: "Ask anything about this business", es: "Pregunta lo que quieras" },
      }),
    });

    const payload = body(double.callsTo("POST", "/v1/convai/agents/create")[0]);
    const config = payload["conversation_config"] as Record<string, unknown>;
    const agentConfig = config["agent"] as Record<string, unknown>;

    expect(payload["name"]).toBe("Café La Horquilla");
    expect(agentConfig["first_message"]).toBe("Ask anything about this business");
  });
});

describe("the agent that cannot be created", () => {
  it("names ELEVENLABS_API_KEY when the key is missing and creates nothing", async () => {
    const path = await freshStore();

    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret, ELEVENLABS_API_KEY: "" });

    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);

    const outcome = await provision();

    expect(outcome.status).toBe("unconfigured");

    if (outcome.status === "unconfigured") {
      expect(outcome.missing).toEqual(["ELEVENLABS_API_KEY"]);
    }

    expect(double.calls).toHaveLength(0);
  });

  it("names VOICE_TOOL_SECRET when the secret of the tool is missing", async () => {
    const path = await freshStore();

    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: "", ELEVENLABS_API_KEY: key });

    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);

    const outcome = await provision();

    expect(outcome.status).toBe("unconfigured");

    if (outcome.status === "unconfigured") {
      expect(outcome.missing).toEqual(["VOICE_TOOL_SECRET"]);
    }

    expect(double.calls).toHaveLength(0);
  });

  it("reports ElevenLabs refusing without letting the key travel", async () => {
    const path = await freshStore();

    setEnvironment({ DATABASE_URL: path, VOICE_TOOL_SECRET: secret, ELEVENLABS_API_KEY: key });

    const double = elevenLabsDouble({ failures: { "POST /v1/convai/agents/create": 422 } });

    useVoiceTransport(double.transport);

    const outcome = await provision();

    expect(outcome.status).toBe("unavailable");

    if (outcome.status === "unavailable") {
      expect(outcome.message).not.toContain(key);
    }
  });
});
