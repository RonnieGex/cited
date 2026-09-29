// @vitest-environment node
import { afterAll, describe, expect, it } from "vitest";
import { GET as business, PUT as businessWrite } from "@/app/api/admin/business/route";
import { POST as logo } from "@/app/api/admin/business/logo/route";
import { GET as brandLogo } from "@/app/api/brand/logo/route";
import { askQuestion } from "@/lib/answer/ask";
import { buildMessages } from "@/lib/answer/prompt";
import { LOGO_CACHE_CONTROL, MAX_LOGO_BYTES, detectLogoMime } from "@/lib/admin/logo";
import { SESSION_COOKIE, sessionToken } from "@/lib/admin/session";
import { createFakeChatModel, type FakeCall } from "@/lib/models/fake";
import { readBusiness, saveBusiness, topicsFrom } from "@/lib/settings/business";
import { sharedStore } from "@/lib/store/instance";
import {
  ADMIN_SECRET,
  cleanup,
  configured,
  environmentOf,
  jpegBytes,
  jsonRequest,
  pngBytes,
  renamedTextBytes,
  svgBytes,
  uploadForm,
  webpBytes,
} from "./admin-helpers";

afterAll(cleanup);

const welcome = {
  en: "Welcome. Ask about our policies.",
  es: "Bienvenido. Pregunta por nuestras polÃ­ticas.",
};

const stored = {
  name: "CafÃ© La Horquilla",
  primaryColor: "#171717",
  tone: "cercano y breve",
  language: "es" as const,
  forbiddenTopics: ["precios de la competencia"],
  welcome,
};

function token(): Record<string, string> {
  return { cookie: `${SESSION_COOKIE}=${sessionToken(ADMIN_SECRET, new Date())}` };
}

function put(body: unknown): Request {
  return jsonRequest("http://localhost/api/admin/business", body, "PUT", token());
}

function read(): Request {
  return new Request("http://localhost/api/admin/business", { headers: token() });
}

function upload(bytes: Uint8Array, name: string, type: string): Request {
  return new Request("http://localhost/api/admin/business/logo", {
    method: "POST",
    headers: { ...token(), origin: "http://localhost" },
    body: uploadForm(name, bytes, type),
  });
}

describe("the business settings", () => {
  it("stores name, color, tone, language, topics and the two welcomes", async () => {
    await environmentOf(configured());

    expect(await readBusiness()).toBeNull();

    const saved = await businessWrite(put(stored));
    const body = (await saved.json()) as { business: Record<string, unknown> };

    expect(saved.status).toBe(200);
    expect(body.business).toMatchObject({
      name: stored.name,
      primaryColor: "#171717",
      tone: stored.tone,
      language: "es",
      forbiddenTopics: ["precios de la competencia"],
      hasLogo: false,
      welcome,
    });
    expect(String(body.business["updatedAt"])).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const again = await readBusiness();

    expect(again?.language).toBe("es");
    expect(again?.forbiddenTopics).toEqual(["precios de la competencia"]);

    const fetched = await business(read());
    const listed = (await fetched.json()) as { business: Record<string, unknown> };

    expect(fetched.status).toBe(200);
    expect(listed.business["name"]).toBe(stored.name);
  });

  it("defaults the language to English and refuses a shape it cannot store", async () => {
    await environmentOf(configured());

    const minimal = await businessWrite(put({ name: "Cited", welcome: { en: "", es: "" } }));
    const body = (await minimal.json()) as { business: Record<string, unknown> };

    expect(minimal.status).toBe(200);
    expect(body.business["language"]).toBe("en");
    expect(body.business["primaryColor"]).toBeNull();
    expect(body.business["forbiddenTopics"]).toEqual([]);

    const empty = await businessWrite(put({ name: "   ", welcome }));
    const wrongLanguage = await businessWrite(put({ name: "Cited", language: "fr", welcome }));
    const wrongColor = await businessWrite(put({ name: "Cited", primaryColor: "azul", welcome }));
    const wrongTopics = await businessWrite(
      put({ name: "Cited", forbiddenTopics: "precios", welcome }),
    );

    expect(empty.status).toBe(400);
    expect(wrongLanguage.status).toBe(400);
    expect(wrongColor.status).toBe(400);
    expect(wrongTopics.status).toBe(400);
  });

  it("splits the topics the owner writes one per line", () => {
    expect(topicsFrom("precios de la competencia\n  temas mÃ©dicos  \n\n")).toEqual([
      "precios de la competencia",
      "temas mÃ©dicos",
    ]);
    expect(topicsFrom("uno, dos , tres")).toEqual(["uno", "dos", "tres"]);
    expect(topicsFrom("")).toEqual([]);
  });
});

