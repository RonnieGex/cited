// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ORB_STATES, orbAnimationEnabled, voiceState } from "@/components/voice/voice-state";
import { VOICE_STRINGS } from "@/lib/i18n/voice";

// The four states the panel shows in words, the mapping of `components/voice/voice-state.ts` of Construye adapted to
// the two languages of Cited: one state per scenario of "The microphone with the Orb".

const en = VOICE_STRINGS.en;

describe("the state of the voice panel", () => {
  it("offers to speak when no session is on its way", () => {
    const view = voiceState({ status: "disconnected", mode: "listening" });

    expect(view.label).toBe(en.idle);
    expect(view.orbState).toBeNull();
    expect(view.canStart).toBe(true);
    expect(view.connected).toBe(false);
  });

  it("says it is connecting while the session is on its way", () => {
    const view = voiceState({ status: "connecting", mode: "listening" });

    expect(view.label).toBe(en.connecting);
    expect(view.orbState).toBe("thinking");
    expect(view.canStart).toBe(false);
  });

  it("says it is listening when the microphone is open", () => {
    const view = voiceState({ status: "connected", mode: "listening" });

    expect(view.label).toBe(en.listening);
    expect(view.orbState).toBe("listening");
    expect(view.connected).toBe(true);
    expect(view.canStart).toBe(false);
  });

  it("says it is thinking when the turn is not the visitor and the agent is not speaking", () => {
    const view = voiceState({ status: "connected", mode: "speaking", isSpeaking: false });

    expect(view.label).toBe(en.thinking);
    expect(view.orbState).toBe("thinking");
  });

  it("says it is answering while the agent speaks", () => {
    const view = voiceState({ status: "connected", mode: "speaking", isSpeaking: true });

    expect(view.label).toBe(en.talking);
    expect(view.orbState).toBe("talking");
  });

  it("asks for a written question when the session never opened the microphone", () => {
    const view = voiceState({ status: "connected", mode: "listening", textOnly: true });

    expect(view.label).toBe(en.ready);
    expect(view.orbState).toBeNull();
    expect(view.connected).toBe(true);
  });

  it("says it is finishing while the session is closing", () => {
    const view = voiceState({ status: "disconnecting", mode: "listening" });

    expect(view.label).toBe(en.disconnecting);
    expect(view.canStart).toBe(false);
  });

  it("reports a broken conversation and offers to start again", () => {
    const view = voiceState({ status: "error", mode: "listening" });

    expect(view.label).toBe(en.error);
    expect(view.canStart).toBe(true);
  });

  it("keeps the orb still when the visitor asked for less motion, and keeps the words", () => {
    const still = voiceState({ status: "connected", mode: "listening" }, { reducedMotion: true });

    expect(still.animate).toBe(false);
    expect(still.label).toBe(en.listening);
    expect(orbAnimationEnabled(true)).toBe(false);
    expect(orbAnimationEnabled(false)).toBe(true);
  });

  it("knows the four states of the orb and the idle one", () => {
    expect(ORB_STATES).toEqual([null, "thinking", "listening", "talking"]);
  });

  it("speaks the language of the page", () => {
    expect(VOICE_STRINGS.es.idle).not.toBe(en.idle);
    expect(VOICE_STRINGS.es.listening).not.toBe(en.listening);
  });
});
