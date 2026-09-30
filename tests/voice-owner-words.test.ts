// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceAgent } from "@/components/admin/VoiceAgent";
import { adminStrings } from "@/lib/i18n/admin";
import { VOICE_STRINGS } from "@/lib/i18n/voice";
import { sessionToken } from "@/lib/admin/session";
import { useVoiceTransport } from "@/lib/voice/transport";
import {
  ADMIN_PASSWORD,
  ADMIN_SECRET,
  adminRequest,
  cleanup,
  environmentOf,
  sessionHeader,
} from "./admin-helpers";
import { elevenLabsDouble } from "./fakes/elevenlabs-api";

// Task 2.1 of the contract `voice-owner-words`, the scenario "Voice that is not set up" of the requirement "The owner
// never reads a variable name in an answer of the panel" (`specs/provider-settings/spec.md`) and the requirement "A
// visitor never learns how the server is configured" (`specs/voice-agent/spec.md`): the three answers that named a
// variable of the environment on the merged tree stop naming it. `POST /api/admin/voice` answers the code
// `voice_not_configured` or `voice_provider_failed`, `GET /api/voice/signed-url` answers `voice_unavailable` to any
// visitor, the screen of the voice agent translates each code into the words of the owner and links "For the
// installer", and the names reach only the log of the server and the page of whoever installs.
//
// The walk at the end is the guard of the whole rule: every `route.ts` of `app/api/admin` and `app/api/voice` is
// called with a signed-in request in an installation with the panel configured and no voice, and its status, its
// headers and its body are compared against every name of `.env.example`, read from the template itself, so a variable
// added tomorrow is covered the day it is written. The single answer that may name them is the JSON that feeds "For
// the installer", and this file proves that it is the only one.
//
// No test here calls ElevenLabs: the transport is the double of `tests/fakes/elevenlabs-api.ts` and no socket is
// opened. The store is a temporary file per test.

const template = readFileSync(join(import.meta.dirname, "..", ".env.example"), "utf8");
const variableNames = [...template.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1] as string);

const key = "sk-katalis-de-prueba-que-no-debe-viajar";
const toolSecret = "un-secreto-de-herramienta-de-voz-de-prueba";
const agent = "agent_de_la_prueba";
const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const routes = import.meta.glob(["../app/api/admin/**/route.ts", "../app/api/voice/**/route.ts"], {
  eager: true,
}) as Record<string, Record<string, unknown>>;

// The one route whose answer is the data of "For the installer" (`app/admin/page.tsx` reads the same helper): the page
// of whoever installs and the JSON that feeds it are the only places where a variable of the environment may be named.
const installerData = "GET http://localhost/api/admin/setup";
const voiceRoute = "POST http://localhost/api/admin/voice";
const signedUrlRoute = "GET http://localhost/api/voice/signed-url";

afterEach(() => {
  useVoiceTransport(null);
  vi.unstubAllGlobals();
});

// No test of this file may reach a provider. Every route that needs an answer of ElevenLabs goes through
// `voiceTransport()`, which is the double of `tests/fakes/elevenlabs-api.ts` while a test installs it; if a test ever
// forgets, the global `fetch` below fails instead of opening a socket to `api.elevenlabs.io`.
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("a test tried to reach the network"))));
});

afterAll(cleanup);

function namesIn(text: string): string[] {
  return variableNames.filter((name) => text.includes(name));
}

function panel(overrides: Record<string, string | undefined> = {}): Promise<Record<string, string | undefined>> {
  return environmentOf({
    ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: ADMIN_SECRET,
    DAILY_VOICE_MINUTE_LIMIT: "30",
    ...overrides,
  });
}

function urlOf(file: string): string {
  return `http://localhost/${file.replace("../app/", "").replace(/\/route\.ts$/, "")}`;
}

function signedIn(url: string, method: string, body?: string): Request {
  return adminRequest(url, {
    method,
    headers: sessionHeader(sessionToken(ADMIN_SECRET, new Date())),
    ...(body === undefined ? {} : { body }),
  });
}

type Answer = { where: string; status: number; headers: string; reason: string; text: string };

async function walkEveryRoute(): Promise<Answer[]> {
  const walked: Answer[] = [];

  for (const [file, module] of Object.entries(routes)) {
    for (const method of methods) {
      const handler = module[method];

      if (typeof handler !== "function") {
        continue;
      }

      const url = urlOf(file);
      const where = `${method} ${url}`;
      const response = await (handler as (request: Request) => Promise<Response>)(
        signedIn(url, method, method === "GET" ? undefined : "{}"),
      );
      const text = await response.text();
      const headers = [...response.headers].map(([name, value]) => `${name}: ${value}`).join("\n");
      let body: Record<string, unknown> = {};

      try {
        body = JSON.parse(text) as Record<string, unknown>;
      } catch {
        body = {};
      }

      walked.push({
        where,
        status: response.status,
        headers,
        reason: typeof body["reason"] === "string" ? body["reason"] : "",
        text,
      });
    }
  }

  return walked;
}

