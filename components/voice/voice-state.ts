/**
 * The state the panel shows in words and hands to the Orb. Pure: the status of the SDK, its mode, whether the agent is
 * speaking and whether the session is text-only in, `{ label, orbState, connected, canStart, animate }` out. It is a
 * port of `components/voice/voice-state.ts` of Construye (MIT, read only) with the words of both languages of Cited.
 */

import { voiceStrings } from "../../lib/i18n/voice.ts";
import type { Lang } from "../../lib/settings/business.ts";

export type OrbAgentState = null | "thinking" | "listening" | "talking";

/** The four states the Orb understands, plus the idle one (`null`). */
export const ORB_STATES: OrbAgentState[] = [null, "thinking", "listening", "talking"];

export interface VoiceStateInput {
  status: string;
  mode: string;
  isSpeaking?: boolean;
  /** A session that never opened the microphone: its ready state asks for a written question. */
  textOnly?: boolean;
}

export interface VoiceStateOptions {
  reducedMotion?: boolean;
  lang?: Lang;
}

export interface VoiceStateView {
  label: string;
  orbState: OrbAgentState;
  connected: boolean;
  /** The primary control offers to start only when no session is on its way; otherwise it offers to end it. */
  canStart: boolean;
  animate: boolean;
}

/** `prefers-reduced-motion` turns the Orb animation off; the words keep changing. */
export function orbAnimationEnabled(prefersReducedMotion: boolean): boolean {
  return !prefersReducedMotion;
}

export function voiceState(
  input: VoiceStateInput,
  options: VoiceStateOptions = {},
): VoiceStateView {
  const words = voiceStrings(options.lang ?? "en");
  const animate = orbAnimationEnabled(Boolean(options.reducedMotion));
  const { status, mode } = input;
  const isSpeaking = Boolean(input.isSpeaking);

  if (status === "connected") {
    if (mode === "listening") {
      if (input.textOnly) {
        return { label: words.ready, orbState: null, connected: true, canStart: false, animate };
      }

      return {
        label: words.listening,
        orbState: "listening",
        connected: true,
        canStart: false,
        animate,
      };
    }

    if (isSpeaking) {
      return { label: words.talking, orbState: "talking", connected: true, canStart: false, animate };
    }

    return { label: words.thinking, orbState: "thinking", connected: true, canStart: false, animate };
  }

  if (status === "connecting" || status === "disconnecting") {
    return {
      label: status === "connecting" ? words.connecting : words.disconnecting,
      orbState: "thinking",
      connected: false,
      canStart: false,
      animate,
    };
  }

  if (status === "error") {
    return { label: words.error, orbState: null, connected: false, canStart: true, animate };
  }

  return { label: words.idle, orbState: null, connected: false, canStart: true, animate };
}
