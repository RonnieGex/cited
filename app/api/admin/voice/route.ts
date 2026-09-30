/**
 * The voice screen of the panel: the state of the agent and the one button that creates or updates it. The route is
 * behind the session guard of `/admin`; the key of ElevenLabs is read from the environment of the server and never
 * travels back in the answer.
 *
 * An installation without voice answers the code `voice_not_configured` and the words of the owner, and the names of
 * the variables that are missing go once to the log of the server and stay on the page "For the installer"
 * (`voice-owner-words`, design decisions 1 and 2). A provider that fails answers `voice_provider_failed` and the text
 * of its error never travels back, the same rule as the lane of the keys in the panel.
 */

import { guardRequest, writeOnce } from "../../../../lib/admin/guard.ts";
import { guardResponse, json } from "../../../../lib/admin/respond.ts";
import { readBusiness } from "../../../../lib/settings/business.ts";
import { sharedStore } from "../../../../lib/store/instance.ts";
import { provisionVoiceAgent } from "../../../../lib/voice/agent.ts";
import { VOICE_NOT_CONFIGURED, VOICE_PROVIDER_FAILED } from "../../../../lib/voice/client.ts";
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
    // The diagnostic of whoever installs, once per process: the owner reads the code and the sentence of the screen,
    // and whoever installs reads the names in the log of the server and on the page "For the installer".
    writeOnce(
      `the voice agent is not configured: the environment of the server is missing ${outcome.missing.join(", ")}`,
    );

    return json({ status: "unconfigured", reason: VOICE_NOT_CONFIGURED }, 503);
  }

  return json({ status: "unavailable", reason: VOICE_PROVIDER_FAILED }, 503);
}
