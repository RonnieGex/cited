// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/admin/login/route";
import { POST as logout } from "@/app/api/admin/logout/route";
import { GET as business, PUT as businessWrite } from "@/app/api/admin/business/route";
import { POST as logo } from "@/app/api/admin/business/logo/route";
import { GET as conversations } from "@/app/api/admin/conversations/route";
import { POST as conversationsDelete } from "@/app/api/admin/conversations/delete/route";
import { GET as documents, POST as documentsUpload } from "@/app/api/admin/documents/route";
import { POST as documentsDelete } from "@/app/api/admin/documents/delete/route";
import { POST as documentsReingest } from "@/app/api/admin/documents/reingest/route";
import { GET as setup } from "@/app/api/admin/setup/route";
import { POST as setupTest } from "@/app/api/admin/setup/test/route";
import { SESSION_COOKIE, sessionToken } from "@/lib/admin/session";
import { openStore } from "@/lib/store";
import {
  ADMIN_PASSWORD,
  ADMIN_SECRET,
  cleanup,
  configured,
  environmentOf,
  jsonRequest,
  sessionHeader,
  setEnvironment,
} from "./admin-helpers";

const repositoryRoot = resolve(import.meta.dirname, "..");

afterAll(cleanup);

function request(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
  method = "POST",
): Request {
  return jsonRequest(`http://localhost${path}`, body, method, headers);
}

describe("POST /api/admin/login", () => {
  it("answers 503 naming the missing variable when the panel has no password", async () => {
    await environmentOf({ ADMIN_PASSWORD: "", ADMIN_SESSION_SECRET: "" });

    const response = await login(request("/api/admin/login", { password: "lo-que-sea" }));
    const body = (await response.json()) as { status: string; error: string };

    expect(response.status).toBe(503);
    expect(body.error).toContain("ADMIN_PASSWORD");
    expect(body.error).toContain("ADMIN_SESSION_SECRET");
  });

  it("answers 401 to a wrong password and 200 with the signed cookie to the right one", async () => {
    const environment = await environmentOf(configured());

    const wrong = await login(request("/api/admin/login", { password: "no-es-la-clave" }));

    expect(wrong.status).toBe(401);
    expect(wrong.headers.get("set-cookie")).toBeNull();

    const right = await login(request("/api/admin/login", { password: ADMIN_PASSWORD }));
    const cookie = right.headers.get("set-cookie") ?? "";

    expect(right.status).toBe(200);
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).not.toContain("Secure");
    expect(cookie).not.toContain(ADMIN_PASSWORD);

    const token = cookie.slice(cookie.indexOf("=") + 1, cookie.indexOf(";"));

    expect(environment["ADMIN_SESSION_SECRET"]).toBe(ADMIN_SECRET);

    const accepted = await setup(
      new Request("http://localhost/api/admin/setup", { headers: sessionHeader(token) }),
    );

    expect(accepted.status).toBe(200);
  });

  it("answers 429 with Retry-After to the sixth attempt even with the right password", async () => {
    await environmentOf({ ...configured(), TRUST_PROXY: "1" });

    const address = { "x-forwarded-for": "198.51.100.31" };

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const failed = await login(
        request("/api/admin/login", { password: `intento-${attempt}` }, address),
      );

      expect(failed.status, `attempt ${attempt}`).toBe(401);
    }

    const locked = await login(request("/api/admin/login", { password: ADMIN_PASSWORD }, address));
    const body = (await locked.json()) as { status: string };
    const retryAfter = Number(locked.headers.get("retry-after"));

    expect(locked.status).toBe(429);
    expect(body.status).toBe("locked");
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(15 * 60);
    expect(locked.headers.get("set-cookie")).toBeNull();

    const other = await login(
      request("/api/admin/login", { password: ADMIN_PASSWORD }, { "x-forwarded-for": "198.51.100.32" }),
    );

    expect(other.status).toBe(200);

    const cleared = await login(request("/api/admin/login", { password: ADMIN_PASSWORD }, address));
    const again = await login(request("/api/admin/login", { password: ADMIN_PASSWORD }, address));

    expect(cleared.status).toBe(429);
    expect(again.status).toBe(429);
  });

  it("refuses a body that is not a password and a mutation from another origin", async () => {
    await environmentOf(configured());

    const empty = await login(request("/api/admin/login", {}));
    const wrongType = await login(request("/api/admin/login", { password: 42 }));
    const notJson = await login(
      new Request("http://localhost/api/admin/login", {
        method: "POST",
        headers: { "content-type": "text/plain", origin: "http://localhost" },
        body: "password=hola",
      }),
    );
    const foreign = await login(
      request("/api/admin/login", { password: ADMIN_PASSWORD }, { origin: "http://evil.example.com" }),
    );

    expect(empty.status).toBe(400);
    expect(wrongType.status).toBe(400);
    expect(notJson.status).toBe(415);
    expect(foreign.status).toBe(403);
    expect(foreign.headers.get("set-cookie")).toBeNull();
  });
});

