/**
 * The seam between this project and the ElevenLabs API. Everything that talks to `https://api.elevenlabs.io` goes
 * through one transport, so a test installs the double of `tests/fakes/elevenlabs-api.ts` and no test opens a socket.
 * `null` means the `fetch` of the runtime.
 */

export type VoiceTransport = (url: string, init: RequestInit) => Promise<Response>;

let active: VoiceTransport | null = null;

export function useVoiceTransport(transport: VoiceTransport | null): void {
  active = transport;
}

export function voiceTransport(): VoiceTransport {
  return active ?? ((url, init) => fetch(url, init));
}
