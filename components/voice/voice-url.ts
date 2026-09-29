"use client";

/**
 * The only thing the browser asks the server for: a short-lived URL of ElevenLabs. The key of the provider lives in
 * the environment of the server and this module cannot see it.
 */

export type VoiceUrlFailure = "limited" | "not-configured" | "unavailable";

export type VoiceUrlResult = { ok: true; url: string } | { ok: false; failure: VoiceUrlFailure };

export const SIGNED_URL_ENDPOINT = "/api/voice/signed-url";

export async function requestSignedUrl(): Promise<VoiceUrlResult> {
  try {
    const response = await fetch(SIGNED_URL_ENDPOINT, {
      method: "GET",
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (response.status === 429) {
      return { ok: false, failure: "limited" };
    }

    if (response.status === 503) {
      return { ok: false, failure: "not-configured" };
    }

    if (response.ok === false) {
      return { ok: false, failure: "unavailable" };
    }

    const payload = (await response.json()) as { url?: unknown };
    const url = typeof payload.url === "string" ? payload.url : "";

    return url.length === 0 ? { ok: false, failure: "unavailable" } : { ok: true, url };
  } catch {
    return { ok: false, failure: "unavailable" };
  }
}
