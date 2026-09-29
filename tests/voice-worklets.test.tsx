import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VoicePanel } from "@/components/voice";

// The requirement "Voice works under the page's own security policy" of
// `openspec/changes/elevenlabs-voice-agent/specs/voice-agent/spec.md`: every script, worklet and audio processor the
// voice panel needs is served from this origin, so the policy of the page never has to name a third-party script host.
// A session that asks a CDN for the resampler — the fallback of the SDK — fails here, and so does a copy of a worklet
// that is not the one the installed SDK ships. The SDK of this file is the test double: nothing opens a socket.

vi.mock("@elevenlabs/react", async () => await import("./fakes/elevenlabs-react"));
vi.mock("@/components/ui/orb", () => ({ Orb: () => <div data-testid="orb-canvas" /> }));

const SERVED = "voice/worklets";
const SDK_WORKLETS = join("node_modules", "@elevenlabs", "client", "worklets");
const SAMPLER = join("node_modules", "@alexanderolsen", "libsamplerate-js", "dist", "libsamplerate.worklet.js");

function served(name: string): string {
  return readFileSync(join(process.cwd(), "public", SERVED, name), "utf8");
}

function installed(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function answerSignedUrl(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({ url: "wss://api.elevenlabs.io/v1/convai/conversation?signed=de-prueba" }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the audio of the voice session", () => {
  it("serves the two worklets of the SDK and the resampler from this origin", () => {
    expect(served("raw-audio-processor.js")).toBe(installed(join(SDK_WORKLETS, "rawAudioProcessor.js")));
    expect(served("audio-concat-processor.js")).toBe(
      installed(join(SDK_WORKLETS, "audioConcatProcessor.js")),
    );
    expect(served("libsamplerate.worklet.js")).toBe(installed(SAMPLER));
    expect(served("raw-audio-processor.js")).toContain('registerProcessor("rawAudioProcessor"');
    expect(served("audio-concat-processor.js")).toContain('registerProcessor("audioConcatProcessor"');
    expect(served("libsamplerate.worklet.js")).toContain("LibSampleRate");
  });

  it("hands the SDK the paths of this origin, and no path of a CDN", async () => {
    answerSignedUrl();
    render(<VoicePanel lang="en" variant="dialog" />);

    await waitFor(() => {
      expect(window.__katalisVoiceFake).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("voice-start"));

    await waitFor(() => {
      expect(window.__katalisVoiceFake?.startCalls).toHaveLength(1);
    });

    const call = window.__katalisVoiceFake?.startCalls[0];
    const paths = [
      call?.workletPaths?.rawAudioProcessor,
      call?.workletPaths?.audioConcatProcessor,
      call?.libsampleratePath,
    ];

    expect(call?.workletPaths).toEqual({
      rawAudioProcessor: "/voice/worklets/raw-audio-processor.js",
      audioConcatProcessor: "/voice/worklets/audio-concat-processor.js",
    });
    expect(call?.libsampleratePath).toBe("/voice/worklets/libsamplerate.worklet.js");

    for (const path of paths) {
      expect(path?.startsWith("/")).toBe(true);
      expect(path).not.toMatch(/\/\//);
      expect(path).not.toMatch(/jsdelivr|cdn|unpkg/i);
    }
  });
});
