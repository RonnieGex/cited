// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";import AdminAi from "@/app/admin/ai/page";
import AdminConversations from "@/app/admin/conversations/page";
import AdminHome from "@/app/admin/home/page";
import AdminInformation from "@/app/admin/information/page";
import AdminPublish from "@/app/admin/publish/page";
import AdminSettings from "@/app/admin/settings/page";
import { DELETE as providersRemove, GET as providersState } from "@/app/api/admin/providers/route";
import { POST as providersReindex } from "@/app/api/admin/providers/reindex/route";
import { POST as providersSave } from "@/app/api/admin/providers/save/route";
import { POST as providersTest } from "@/app/api/admin/providers/test/route";
import { sessionToken } from "@/lib/admin/session";
import {
  ADMIN_PASSWORD,
  ADMIN_SECRET,
  adminRequest,
  cleanup,
  environmentOf,
  sessionHeader,
} from "./admin-helpers";
import { openAiChatAnswer, providerDouble, type ProviderDouble } from "./provider-double";

// Task 11.3 of the contract, the requirement "The owner never reads a variable name in an answer of the panel" of
// `specs/provider-settings/spec.md` and the Major M-3 of `katalis-dev/tasks/revision-community-12b.md`: the routes of
// the panel answer a reason code and never the name of a variable of the environment, and the page translates that
// code into the words of the owner, sending to "For the installer" whatever only whoever installs can change.
//
// The names are read from the template of `.env.example`, so a variable added tomorrow is covered by this test the
// day it is written. "For the installer" (`/admin`) is the one page that names them, and this file proves that too: a
// rule that hid them everywhere would hide them from the person who has to fill them in.

const template = readFileSync(join(import.meta.dirname, "..", ".env.example"), "utf8");
const variableNames = [...template.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1] as string);

// The address of the review: the loopback of Ollama, which needs the permission of whoever installs Cited.
const refusedAddress = "http://127.0.0.1:11434/v1";
const localAllowed = { ALLOW_LOCAL_PROVIDERS: "1" } as const;

const half = {
  CHAT_PROVIDER: "openai",
  OPENAI_API_KEY: "",
  EMBEDDINGS_PROVIDER: "openai",
  EMBEDDINGS_BASE_URL: "",
  EMBEDDINGS_MODEL: "",
  EMBEDDINGS_API_KEY: "",
};

let langCookie: string | undefined;
const doubles: ProviderDouble[] = [];

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (langCookie === undefined ? undefined : { name, value: langCookie }),
  }),
  headers: async () => ({ get: () => null }),
}));

beforeEach(() => {
  langCookie = undefined;
});

afterAll(async () => {
  for (const double of doubles) {
    await double.close();
  }

  await cleanup();
});

async function double(): Promise<ProviderDouble> {
  const started = await providerDouble(() => ({ status: 200, body: openAiChatAnswer() }));

  doubles.push(started);

  return started;
}

function namesIn(text: string): string[] {
  return variableNames.filter((name) => text.includes(name));
}

function token(): string {
  return sessionToken(ADMIN_SECRET, new Date());
}

type Case = {
  name: string;
  method: "GET" | "POST" | "DELETE";
  path: string;
  body?: unknown;
  environment?: Record<string, string | undefined>;
  status: number;
  reason?: string;
};

async function call(one: Case): Promise<{ status: number; body: Record<string, unknown>; text: string }> {
  await environmentOf({
    ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: ADMIN_SECRET,
    ...half,
    ...(one.environment ?? {}),
  });

  const url = `http://localhost${one.path}`;
  const headers = sessionHeader(token());
  const payload = one.body === undefined ? {} : { body: JSON.stringify(one.body) };
  const request = adminRequest(url, { method: one.method, headers, ...payload });
  const response =
    one.method === "GET"
      ? await providersState(request)
      : one.method === "DELETE"
        ? await providersRemove(request)
        : one.path.endsWith("/reindex")
          ? await providersReindex(request)
          : one.path.endsWith("/save")
            ? await providersSave(request)
            : await providersTest(request);
  const text = await response.text();

  return { status: response.status, body: JSON.parse(text) as Record<string, unknown>, text };
}