describe("an installation with the panel configured and no voice", () => {
  it("has names to look for, taken from the template", () => {
    expect(variableNames).toContain("ELEVENLABS_API_KEY");
    expect(variableNames).toContain("VOICE_TOOL_SECRET");
    expect(variableNames.length).toBeGreaterThan(20);
  });

  it("answers voice_not_configured from the route and writes the names to the log once", async () => {
    const written = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const { POST } = await import("@/app/api/admin/voice/route");

      // The set that writes the names is the process of `lib/admin/guard.ts`, so this test asks for the one line no
      // other test of this file asks for (the key is set and only the secret of the tool is missing): the two presses
      // below are the only ones that can write it, and the second one must write nothing.
      await panel({ ELEVENLABS_API_KEY: key, VOICE_TOOL_SECRET: "" });

      const first = await POST(signedIn("http://localhost/api/admin/voice", "POST", "{}"));
      const firstBody = (await first.json()) as Record<string, unknown>;
      const second = await POST(signedIn("http://localhost/api/admin/voice", "POST", "{}"));
      const lines = written.mock.calls
        .map((call) => call.map(String).join(" "))
        .filter((line) => line.includes("VOICE_TOOL_SECRET"));

      expect(first.status).toBe(503);
      expect(firstBody).toEqual({ status: "unconfigured", reason: "voice_not_configured" });
      expect(namesIn(JSON.stringify(firstBody))).toEqual([]);
      expect(second.status).toBe(503);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain("VOICE_TOOL_SECRET");
      expect(namesIn(lines[0] ?? "")).toEqual(["VOICE_TOOL_SECRET"]);
    } finally {
      written.mockRestore();
    }
  });

  it("answers voice_provider_failed when ElevenLabs refuses, and never the text of the provider", async () => {
    const double = elevenLabsDouble({ failures: { "POST /v1/convai/secrets": 401 } });

    useVoiceTransport(double.transport);

    const { POST } = await import("@/app/api/admin/voice/route");
    const { saveBusiness } = await import("@/lib/settings/business");

    await panel({ ELEVENLABS_API_KEY: key, VOICE_TOOL_SECRET: toolSecret });

    await saveBusiness(
      {
        name: "Café La Horquilla",
        primaryColor: null,
        tone: "",
        language: "es",
        forbiddenTopics: [],
        welcome: { en: "", es: "" },
      },
      process.env,
    );

    const response = await POST(signedIn("http://localhost/api/admin/voice", "POST", "{}"));
    const text = await response.text();
    const body = JSON.parse(text) as Record<string, unknown>;

    expect(response.status).toBe(503);
    expect(body).toEqual({ status: "unavailable", reason: "voice_provider_failed" });
    expect(namesIn(text)).toEqual([]);
    expect(text).not.toContain("ElevenLabs answered 401");
    expect(double.callsTo("POST", "/v1/convai/secrets")).toHaveLength(1);
  });

  it("answers business_unnamed, with no press on ElevenLabs, when the business has no name", async () => {
    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);

    const { POST } = await import("@/app/api/admin/voice/route");

    await panel({ ELEVENLABS_API_KEY: key, VOICE_TOOL_SECRET: toolSecret });

    const response = await POST(signedIn("http://localhost/api/admin/voice", "POST", "{}"));
    const text = await response.text();

    expect(response.status).toBe(409);
    expect(JSON.parse(text)).toEqual({ status: "incomplete", reason: "business_unnamed" });
    expect(namesIn(text)).toEqual([]);
    expect(text).not.toContain("ElevenLabs");
    expect(double.calls).toHaveLength(0);
  });

  it("answers voice_unavailable to a visitor, for the missing key and for the missing agent", async () => {
    const { GET } = await import("@/app/api/voice/signed-url/route");

    await panel({ ELEVENLABS_API_KEY: "", ELEVENLABS_AGENT_ID: "" });

    const withoutKey = await GET();
    const withoutKeyText = await withoutKey.text();

    expect(withoutKey.status).toBe(503);
    expect(JSON.parse(withoutKeyText)).toEqual({ status: "unavailable", reason: "voice_unavailable" });
    expect(namesIn(withoutKeyText)).toEqual([]);

    await panel({ ELEVENLABS_API_KEY: key, ELEVENLABS_AGENT_ID: "" });

    const withoutAgent = await GET();
    const withoutAgentText = await withoutAgent.text();

    expect(withoutAgent.status).toBe(503);
    expect(JSON.parse(withoutAgentText)).toEqual({ status: "unavailable", reason: "voice_unavailable" });
    expect(namesIn(withoutAgentText)).toEqual([]);
  });

  it("keeps the name of the variable of the daily cap out of the 429 of a visitor", async () => {
    const { GET } = await import("@/app/api/voice/signed-url/route");

    await panel({ ELEVENLABS_API_KEY: key, ELEVENLABS_AGENT_ID: agent, DAILY_VOICE_MINUTE_LIMIT: "3" });

    const tooLow = await GET();
    const tooLowText = await tooLow.text();

    expect(tooLow.status).toBe(429);
    expect(JSON.parse(tooLowText)).toEqual({ status: "limited", reason: "below-session" });
    expect(namesIn(tooLowText)).toEqual([]);

    const double = elevenLabsDouble();

    useVoiceTransport(double.transport);
    await panel({ ELEVENLABS_API_KEY: key, ELEVENLABS_AGENT_ID: agent, DAILY_VOICE_MINUTE_LIMIT: "5" });

    const first = await GET();
    const spent = await GET();
    const spentText = await spent.text();

    expect(first.status).toBe(200);
    expect(spent.status).toBe(429);
    expect(JSON.parse(spentText)).toEqual({ status: "limited", reason: "spent" });
    expect(namesIn(spentText)).toEqual([]);
    expect(double.callsTo("GET", "/v1/convai/conversation/get-signed-url")).toHaveLength(1);
  });

  it("answers every route of the panel and of the voice with no name of the template", async () => {
    await panel();

    const walked = await walkEveryRoute();

    expect(walked.length).toBeGreaterThanOrEqual(18);

    for (const answer of walked) {
      if (answer.where === installerData) {
        // "For the installer": the only answer that names the variables of the template, and the one every other
        // guard of this repository sends the installer to.
        expect(answer.status, answer.where).toBe(200);
        expect(namesIn(answer.text).length, answer.where).toBeGreaterThan(20);

        continue;
      }

      expect(
        namesIn(`${answer.status}\n${answer.headers}\n${answer.text}`),
        `${answer.where}: ${answer.text}`,
      ).toEqual([]);
    }

    const voice = walked.find((answer) => answer.where === voiceRoute);

    expect(voice?.status, voice?.text).toBe(503);
    expect(voice?.reason).toBe("voice_not_configured");

    const signed = walked.find((answer) => answer.where === signedUrlRoute);

    expect(signed?.status, signed?.text).toBe(503);
    expect(signed?.reason).toBe("voice_unavailable");
  });
});

