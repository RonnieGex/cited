/**
 * `GET /api/voice/signed-url`, the only thing the browser asks for: a short-lived URL of ElevenLabs, asked with the
 * key of the server, which never travels to the browser. The route also owns the daily cap of voice minutes
 * (design decision 5): a session reserves five minutes before it starts, and a day without room answers 429 without
 * calling ElevenLabs at all. A limit below one session is answered before the configuration is read, so a visitor of an
 * installation without a key still learns that the voice is off for the cap and not for the key.
 *
 * A visitor never learns how the server is configured (`voice-owner-words`, design decision 4): every answer that is
 * not a signed URL carries a status and a reason code only, and no name of a variable of the environment and no hint
 * of which piece of the configuration is missing.
 */

import { sharedStore } from "../../../../lib/store/instance.ts";
import { VOICE_UNAVAILABLE } from "../../../../lib/voice/client.ts";
import { ELEVENLABS_API, declared, voiceMinuteLimit } from "../../../../lib/voice/config.ts";
import { capRefusal, reserveSession, type SessionRefusal } from "../../../../lib/voice/minutes.ts";
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

function unavailable(): Response {
  return answer({ status: "unavailable", reason: VOICE_UNAVAILABLE }, 503);
}

function limited(reason: SessionRefusal): Response {
  return answer({ status: "limited", reason }, 429);
}

export async function GET(): Promise<Response> {
  const environment = process.env;
  const limit = voiceMinuteLimit(environment);
  const refused = capRefusal(limit);

  if (refused !== null) {
    return limited(refused);
  }

  const key = declared(environment, "ELEVENLABS_API_KEY");

  if (key.length === 0) {
    return unavailable();
  }

  try {
    const store = await sharedStore(environment);
    const stored = await store.readVoiceAgent();
    const agentId = declared(environment, "ELEVENLABS_AGENT_ID") || (stored?.agentId ?? "");

    if (agentId.length === 0) {
      return unavailable();
    }

    const room = await reserveSession(store, { environment });

    if (room.ok === false) {
      return limited(room.reason);
    }

    const url = `${ELEVENLABS_API}/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`;
    const response = await voiceTransport()(url, {
      method: "GET",
      headers: { "xi-api-key": key },
      cache: "no-store",
    });

    if (response.ok === false) {
      return unavailable();
    }

    const payload = (await response.json()) as { signed_url?: unknown };
    const signed = typeof payload.signed_url === "string" ? payload.signed_url : "";

    if (signed.length === 0) {
      return unavailable();
    }

    return answer({ url: signed }, 200);
  } catch {
    return unavailable();
  }
}