describe("the logo of the business", () => {
  it("knows the three accepted formats by their bytes", () => {
    expect(detectLogoMime(pngBytes())).toBe("image/png");
    expect(detectLogoMime(jpegBytes())).toBe("image/jpeg");
    expect(detectLogoMime(webpBytes())).toBe("image/webp");
    expect(detectLogoMime(svgBytes())).toBeNull();
    expect(detectLogoMime(renamedTextBytes())).toBeNull();
    expect(detectLogoMime(new Uint8Array())).toBeNull();
    expect(MAX_LOGO_BYTES).toBe(512 * 1024);
  });

  it("refuses an SVG and a renamed text file without touching the stored logo", async () => {
    await environmentOf(configured());

    const good = await logo(upload(pngBytes(), "logo.png", "image/png"));

    expect(good.status).toBe(200);

    const before = await brandLogo();

    expect(before.status).toBe(200);

    const vector = await logo(upload(svgBytes(), "logo.svg", "image/svg+xml"));
    const renamed = await logo(upload(renamedTextBytes(), "logo.png", "image/png"));

    expect(vector.status).toBe(400);
    expect(renamed.status).toBe(400);
    expect(await vector.text()).not.toContain("<svg");

    const after = await brandLogo();

    expect(after.status).toBe(200);
    expect(new Uint8Array(await after.arrayBuffer())).toEqual(pngBytes());
  });

  it("refuses more than 512 KB and serves the stored bytes with their type and a cache header", async () => {
    await environmentOf(configured());

    const missing = await brandLogo();

    expect(missing.status).toBe(404);

    const big = new Uint8Array(MAX_LOGO_BYTES + 1);

    big.set(pngBytes(), 0);

    expect((await logo(upload(big, "grande.png", "image/png"))).status).toBe(400);

    const webp = await logo(upload(webpBytes(), "logo.webp", "image/webp"));
    const body = (await webp.json()) as { business: { hasLogo: boolean } };

    expect(webp.status).toBe(200);
    expect(body.business.hasLogo).toBe(true);

    const served = await brandLogo();

    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/webp");
    expect(served.headers.get("cache-control")).toBe(LOGO_CACHE_CONTROL);
    expect(new Uint8Array(await served.arrayBuffer())).toEqual(webpBytes());

    expect((await readBusiness())?.hasLogo).toBe(true);
  });
});

describe("the prompt of the answers reads the business", () => {
  it("carries the tone, the language and the forbidden topics as rules", () => {
    const messages = buildMessages({
      question: "Â¿CuÃ¡nto cuesta?",
      hits: [
        {
          passageId: 1,
          name: "precios.md",
          heading: "Precios",
          position: 0,
          text: "380 pesos.",
          score: 1,
        },
      ],
      history: [],
      business: { ...stored, hasLogo: false, updatedAt: "2026-09-29T00:00:00.000Z" },
    });
    const system = messages[0]?.content ?? "";

    expect(messages[0]?.role).toBe("system");
    expect(system).toContain("cercano y breve");
    expect(system).toContain("precios de la competencia");
    expect(system).toMatch(/Answer in Spanish/);
    expect(system).toContain("NO_ANSWER");
    expect(system).toMatch(/language of the question/i);
  });

  it("sends the rules to the model of a real question", async () => {
    await environmentOf({ ...configured(), CHAT_PROVIDER: "fake", EMBEDDINGS_PROVIDER: "fake" });

    const store = await sharedStore();

    await store.replaceDocument(
      { name: "precios.md", sha256: "a".repeat(64), type: "md", pages: null },
      [
        {
          position: 0,
          heading: "Precios",
          text: "AfinaciÃ³n de bicicleta: 380 pesos.",
          embedding: new Array<number>(64).fill(0.5),
        },
      ],
    );

    await saveBusiness(stored);

    const calls: FakeCall[] = [];
    const outcome = await askQuestion({
      question: "Â¿CuÃ¡nto cuesta una afinaciÃ³n de bicicleta?",
      store,
      embeddings: {
        dimensions: 64,
        embed: async (texts) => texts.map(() => new Array<number>(64).fill(0.5)),
        embedQuery: async () => new Array<number>(64).fill(0.5),
      },
      model: createFakeChatModel({ onCall: (call) => calls.push(call) }),
      environment: process.env,
      ip: "203.0.113.5",
    });

    expect(outcome.status).toBe("answered");

    const system = calls[0]?.messages.find((message) => message.role === "system")?.content ?? "";

    expect(system).toContain("cercano y breve");
    expect(system).toContain("precios de la competencia");
    expect(system).toMatch(/Answer in Spanish/);
  });
});
