/**
 * The double of the ElevenLabs API. Every test of the voice routes and of the provisioning talks to this and never to
 * `https://api.elevenlabs.io`: the transport records each call and answers the shapes the playbook
 * (`~/.claude/playbooks/elevenlabs-agentes.md`) and the API reference describe.
 */

import type { VoiceTransport } from "@/lib/voice/transport";

export interface RecordedCall {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

export interface ElevenLabsDouble {
  transport: VoiceTransport;
  calls: RecordedCall[];
  callsTo: (method: string, path: string) => RecordedCall[];
  /** The body of the single call that matches, or `null`. */
  bodyOf: (method: string, path: string) => Record<string, unknown> | null;
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function headersOf(init: RequestInit | undefined): Record<string, string> {
  const found: Record<string, string> = {};
  const source = init?.headers;

  if (source === undefined) {
    return found;
  }

  if (Array.isArray(source)) {
    for (const [name, value] of source) {
      found[name.toLowerCase()] = value;
    }

    return found;
  }

  if (source instanceof Headers) {
    source.forEach((value, name) => {
      found[name.toLowerCase()] = value;
    });

    return found;
  }

  for (const [name, value] of Object.entries(source)) {
    found[name.toLowerCase()] = String(value);
  }

  return found;
}

function bodyOf(init: RequestInit | undefined): unknown {
  const raw = init?.body;

  if (typeof raw !== "string" || raw.length === 0) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export interface ElevenLabsDoubleOptions {
  /** The id the double answers for a secret, a tool and an agent. */
  ids?: { secret?: string; tool?: string; sourcesTool?: string; agent?: string };
  /** A status the next call answers instead of its result, keyed by `"<METHOD> <path>"`. */
  failures?: Record<string, number>;
}

/**
 * Builds the double. Each POST answers a new id, so a test can prove that a second press creates nothing: the ids of
 * the second press are the ones the store already had.
 */
export function elevenLabsDouble(options: ElevenLabsDoubleOptions = {}): ElevenLabsDouble {
  const ids = {
    secret: options.ids?.secret ?? "secret_uno",
    tool: options.ids?.tool ?? "tool_webhook",
    sourcesTool: options.ids?.sourcesTool ?? "tool_fuentes",
    agent: options.ids?.agent ?? "agent_katalis",
  };
  const calls: RecordedCall[] = [];
  let created = 0;

  const transport: VoiceTransport = async (url, init) => {
    const parsed = new URL(url);
    const method = (init?.method ?? "GET").toUpperCase();

    calls.push({
      method,
      url,
      headers: headersOf(init),
      body: bodyOf(init),
    });

    const failure = options.failures?.[`${method} ${parsed.pathname}`];

    if (failure !== undefined) {
      return json({ detail: "the double was told to fail" }, failure);
    }

    if (method === "GET" && parsed.pathname === "/v1/convai/conversation/get-signed-url") {
      const agentId = parsed.searchParams.get("agent_id") ?? "";

      return json({
        signed_url: `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`,
      });
    }

    if (method === "POST" && parsed.pathname === "/v1/convai/secrets") {
      created += 1;

      return json({ type: "stored", secret_id: `${ids.secret}_${created}`, name: "katalis" });
    }

    if (method === "PATCH" && parsed.pathname.startsWith("/v1/convai/secrets/")) {
      return json({
        type: "stored",
        secret_id: parsed.pathname.slice("/v1/convai/secrets/".length),
        name: "katalis",
      });
    }

    if (method === "POST" && parsed.pathname === "/v1/convai/tools") {
      created += 1;

      const name = (bodyOf(init) as { tool_config?: { name?: string } } | null)?.tool_config?.name;
      const id = name === "mostrar_fuentes" ? ids.sourcesTool : ids.tool;

      return json({ id: `${id}_${created}`, tool_config: { name } });
    }

    if (method === "PATCH" && parsed.pathname.startsWith("/v1/convai/tools/")) {
      return json({ id: parsed.pathname.slice("/v1/convai/tools/".length) });
    }

    if (method === "POST" && parsed.pathname === "/v1/convai/agents/create") {
      created += 1;

      return json({ agent_id: `${ids.agent}_${created}` });
    }

    if (method === "PATCH" && parsed.pathname.startsWith("/v1/convai/agents/")) {
      return json({ agent_id: parsed.pathname.slice("/v1/convai/agents/".length) });
    }

    return json({ detail: `the double does not know ${method} ${parsed.pathname}` }, 404);
  };

  return {
    transport,
    calls,
    callsTo: (method, path) =>
      calls.filter((call) => call.method === method && new URL(call.url).pathname === path),
    bodyOf: (method, path) => {
      const found = calls.find(
        (call) => call.method === method && new URL(call.url).pathname === path,
      );

      return (found?.body as Record<string, unknown> | null) ?? null;
    },
  };
}
