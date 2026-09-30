// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import AdminAi from "@/app/admin/ai/page";
import AdminHome from "@/app/admin/home/page";
import AdminInformation from "@/app/admin/information/page";
import AdminPublish from "@/app/admin/publish/page";
import AdminConversations from "@/app/admin/conversations/page";
import AdminSettings from "@/app/admin/settings/page";
import { ADMIN_SECRET, cleanup, environmentOf, setEnvironment } from "./admin-helpers";

// Section 10.4 of the contract, the Major M-3 of `katalis-dev/tasks/revision-community-12.md` and the amendment of
// `proposal.md`: **no page of the panel shows the name of a variable of the environment**. "For the installer"
// (`/admin/settings` since `guided-setup-and-knowledge` decision 11, where that page lives under Settings) is the only
// one that lists them, because that page exists for whoever installs and it is read only. The API error bodies and the
// messages of the command line may name one ("the diagnostic of whoever installs"); the interface of the owner may not.
//
// This file renders every page of the panel as a browser would receive it and reads its text. The environment of the
// pages is the one of an installation halfway through its setup, which is exactly when a diagnostic could leak.

// The names of the template of `.env.example`, read from the file itself: a new variable is covered by this test the
// day it is added, without anybody remembering to add it here.
const template = readFileSync(join(import.meta.dirname, "..", ".env.example"), "utf8");
const variableNames = [...template.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1] as string);
const half = {
  CHAT_PROVIDER: "openai",
  OPENAI_API_KEY: "",
  EMBEDDINGS_PROVIDER: "openai",
  EMBEDDINGS_BASE_URL: "",
  EMBEDDINGS_MODEL: "",
  EMBEDDINGS_API_KEY: "",
  ENCRYPTION_KEY: "",
};

let langCookie: string | undefined;

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
  await cleanup();
});

async function pageOf(overrides: Record<string, string | undefined> = {}): Promise<string> {
  await environmentOf({
    ADMIN_PASSWORD: "una-clave-de-prueba-que-nadie-adivina",
    ADMIN_SESSION_SECRET: ADMIN_SECRET,
    CHAT_PROVIDER: "fake",
    EMBEDDINGS_PROVIDER: "fake",
    ...overrides,
  });

  return renderToStaticMarkup(await AdminAi());
}

function namesIn(html: string): string[] {
  return variableNames.filter((name) => html.includes(name));
}

describe("the pages of the panel never show the name of a variable", () => {
  it("has names to look for, taken from the template", () => {
    expect(variableNames).toContain("OPENAI_API_KEY");
    expect(variableNames).toContain("EMBEDDINGS_PROVIDER");
    expect(variableNames.length).toBeGreaterThan(20);
  });

  it("keeps them out of AI and keys when nothing is connected", async () => {
    expect(namesIn(await pageOf())).toEqual([]);
  });

  it("keeps them out of AI and keys when the server has half a configuration", async () => {
    const html = await pageOf(half);

    expect(namesIn(html)).toEqual([]);
    expect(html.toLowerCase()).toContain("panel");
  });

  it("keeps them out of AI and keys in Spanish too", async () => {
    langCookie = "es";

    const html = await pageOf(half);

    expect(namesIn(html)).toEqual([]);
    expect(html).toContain("Fijado por el servidor");
  });

  it("keeps them out of the other pages of the panel", async () => {
    setEnvironment({
      ADMIN_PASSWORD: "una-clave-de-prueba-que-nadie-adivina",
      ADMIN_SESSION_SECRET: ADMIN_SECRET,
      ...half,
    });

    // The sections of the workspace of decision 11, which are the pages an owner reads: Settings is not one of them
    // here because it carries "For the installer", and that page is the case below. The guided setup of `/admin` is not
    // rendered here because its lane is a client component and this file renders on the server without a router; its
    // words are the ones of `lib/admin/setup-copy.ts`, which the case of `provider-panel-words.test.ts` reads.
    const rendered = await Promise.all([
      AdminHome(),
      AdminInformation(),
      AdminPublish(),
      AdminConversations(),
    ]);

    for (const one of rendered) {
      expect(namesIn(renderToStaticMarkup(one))).toEqual([]);
    }
  });

  it("shows them on For the installer, which is the page of whoever installs", async () => {
    setEnvironment({
      ADMIN_PASSWORD: "una-clave-de-prueba-que-nadie-adivina",
      ADMIN_SESSION_SECRET: ADMIN_SECRET,
      ...half,
    });

    const html = renderToStaticMarkup(await AdminSettings());

    expect(namesIn(html)).toContain("OPENAI_API_KEY");
    expect(namesIn(html)).toContain("EMBEDDINGS_PROVIDER");
  });

  it("keeps the diagnostic of the missing variable in the command line of the installer", async () => {
    const { embeddingsProblem, resolveEmbeddings } = await import("@/lib/settings/providers");
    const { sharedStore } = await import("@/lib/store/instance");

    await environmentOf({
      ADMIN_PASSWORD: "una-clave-de-prueba-que-nadie-adivina",
      ADMIN_SESSION_SECRET: ADMIN_SECRET,
      EMBEDDINGS_PROVIDER: "openai",
      EMBEDDINGS_BASE_URL: "",
      EMBEDDINGS_MODEL: "",
      EMBEDDINGS_API_KEY: "",
    });

    const store = await sharedStore(process.env);
    const problem = embeddingsProblem(await resolveEmbeddings({ environment: process.env, store })) ?? "";

    expect(problem).toContain("EMBEDDINGS_BASE_URL");
    expect(problem).toContain("EMBEDDINGS_API_KEY");

    // And with nothing chosen anywhere, the diagnostic names the variable that whoever installs has to fill.
    await environmentOf({
      ADMIN_PASSWORD: "una-clave-de-prueba-que-nadie-adivina",
      ADMIN_SESSION_SECRET: ADMIN_SECRET,
      EMBEDDINGS_PROVIDER: "",
    });

    const empty = await sharedStore(process.env);
    const nothing = embeddingsProblem(await resolveEmbeddings({ environment: process.env, store: empty })) ?? "";

    expect(nothing).toContain("EMBEDDINGS_PROVIDER");
  });
});

