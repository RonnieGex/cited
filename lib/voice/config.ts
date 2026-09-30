/**
 * The settings of the voice agent: the endpoint of ElevenLabs, the conservative minutes a session reserves and the
 * names of the variables. No function here answers a value of a key: an absent variable is an absent variable, and the
 * routes name it instead of its value.
 */

import type { ChatEnvironment } from "../models/types.ts";

export type VoiceEnvironment = ChatEnvironment;

export const ELEVENLABS_API = "https://api.elevenlabs.io";
/** A session reserves five minutes before it starts, whether or not the visitor uses them (design decision 5). */
export const VOICE_SESSION_MINUTES = 5;
export const DEFAULT_VOICE_MINUTE_LIMIT = 30;
/** The seconds the agent waits for the server tool before it gives up; the API accepts 5 to 300. */
export const VOICE_TOOL_TIMEOUT_SECONDS = 30;
export const AGENT_SECRET_NAME = "katalis_voice_tool";
export const AGENT_TOOL_NAME = "consultar_los_documentos";
export const AGENT_SOURCES_TOOL = "mostrar_fuentes";
export const AGENT_TTS_MODEL = "eleven_flash_v2_5";
export const AGENT_LANGUAGES = ["en", "es"] as const;

export function declared(environment: VoiceEnvironment, name: string): string {
  return environment[name]?.trim() ?? "";
}

export function voiceMinuteLimit(environment: VoiceEnvironment = process.env): number {
  const limit = Number(declared(environment, "DAILY_VOICE_MINUTE_LIMIT"));

  return Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_VOICE_MINUTE_LIMIT;
}

/** The origin the routes are served from, as the agent has to be allowed to start a conversation there. */
export function originOf(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("host")?.trim() ?? "";

  if (host.length === 0) {
    return url.origin;
  }

  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "";
  const protocol = forwarded.length > 0 ? forwarded : url.protocol.replace(":", "");

  return `${protocol}://${host}`;
}
