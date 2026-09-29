"use client";

/**
 * Deterministic stand-in for `@elevenlabs/react`, used only by the end-to-end build and by the unit tests of the
 * panel: `next.config.ts` replaces the package with this module when `KATALIS_VOICE_FAKE_SDK` is `1`, and the tests
 * mock the package with it. The production build never resolves this file, and `scripts/verify-no-test-sdk.mjs`
 * fails a build whose output carries any of its markers.
 *
 * It mirrors the slice of the real API this project uses (`ConversationProvider`, `useConversation` with `status`,
 * `mode`, `isSpeaking`, `startSession`, `endSession`, `sendUserMessage`, `getInputVolume`, `getOutputVolume`) and
 * exposes `window.__katalisVoiceFake` so a test drives it: no network and no timer. Like the real package, a session
 * that is not `textOnly` asks for the microphone before it connects, so a test can deny it.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type FakeStatus = "disconnected" | "connecting" | "connected" | "error";
export type FakeMode = "listening" | "speaking";

export interface FakeMessagePayload {
  message: string;
  source: "user" | "ai";
}

export interface FakeStartSessionOptions {
  signedUrl?: string;
  agentId?: string;
  connectionType?: "webrtc" | "websocket";
  textOnly?: boolean;
}

export interface FakeHookOptions extends FakeStartSessionOptions {
  clientTools?: Record<string, (parameters: Record<string, unknown>) => unknown>;
  onMessage?: (payload: FakeMessagePayload) => void;
  onModeChange?: (payload: { mode: FakeMode }) => void;
  onStatusChange?: (payload: { status: FakeStatus }) => void;
  onError?: (message: string, context?: unknown) => void;
}

export interface FakeStartCall {
  signedUrl?: string;
  agentId?: string;
  connectionType?: string;
  textOnly?: boolean;
}

export interface VoiceFakeApi {
  setStatus: (status: FakeStatus) => void;
  setMode: (mode: FakeMode) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  emitMessage: (payload: FakeMessagePayload) => void;
  callTool: (name: string, parameters?: Record<string, unknown>) => unknown;
  fail: (message: string) => void;
  failNextStart: (message: string) => void;
  failEveryStart: (message: string) => void;
  disconnect: () => void;
  /** By default every send reports its own turn inside `sendUserMessage`; off, the test decides when it arrives. */
  setAutoUserReport: (enabled: boolean) => void;
  readonly startCalls: FakeStartCall[];
  readonly sentMessages: string[];
  readonly endCalls: number;
}

declare global {
  interface Window {
    __katalisVoiceFake?: VoiceFakeApi;
  }
}

export function ConversationProvider({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

async function requestMicrophone(): Promise<boolean> {
  const mediaDevices = typeof navigator === "undefined" ? undefined : navigator.mediaDevices;

  if (!mediaDevices || typeof mediaDevices.getUserMedia !== "function") {
    return true;
  }

  try {
    await mediaDevices.getUserMedia({ audio: true });

    return true;
  } catch {
    return false;
  }
}

export function useConversation(props: FakeHookOptions = {}) {
  const [status, setStatus] = useState<FakeStatus>("disconnected");
  const [mode, setMode] = useState<FakeMode>("listening");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const optionsRef = useRef(props);
  const startCallsRef = useRef<FakeStartCall[]>([]);
  const sentMessagesRef = useRef<string[]>([]);
  const endCallsRef = useRef(0);
  const failNextStartRef = useRef<string | null>(null);
  const failEveryStartRef = useRef<string | null>(null);
  const autoUserReportRef = useRef(true);

  useEffect(() => {
    optionsRef.current = props;
  });

  const connect = useCallback(() => {
    setStatus("connected");
    setMode("listening");
    setIsSpeaking(false);
    optionsRef.current.onStatusChange?.({ status: "connected" });
  }, []);

  const startSession = useCallback(
    (options?: FakeStartSessionOptions) => {
      const config = { ...optionsRef.current, ...options };
      const textOnly = config?.textOnly === true;

      startCallsRef.current.push({
        signedUrl: config?.signedUrl,
        agentId: config?.agentId,
        connectionType: config?.connectionType,
        textOnly,
      });

      const failure = failEveryStartRef.current ?? failNextStartRef.current;

      if (failure) {
        failNextStartRef.current = null;
        setStatus("error");
        optionsRef.current.onError?.(failure);

        return;
      }

      if (textOnly) {
        connect();

        return;
      }

      setStatus("connecting");
      void requestMicrophone().then((granted) => {
        if (granted) {
          connect();

          return;
        }

        setStatus("error");
        optionsRef.current.onError?.("Permission denied");
      });
    },
    [connect],
  );

  const endSession = useCallback(() => {
    endCallsRef.current += 1;
    setStatus("disconnected");
    setIsSpeaking(false);
    optionsRef.current.onStatusChange?.({ status: "disconnected" });
  }, []);

  const sendUserMessage = useCallback((text: string) => {
    const trimmed = text.trim();

    if (trimmed === "") {
      return;
    }

    sentMessagesRef.current.push(trimmed);
    setMode("speaking");
    setIsSpeaking(false);

    if (autoUserReportRef.current) {
      optionsRef.current.onMessage?.({ message: trimmed, source: "user" });
    }
  }, []);

  const api = useMemo<VoiceFakeApi>(
    () => ({
      setStatus: (next) => {
        setStatus(next);
        optionsRef.current.onStatusChange?.({ status: next });
      },
      setMode: (next) => {
        setMode(next);
        optionsRef.current.onModeChange?.({ mode: next });
      },
      setSpeaking: (next) => {
        setIsSpeaking(next);
      },
      emitMessage: (payload) => {
        optionsRef.current.onMessage?.(payload);
      },
      callTool: (name, parameters) => {
        const tool = optionsRef.current.clientTools?.[name];

        if (!tool) {
          return undefined;
        }

        return tool(parameters ?? {});
      },
      fail: (message) => {
        optionsRef.current.onError?.(message);
      },
      failNextStart: (message) => {
        failNextStartRef.current = message;
      },
      failEveryStart: (message) => {
        failEveryStartRef.current = message;
      },
      disconnect: () => {
        setStatus("disconnected");
        setIsSpeaking(false);
      },
      setAutoUserReport: (enabled) => {
        autoUserReportRef.current = enabled;
      },
      get startCalls() {
        return startCallsRef.current;
      },
      get sentMessages() {
        return sentMessagesRef.current;
      },
      get endCalls() {
        return endCallsRef.current;
      },
    }),
    [],
  );

  useEffect(() => {
    window.__katalisVoiceFake = api;

    return () => {
      delete window.__katalisVoiceFake;
    };
  }, [api]);

  return {
    startSession,
    endSession,
    sendUserMessage,
    status,
    mode,
    isSpeaking,
    isListening: mode === "listening",
    getInputVolume: () => 0.42,
    getOutputVolume: () => 0.58,
  };
}