describe("the messages the panel can render", () => {
  it("answers the upload of the panel without naming a variable", async () => {
    const { POST: documentsUpload } = await import("@/app/api/admin/documents/route");
    const { SESSION_COOKIE, sessionToken } = await import("@/lib/admin/session");

    // The state of an installation that configured the meaning search on the server and left it half done: the
    // diagnostic of the command line names the variables, and the panel cannot repeat it to the owner.
    await environmentOf({
      ADMIN_PASSWORD: "una-clave-de-prueba-que-nadie-adivina",
      ADMIN_SESSION_SECRET: ADMIN_SECRET,
      ...half,
    });

    const form = new FormData();

    form.set("document", new File(["Afinación: 380 pesos."], "precios.md", { type: "text/markdown" }));

    const response = await documentsUpload(
      new Request("http://localhost/api/admin/documents", {
        method: "POST",
        headers: {
          cookie: `${SESSION_COOKIE}=${sessionToken(ADMIN_SECRET, new Date())}`,
          origin: "http://localhost",
        },
        body: form,
      }),
    );
    const text = await response.text();

    expect(response.status).toBe(400);
    expect(text).not.toContain("EMBEDDINGS_PROVIDER");
    expect(text).not.toContain("EMBEDDINGS_API_KEY");
    expect(text.toLowerCase()).toContain("connect it again");
    expect(text.toLowerCase()).toContain("panel");
  });

  it("answers the re-index of the panel without naming a variable", async () => {
    const { POST: providersReindex } = await import("@/app/api/admin/providers/reindex/route");
    const { SESSION_COOKIE, sessionToken } = await import("@/lib/admin/session");

    await environmentOf({
      ADMIN_PASSWORD: "una-clave-de-prueba-que-nadie-adivina",
      ADMIN_SESSION_SECRET: ADMIN_SECRET,
      ...half,
    });

    const response = await providersReindex(
      new Request("http://localhost/api/admin/providers/reindex", {
        method: "POST",
        headers: {
          cookie: `${SESSION_COOKIE}=${sessionToken(ADMIN_SECRET, new Date())}`,
          origin: "http://localhost",
          "content-type": "application/json",
        },
        body: "{}",
      }),
    );
    const text = await response.text();

    expect(response.status).toBe(400);
    expect(text).not.toContain("EMBEDDINGS_PROVIDER");
    expect(text).not.toContain("EMBEDDINGS_API_KEY");
    expect(text.toLowerCase()).toContain("connect it again");
  });
});
