"use client";

/**
 * The only module that talks to `@elevenlabs/react`. The site holds no ElevenLabs key: the panel asks this server for
 * a signed URL and starts the private WebSocket session of the SDK with it, which is the session a signed URL opens
 * (the WebRTC one needs a conversation token this project does not ask for).
 *
 * `npm run build:e2e` builds with `KATALIS_VOICE_FAKE_SDK=1` and `next.config.ts` resolves the package to
 * `tests/fakes/elevenlabs-react.tsx`, so the end-to-end suite drives a deterministic fake instead of the real agent.
 */

import { ConversationProvider, useConversation } from "@elevenlabs/react";

export { ConversationProvider };

export type VoiceConnectionType = "websocket";

/** The private WebSocket session: a signed URL is what opens it, and a text-only session never asks for the mic. */
export const VOICE_CONNECTION_TYPE: VoiceConnectionType = "websocket";

export type VoiceClientTool = (parameters: Record<string, unknown>) => string | number | void;

export interface VoiceStartOptions {
  signedUrl: string;
  /** A session that never opens the microphone; the SDK resolves it over the same socket. */
  textOnly?: boolean;
}

export interface VoiceSessionOptions {
  clientTools: Record<string, VoiceClientTool>;
  onMessage: (payload: { message: string; source: "user" | "ai" }) => void;
  onError: (message: string) => void;
  onStatusChange: (status: string) => void;
}

export interface VoiceSession {
  status: string;
  mode: string;
  isSpeaking: boolean;
  startSession: (options: VoiceStartOptions) => void;
  endSession: () => void;
  sendUserMessage: (text: string) => void;
  getInputVolume: () => number;
  getOutputVolume: () => number;
}

export function useVoiceSession(options: VoiceSessionOptions): VoiceSession {
  const conversation = useConversation({
    clientTools: options.clientTools,
    onMessage: (payload) =>
      options.onMessage({
        message: payload.message,
        source: payload.source === "user" ? "user" : "ai",
      }),
    onStatusChange: (payload) => options.onStatusChange(payload.status),
    onError: (message) => options.onError(message),
  });

  return {
    status: conversation.status,
    mode: conversation.mode,
    isSpeaking: conversation.isSpeaking,
    startSession: (start) =>
      conversation.startSession({
        signedUrl: start.signedUrl,
        connectionType: VOICE_CONNECTION_TYPE,
        textOnly: start.textOnly === true,
      }),
    endSession: () => conversation.endSession(),
    sendUserMessage: (text) => conversation.sendUserMessage(text),
    getInputVolume: () => conversation.getInputVolume(),
    getOutputVolume: () => conversation.getOutputVolume(),
  };
}
