/**
 * The voice screen of the panel: the state of the agent and the one button that creates or updates it. The route is
 * behind the session guard of `/admin`; the key of ElevenLabs is read from the environment of the server and never
 * travels back in the answer.
 */

import { guardRequest } from "../../../../lib/admin/guard.ts";
import { guardResponse, json } from "../../../../lib/admin/respond.ts";
import { readBusiness } from "../../../../lib/settings/business.ts";
import { sharedStore } from "../../../../lib/store/instance.ts";
import { provisionVoiceAgent } from "../../../../lib/voice/agent.ts";
import { declared, originOf } from "../../../../lib/voice/config.ts";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const store = await sharedStore(process.env);
  const stored = await store.readVoiceAgent();

  return json({
    status: "ok",
    voice: {
      key: declared(process.env, "ELEVENLABS_API_KEY").length > 0,
      toolSecret: declared(process.env, "VOICE_TOOL_SECRET").length > 0,
      agentId: stored?.agentId ?? null,
      language: stored?.language ?? null,
      updatedAt: stored?.updatedAt ?? null,
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const business = await readBusiness(process.env);
  const outcome = await provisionVoiceAgent({
    environment: process.env,
    business,
    origins: [originOf(request)],
  });

  if (outcome.status === "ok") {
    return json({ status: "ok", agentId: outcome.agentId, created: outcome.created });
  }

  if (outcome.status === "unconfigured") {
    return json(
      {
        status: "unconfigured",
        missing: outcome.missing,
        error: `the voice agent needs ${outcome.missing.join(" and ")} in the environment of the server`,
      },
      503,
    );
  }

  return json({ status: "unavailable", error: outcome.message }, 503);
}