// Every answer of every route of `/api/admin/providers`, in the states that fail and in the ones that work: the
// template of `.env.example` is what this file searches inside each of them.
const cases: Case[] = [
  {
    name: "the state of the panel",
    method: "GET",
    path: "/api/admin/providers",
    status: 200,
  },
  {
    name: "a test without a body",
    method: "POST",
    path: "/api/admin/providers/test",
    body: {},
    status: 400,
  },
  {
    name: "a test of a refused address",
    method: "POST",
    path: "/api/admin/providers/test",
    body: { kind: "chat", provider: "ollama", key: "", baseUrl: refusedAddress },
    status: 400,
    reason: "address_not_allowed",
  },
  {
    name: "a test of a cloud provider that names an address the server did not set",
    method: "POST",
    path: "/api/admin/providers/test",
    body: { kind: "chat", provider: "openai", key: "sk-de-prueba-0000000000001234", baseUrl: "https://miapi.example/v1" },
    environment: { OPENAI_BASE_URL: "https://api.openai.com/v1" },
    status: 400,
    reason: "address_not_allowed",
  },
  {
    name: "a save without a body",
    method: "POST",
    path: "/api/admin/providers/save",
    body: {},
    status: 400,
  },
  {
    name: "a save of a refused address",
    method: "POST",
    path: "/api/admin/providers/save",
    body: { kind: "chat", provider: "ollama", key: "", baseUrl: refusedAddress },
    status: 400,
    reason: "address_not_allowed",
  },
  {
    name: "a save without an encryption key",
    method: "POST",
    path: "/api/admin/providers/save",
    body: { kind: "chat", provider: "ollama", key: "sk-de-prueba-0000000000001234", baseUrl: refusedAddress },
    environment: { ...localAllowed, ENCRYPTION_KEY: "" },
    status: 503,
  },
  {
    name: "a save of the keyword mode",
    method: "POST",
    path: "/api/admin/providers/save",
    body: { kind: "embeddings", mode: "keyword" },
    status: 200,
  },
  {
    name: "a remove without a body",
    method: "DELETE",
    path: "/api/admin/providers",
    body: {},
    status: 400,
  },
  {
    name: "a re-index with nothing chosen",
    method: "POST",
    path: "/api/admin/providers/reindex",
    body: {},
    status: 400,
  },
];

describe("the responses of the provider routes", () => {
  it("has names to look for, taken from the template", () => {
    expect(variableNames).toContain("ALLOW_LOCAL_PROVIDERS");
    expect(variableNames.length).toBeGreaterThan(20);
  });

  it("never name a variable of the environment", async () => {
    for (const one of cases) {
      const answer = await call(one);

      expect(answer.status, one.name).toBe(one.status);
      expect(namesIn(answer.text), `${one.name}: ${answer.text}`).toEqual([]);

      if (one.reason !== undefined) {
        expect(answer.body["reason"], one.name).toBe(one.reason);
      }
    }
  });

  it("answers a local double without naming a variable of the environment", async () => {
    const seen = await double();
    const answer = await call({
      name: "a test of a local double",
      method: "POST",
      path: "/api/admin/providers/test",
      body: { kind: "chat", provider: "ollama", key: "", model: "llama3.1", baseUrl: `${seen.url}/v1` },
      environment: localAllowed,
      status: 200,
    });

    expect(answer.body["ok"], answer.text).toBe(true);
    expect(namesIn(answer.text)).toEqual([]);
    expect(seen.requests).toHaveLength(1);
  });

  it("keeps the sentence of a refused address in the words of the owner", async () => {
    const { PROVIDER_ADDRESS_ERROR } = await import("@/lib/admin/provider-request");

    expect(namesIn(PROVIDER_ADDRESS_ERROR)).toEqual([]);
    expect(PROVIDER_ADDRESS_ERROR.toLowerCase()).toContain("install");
    expect(PROVIDER_ADDRESS_ERROR).not.toContain("ALLOW_LOCAL_PROVIDERS");
  });
});

describe("the pages of the panel", () => {
  it("never name a variable of the environment outside For the installer", async () => {
    await environmentOf({
      ADMIN_PASSWORD,
      ADMIN_SESSION_SECRET: ADMIN_SECRET,
      ...half,
      ENCRYPTION_KEY: "",
    });

    // The guided setup of `/admin` is not rendered here: its lane is a client component and this file renders on the
    // server without a router. Its words are read from their own file, which is what the case below does.
    const rendered = await Promise.all([
      AdminAi(),
      AdminHome(),
      AdminInformation(),
      AdminPublish(),
      AdminConversations(),
    ]);

    for (const one of rendered) {
      expect(namesIn(renderToStaticMarkup(one))).toEqual([]);
    }
  });

  it("keeps the words of the guided setup out of every variable too", () => {
    // Decision 1: the four steps are written in the words of the owner, so the file that holds them names no variable.
    const words = readFileSync(join(import.meta.dirname, "..", "lib", "admin", "setup-copy.ts"), "utf8");
    const checklist = readFileSync(join(import.meta.dirname, "..", "lib", "admin", "setup-checklist.ts"), "utf8");

    expect(namesIn(words)).toEqual([]);
    expect(namesIn(checklist)).toEqual([]);
  });

  it("names them in For the installer, which is the page of whoever installs", async () => {
    await environmentOf({
      ADMIN_PASSWORD,
      ADMIN_SESSION_SECRET: ADMIN_SECRET,
      ...half,
    });

    const html = renderToStaticMarkup(await AdminSettings());

    expect(namesIn(html)).toContain("OPENAI_API_KEY");
    expect(namesIn(html)).toContain("EMBEDDINGS_PROVIDER");
  });

  it("keeps the sentence of a refused address in the words of the owner in both languages", async () => {
    const { adminStrings } = await import("@/lib/i18n/admin");

    for (const lang of ["en", "es"] as const) {
      const strings = adminStrings(lang);

      expect(namesIn(strings.reasonAddressNotAllowed), lang).toEqual([]);
      expect(strings.reasonAddressNotAllowed.toLowerCase(), lang).toMatch(/install|instal/);
      expect(strings.reasonAddressNotAllowedLink.length, lang).toBeGreaterThan(0);
    }
  });
});
