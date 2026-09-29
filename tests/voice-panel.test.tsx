import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceLauncher, VoicePanel } from "@/components/voice";
import { VOICE_STRINGS } from "@/lib/i18n/voice";

// The scenarios of the requirement "The microphone with the Orb" of
// `openspec/changes/elevenlabs-voice-agent/specs/voice-agent/spec.md` that a DOM can prove: the microphone button, the
// state in words, the written question echoed once and the citation chips named by section. The SDK is the test SDK of
// `tests/fakes/elevenlabs-react.tsx` and the signed URL comes from a stubbed `fetch`: nothing here opens a socket.

vi.mock("@elevenlabs/react", async () => await import("./fakes/elevenlabs-react"));
// three.js has no WebGL in jsdom: the canvas of the ported Orb is mocked, the wrapper that asks for it on demand is not.
vi.mock("@/components/ui/orb", () => ({ Orb: () => <div data-testid="orb-canvas" /> }));

const en = VOICE_STRINGS.en;
const es = VOICE_STRINGS.es;
const signedUrl = "wss://api.elevenlabs.io/v1/convai/conversation?signed=de-prueba";

function urlOk(): Response {
  return new Response(JSON.stringify({ url: signedUrl }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function urlFailure(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function fake() {
  const api = window.__katalisVoiceFake;

  if (api === undefined) {
    throw new Error("the test SDK is not mounted");
  }

  return api;
}

async function start(): Promise<void> {
  fireEvent.click(screen.getByTestId("voice-start"));
  await waitFor(() => {
    expect(fake().startCalls).toHaveLength(1);
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => urlOk()));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the voice panel", () => {
  it("is opened by the microphone button and asks the server for a signed URL when it starts", async () => {
    render(<VoiceLauncher lang="en" />);

    expect(screen.queryByTestId("voice-panel")).toBeNull();

    fireEvent.click(screen.getByTestId("voice-launcher"));

    expect(await screen.findByTestId("voice-panel")).toBeInTheDocument();
    expect(screen.getByTestId("voice-state")).toHaveTextContent(en.idle);

    await start();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String((fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])).toContain(
      "/api/voice/signed-url",
    );
    expect(fake().startCalls[0]?.signedUrl).toBe(signedUrl);
    expect(fake().startCalls[0]?.textOnly).toBe(false);
  });

  it("shows the four states in words while the session runs", async () => {
    render(<VoicePanel lang="en" variant="dialog" />);

    await waitFor(() => {
      expect(window.__katalisVoiceFake).toBeDefined();
    });
    expect(screen.getByTestId("voice-state")).toHaveTextContent(en.idle);

    await start();

    act(() => {
      fake().setStatus("connecting");
    });
    expect(screen.getByTestId("voice-state")).toHaveTextContent(en.connecting);

    act(() => {
      fake().setStatus("connected");
      fake().setMode("listening");
    });
    expect(screen.getByTestId("voice-state")).toHaveTextContent(en.listening);

    act(() => {
      fake().setMode("speaking");
      fake().setSpeaking(false);
    });
    expect(screen.getByTestId("voice-state")).toHaveTextContent(en.thinking);

    act(() => {
      fake().setSpeaking(true);
    });
    expect(screen.getByTestId("voice-state")).toHaveTextContent(en.talking);
  });

  it("echoes a written question once although the SDK reports the turn of the visitor", async () => {
    render(<VoicePanel lang="en" variant="dialog" />);

    await waitFor(() => {
      expect(window.__katalisVoiceFake).toBeDefined();
    });
    await start();

    fireEvent.change(screen.getByTestId("voice-text"), {
      target: { value: "How much is a tune-up?" },
    });
    fireEvent.click(screen.getByTestId("voice-send"));

    await waitFor(() => {
      expect(screen.getAllByTestId("voice-message")).toHaveLength(1);
    });

    expect(screen.getByTestId("voice-message")).toHaveTextContent("How much is a tune-up?");
    expect(fake().sentMessages).toEqual(["How much is a tune-up?"]);
  });

  it("leaves two lines when the same question is sent twice", async () => {
    render(<VoicePanel lang="en" variant="dialog" />);

    await waitFor(() => {
      expect(window.__katalisVoiceFake).toBeDefined();
    });
    await start();

    for (const attempt of [1, 2]) {
      fireEvent.change(screen.getByTestId("voice-text"), {
        target: { value: "How much is a tune-up?" },
      });
      fireEvent.click(screen.getByTestId("voice-send"));

      await waitFor(() => {
        expect(screen.getAllByTestId("voice-message")).toHaveLength(attempt);
      });
    }

    expect(fake().sentMessages).toEqual(["How much is a tune-up?", "How much is a tune-up?"]);
  });

  it("opens a text-only session for whoever cannot use the microphone, and keeps the question", async () => {
    render(<VoicePanel lang="en" variant="dialog" />);

    await waitFor(() => {
      expect(window.__katalisVoiceFake).toBeDefined();
    });

    fireEvent.change(screen.getByTestId("voice-text"), {
      target: { value: "How much is a tune-up?" },
    });
    fireEvent.click(screen.getByTestId("voice-send"));

    await waitFor(() => {
      expect(fake().startCalls).toHaveLength(1);
    });
    expect(fake().startCalls[0]?.textOnly).toBe(true);

    act(() => {
      fake().setStatus("connected");
    });

    await waitFor(() => {
      expect(screen.getAllByTestId("voice-message")).toHaveLength(1);
    });
    expect(fake().startCalls[0]?.textOnly).toBe(true);
    // The session without a microphone is connected: the primary control is the one that finishes it.
    expect(screen.getByTestId("voice-end")).toBeInTheDocument();
  });

  it("draws the citation chips the agent reports, named by section, and drops somebody else's page", async () => {
    render(<VoicePanel lang="en" variant="dialog" />);

    await waitFor(() => {
      expect(window.__katalisVoiceFake).toBeDefined();
    });
    await start();

    act(() => {
      fake().callTool("mostrar_fuentes", {
        fuentes: [
          { titulo: "cafe-la-horquilla.md · Precios", url: "/#cita-1" },
          { titulo: "cafe-la-horquilla.md", url: "/#la-regla-de-las-dos-bolsas" },
          { titulo: "Ajeno", url: "https://otro.example/#cita-1" },
        ],
      });
    });

    const chips = await screen.findAllByTestId("voice-source");

    expect(chips).toHaveLength(2);
    expect(chips[0]).toHaveTextContent("cafe-la-horquilla.md · Precios");
    expect(chips[1]).toHaveTextContent("cafe-la-horquilla.md · La regla de las dos bolsas");
    expect(chips[0]).toHaveAttribute("href", "/#cita-1");
  });

  it("explains a refused microphone and still opens the written question", async () => {
    render(<VoicePanel lang="en" variant="dialog" />);

    await waitFor(() => {
      expect(window.__katalisVoiceFake).toBeDefined();
    });

    act(() => {
      fake().failNextStart("Permission denied");
    });

    fireEvent.click(screen.getByTestId("voice-start"));

    await waitFor(() => {
      expect(screen.getByTestId("voice-error")).toHaveTextContent(en.micError);
    });

    fireEvent.change(screen.getByTestId("voice-text"), {
      target: { value: "How much is a tune-up?" },
    });
    fireEvent.click(screen.getByTestId("voice-send"));

    await waitFor(() => {
      expect(screen.getAllByTestId("voice-message")).toHaveLength(1);
    });
    expect(fake().startCalls.at(-1)?.textOnly).toBe(true);
    expect(screen.getByTestId("voice-end")).toBeInTheDocument();
  });

  it("says in words that the day is spent when the server answers 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => urlFailure(429, { status: "limited", limit: 30 })),
    );

    render(<VoicePanel lang="en" variant="dialog" />);

    await waitFor(() => {
      expect(window.__katalisVoiceFake).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("voice-start"));

    await waitFor(() => {
      expect(screen.getByTestId("voice-error")).toHaveTextContent(en.limitError);
    });
    expect(fake().startCalls).toHaveLength(0);
  });

  it("says in words that a limit below one session leaves the voice off", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => urlFailure(429, { status: "limited", reason: "below-session", limit: 3 })),
    );

    render(<VoicePanel lang="en" variant="dialog" />);

    await waitFor(() => {
      expect(window.__katalisVoiceFake).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("voice-start"));

    await waitFor(() => {
      expect(screen.getByTestId("voice-error")).toHaveTextContent(en.limitTooLow);
    });
    expect(screen.getByTestId("voice-error")).not.toHaveTextContent(en.limitError);
    expect(fake().startCalls).toHaveLength(0);
  });

  it("says the same in Spanish", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => urlFailure(429, { status: "limited", reason: "below-session", limit: 3 })),
    );

    render(<VoicePanel lang="es" variant="dialog" />);

    await waitFor(() => {
      expect(window.__katalisVoiceFake).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("voice-start"));

    await waitFor(() => {
      expect(screen.getByTestId("voice-error")).toHaveTextContent(es.limitTooLow);
    });
  });

  it("says in words that the voice is not configured when the server answers 503", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => urlFailure(503, { status: "unconfigured", missing: ["ELEVENLABS_API_KEY"] })),
    );

    render(<VoicePanel lang="en" variant="dialog" />);

    await waitFor(() => {
      expect(window.__katalisVoiceFake).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("voice-start"));

    await waitFor(() => {
      expect(screen.getByTestId("voice-error")).toHaveTextContent(en.notConfigured);
    });
  });

  it("says in words that the conversation broke when the SDK reports an error", async () => {
    render(<VoicePanel lang="en" variant="dialog" />);

    await waitFor(() => {
      expect(window.__katalisVoiceFake).toBeDefined();
    });
    await start();

    act(() => {
      fake().fail("the socket closed");
    });

    await waitFor(() => {
      expect(screen.getByTestId("voice-error")).toHaveTextContent(en.genericError);
    });
  });

  it("speaks the language of the page and never shows the key", async () => {
    render(<VoicePanel lang="es" variant="dialog" />);

    expect(screen.getByTestId("voice-panel")).toHaveTextContent(es.title);
    expect(screen.getByTestId("voice-state")).toHaveTextContent(es.idle);
    expect(screen.getByTestId("voice-privacy")).toHaveTextContent("ElevenLabs");
    expect(document.body.textContent ?? "").not.toContain("xi-api-key");
    expect(document.body.textContent ?? "").not.toContain("ELEVENLABS_API_KEY");
  });
});