describe("every admin route checks the session", () => {
  it("answers 401 without a session cookie and changes nothing", async () => {
    await environmentOf(configured());

    const routes: Array<[string, (request: Request) => Promise<Response>]> = [
      ["/api/admin/setup", (one) => setup(one)],
      ["/api/admin/setup/test", (one) => setupTest(one)],
      ["/api/admin/business", (one) => business(one)],
      ["/api/admin/business", (one) => businessWrite(one)],
      ["/api/admin/business/logo", (one) => logo(one)],
      ["/api/admin/documents", (one) => documents(one)],
      ["/api/admin/documents", (one) => documentsUpload(one)],
      ["/api/admin/documents/delete", (one) => documentsDelete(one)],
      ["/api/admin/documents/reingest", (one) => documentsReingest(one)],
      ["/api/admin/conversations", (one) => conversations(one)],
      ["/api/admin/conversations/delete", (one) => conversationsDelete(one)],
      ["/api/admin/logout", (one) => logout(one)],
    ];

    for (const [path, handler] of routes) {
      const response = await handler(request(path, { target: "chat", name: "documento.md" }));

      expect(response.status, path).toBe(401);
    }

    const store = await openStore(process.env["DATABASE_URL"] ?? "");

    expect(await store.countDocuments()).toBe(0);
    expect(await store.readBusiness()).toBeNull();
    expect(await store.countTurns()).toBe(0);
    store.close();
  });

  it("answers 503 without a password, and 403 to a mutation from another origin", async () => {
    await environmentOf({ ...configured(), ADMIN_PASSWORD: "" });

    const unconfigured = await setup(new Request("http://localhost/api/admin/setup"));

    expect(unconfigured.status).toBe(503);
    expect(await unconfigured.text()).toContain("ADMIN_PASSWORD");

    const environment = await environmentOf(configured());
    const token = sessionToken(ADMIN_SECRET, new Date());

    expect(environment["ADMIN_PASSWORD"]).toBe(ADMIN_PASSWORD);

    const guarded = await documents(
      new Request("http://localhost/api/admin/documents", {
        method: "POST",
        headers: { ...sessionHeader(token), origin: "http://evil.example.com" },
        body: new FormData(),
      }),
    );

    expect(guarded.status).toBe(403);
  });
});

describe("GET /api/admin/setup", () => {
  it("lists every variable of the template grouped by purpose and never a value", async () => {
    await environmentOf(configured());

    const token = sessionToken(ADMIN_SECRET, new Date());
    const response = await setup(
      new Request("http://localhost/api/admin/setup", { headers: sessionHeader(token) }),
    );
    const body = (await response.json()) as {
      groups: Array<{ title: string; variables: Array<{ name: string; configured: boolean }> }>;
    };
    const names = body.groups.flatMap((group) => group.variables.map((variable) => variable.name));
    const template = readFileSync(resolve(repositoryRoot, ".env.example"), "utf8");
    const expected = [...template.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1] ?? "");

    expect(response.status).toBe(200);
    expect(names.sort()).toEqual([...expected].sort());
    expect(names).toContain("ADMIN_PASSWORD");
    expect(names).toContain("CHAT_PROVIDER");
    expect(names).toContain("ALLOWED_ORIGINS");

    const text = JSON.stringify(body);

    expect(text).not.toContain(ADMIN_PASSWORD);
    expect(text).not.toContain(ADMIN_SECRET);

    const administration = body.groups.find((group) =>
      group.variables.some((variable) => variable.name === "ADMIN_PASSWORD"),
    );

    expect(administration?.title).toBe("Required");
    expect(
      administration?.variables.find((variable) => variable.name === "ADMIN_PASSWORD")?.configured,
    ).toBe(true);
  });
});

describe("POST /api/admin/setup/test", () => {
  it("makes one offline call with the deterministic providers and reports success", async () => {
    await environmentOf({ ...configured(), CHAT_PROVIDER: "fake", EMBEDDINGS_PROVIDER: "fake" });

    const token = sessionToken(ADMIN_SECRET, new Date());
    const headers = sessionHeader(token);

    const chat = await setupTest(
      request("/api/admin/setup/test", { target: "chat" }, headers),
    );
    const embedding = await setupTest(
      request("/api/admin/setup/test", { target: "embeddings" }, headers),
    );

    expect(chat.status).toBe(200);
    expect(await chat.json()).toMatchObject({ status: "ok", target: "chat" });
    expect(embedding.status).toBe(200);
    expect(await embedding.json()).toMatchObject({ status: "ok", target: "embeddings" });
  });

  it("reports the provider error with every key removed", async () => {
    const secretKey = "sk-live-abcdefghijklmnopqrstuvwxyz0123456789";

    await environmentOf({
      ...configured(),
      CHAT_PROVIDER: "openai",
      OPENAI_API_KEY: "",
      ANTHROPIC_API_KEY: secretKey,
    });

    const token = sessionToken(ADMIN_SECRET, new Date());
    const failing = await setupTest(
      request("/api/admin/setup/test", { target: "chat" }, sessionHeader(token)),
    );
    const text = await failing.text();

    expect(failing.status).toBe(200);
    expect(text).toContain("OPENAI_API_KEY");
    expect(text).not.toContain(secretKey);
    expect(text).not.toMatch(/sk-[a-z0-9]/i);

    const unknown = await setupTest(
      request("/api/admin/setup/test", { target: "no-existe" }, sessionHeader(token)),
    );

    expect(unknown.status).toBe(400);

    await setEnvironment({ ...configured(), CHAT_PROVIDER: "openai", OPENAI_API_KEY: secretKey });

    const badEmbeddings = await setupTest(
      request("/api/admin/setup/test", { target: "embeddings" }, sessionHeader(token)),
    );

    expect(badEmbeddings.status).toBe(200);
    expect(await badEmbeddings.text()).toContain("EMBEDDINGS_PROVIDER");
  });
});
