/**
 * `GET /api/voice/signed-url`, the only thing the browser asks for: a short-lived URL of ElevenLabs, asked with the
 * key of the server, which never travels to the browser. The route also owns the daily cap of voice minutes
 * (design decision 5): a session reserves five minutes before it starts, and a day without room answers 429 without
 * calling ElevenLabs at all.
 */

import { sharedStore } from "../../../../lib/store/instance.ts";
import { ELEVENLABS_API, declared } from "../../../../lib/voice/config.ts";
import { reserveSession } from "../../../../lib/voice/minutes.ts";
import { voiceTransport } from "../../../../lib/voice/transport.ts";

export const runtime = "nodejs";

function answer(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export async function GET(): Promise<Response> {  const environment = process.env;
  const key = declared(environment, "ELEVENLABS_API_KEY");

  if (key.length === 0) {
    return answer(
      { status: "unconfigured", missing: ["ELEVENLABS_API_KEY"] },
      503,
    );
  }

  try {
    const store = await sharedStore(environment);
    const stored = await store.readVoiceAgent();
    const agentId = declared(environment, "ELEVENLABS_AGENT_ID") || (stored?.agentId ?? "");

    if (agentId.length === 0) {
      return answer({ status: "unconfigured", missing: ["ELEVENLABS_AGENT_ID"] }, 503);
    }

    const room = await reserveSession(store, { environment });

    if (room.ok === false) {
      return answer(
        {
          status: "limited",
          limit: room.limit,
          error: `the daily limit of voice minutes (DAILY_VOICE_MINUTE_LIMIT=${room.limit}) is reached; it resets at 00:00 UTC`,
        },
        429,
      );
    }

    const url = `${ELEVENLABS_API}/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`;
    const response = await voiceTransport()(url, {
      method: "GET",
      headers: { "xi-api-key": key },
      cache: "no-store",
    });

    if (response.ok === false) {
      return answer(
        { status: "unavailable", error: `ElevenLabs answered ${response.status} to the request of a signed URL` },
        503,
      );
    }

    const payload = (await response.json()) as { signed_url?: unknown };
    const signed = typeof payload.signed_url === "string" ? payload.signed_url : "";

    if (signed.length === 0) {
      return answer(
        { status: "unavailable", error: "ElevenLabs answered without a signed URL" },
        503,
      );
    }

    return answer({ url: signed }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "the server is not configured";

    return answer({ status: "unavailable", error: message }, 503);
  }
}