describe("the screen of the voice agent", () => {
  function stubAnswer(status: number, body: Record<string, unknown>): void {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));
  }

  async function press(lang: "en" | "es"): Promise<HTMLElement> {
    render(createElement(VoiceAgent, { lang, status: { agentId: null, updatedAt: null } }));
    fireEvent.click(screen.getByTestId("voice-agent-create"));

    return screen.findByTestId("voice-agent-error");
  }

  for (const lang of ["en", "es"] as const) {
    it(`shows voice_not_configured in the words of the owner and links Settings (${lang})`, async () => {
      stubAnswer(503, {
        status: "unconfigured",
        reason: "voice_not_configured",
        missing: ["ELEVENLABS_API_KEY", "VOICE_TOOL_SECRET"],
        error: "the voice agent needs ELEVENLABS_API_KEY and VOICE_TOOL_SECRET in the environment of the server",
      });

      const error = await press(lang);

      expect(error).toHaveTextContent(VOICE_STRINGS[lang].voiceNotConfigured);
      expect(namesIn(error.textContent ?? "")).toEqual([]);
      expect(
        within(error).getByRole("link", { name: adminStrings(lang).navSettings }),
      ).toHaveAttribute("href", "/admin/settings");
    });

    it(`shows voice_provider_failed in the words of the owner and never the raw error (${lang})`, async () => {
      stubAnswer(503, {
        status: "unavailable",
        reason: "voice_provider_failed",
        error: "ElevenLabs answered 401 to the secret and DATABASE_URL is missing",
      });

      const error = await press(lang);

      expect(error).toHaveTextContent(VOICE_STRINGS[lang].voiceProviderFailed);
      expect(error).not.toHaveTextContent("ElevenLabs answered 401");
      expect(namesIn(error.textContent ?? "")).toEqual([]);
    });

    it(`shows business_unnamed in the words of the owner and links Look and publish (${lang})`, async () => {
      stubAnswer(409, { status: "incomplete", reason: "business_unnamed" });

      const error = await press(lang);

      expect(error).toHaveTextContent(VOICE_STRINGS[lang].voiceBusinessUnnamed);
      expect(error).not.toHaveTextContent(VOICE_STRINGS[lang].voiceProviderFailed);
      expect(namesIn(error.textContent ?? "")).toEqual([]);
      expect(
        within(error).getByRole("link", { name: adminStrings(lang).navPublish }),
      ).toHaveAttribute("href", "/admin/publish");
    });
  }
});
