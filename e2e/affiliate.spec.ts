import { expect, test } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { adminStrings } from "../lib/i18n/admin";
import {
  E2E_ADDRESS,
  E2E_ADMIN_PASSWORD,
  E2E_AFFILIATE_DATABASE_URL,
  E2E_AFFILIATE_URL,
} from "./admin-fixtures";

// Task 10.5 of the contract, the two halves that the review of Codex found missing (Major M-4) and the requirement
// "Honest provider catalogue with disclosed links":
//
// - the browser flow with the affiliate switch **on**, which no committed link could prove before;
// - the read of **every** `/api/admin/*` response after a key is saved, and of the store itself, which is what task 6.1
//   claimed and did not do: the list of the routes is taken from the tree, and `tests/affiliate-links.test.ts` fails
//   the day a route is added without being read here.
//
// The provider is the local double this spec serves on port 3216, which the environment of the service points
// `DEEPSEEK_BASE_URL` at: the panel makes a real HTTP round trip and no test reaches a real provider. The double
// answers any authorization, so the same service works for this suite and for `e2e/providers.spec.ts` (which sends no
// key to a local Ollama and expects the answer of the model). The key of the good case is the empty one and the store
// of this service is disposable: it holds the key only when the test saves one.

const english = adminStrings("en");
const goodKey = "sk-afiliados-0000000000007788";
const badKey = "sk-rechazada-0000000000000001";
const doublePort = 3216;

let double: Server;

function providerDouble(): Server {
  return createServer((request, response) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const authorization = request.headers.authorization ?? "";

      response.setHeader("content-type", "application/json");

      if (authorization === `Bearer ${goodKey}` || authorization.length === 0) {
        response.writeHead(200);
        response.end(
          JSON.stringify({
            id: "chatcmpl-doble",
            object: "chat.completion",
            created: 1_700_000_000,
            model: "deepseek-flash",
            choices: [
              { index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" },
            ],
          }),
        );

        return;
      }

      response.writeHead(401);
      response.end(
        JSON.stringify({
          error: {
            message: `Incorrect API key provided: ${authorization}`,
            type: "invalid_request_error",
            code: "invalid_api_key",
          },
        }),
      );
    });
  });
}

test.beforeAll(async () => {
  double = providerDouble();

  await new Promise<void>((resolve) => {
    double.listen(doublePort, "127.0.0.1", resolve);
  });
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => {
    double.closeAllConnections();
    double.close(() => {
      resolve();
    });
  });
});

test.describe.configure({ mode: "serial" });

test("the affiliate link is labelled before the click and the plain link is nowhere", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel(english.passwordLabel).fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: english.signIn }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(english.setupTitle);

  await page.goto("/admin/ai");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(english.aiTitle);

  const answers = page.getByRole("region", { name: english.answersSection });
  const deepseek = answers.locator("li", { hasText: "DeepSeek" });

  await expect(deepseek.getByText(english.paidLink)).toBeVisible();
  await expect(deepseek.getByRole("link", { name: english.getKey })).toHaveAttribute(
    "href",
    E2E_AFFILIATE_URL,
  );

  // The rest of the catalogue carries no programme: its links are plain and carry no label.
  const labels = await page.getByText(english.paidLink).count();

  expect(labels).toBe(1);
  await expect(answers.getByRole("link", { name: "https://platform.deepseek.com" })).toHaveCount(0);
});

test("the key is tested, saved, and never comes back in any response nor in the store", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel(english.passwordLabel).fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: english.signIn }).click();
  // The sign-in of the panel is a navigation of the browser: it has to settle before the next `goto`, or the second
  // one lands while the first is still in flight.
  await expect(page.getByRole("heading", { level: 1 })).toContainText(english.setupTitle);

  await page.goto("/admin/ai");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(english.aiTitle);

  const answers = page.getByRole("region", { name: english.answersSection });

  await answers.getByLabel(english.providerLabel).selectOption("deepseek");
  await answers.getByLabel(english.keyLabel).fill(goodKey);
  await answers.getByRole("button", { name: english.testKey }).click();
  await expect(answers.getByRole("status")).toContainText("deepseek-flash");
  await answers.getByRole("button", { name: english.saveKey }).click();
  await expect(answers.getByText(/••••7788/)).toBeVisible();

  // Every route of `/api/admin/*` that the build carries, with its own method and its own body. The list is written
  // here on purpose: a route that is not in it is a route nobody read.
  type Call = {
    path: string;
    method: string;
    body?: unknown;
    form?: Record<string, { name: string; mimeType: string; buffer: Buffer }>;
    allow?: number[];
  };
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const calls: Call[] = [
    { path: "/api/admin/providers", method: "GET" },
    { path: "/api/admin/providers/test", method: "POST", body: { kind: "chat", provider: "deepseek", key: badKey } },
    { path: "/api/admin/providers/save", method: "POST", body: { kind: "chat", provider: "deepseek", key: badKey } },
    { path: "/api/admin/providers/reindex", method: "POST", body: {} },
    { path: "/api/admin/providers", method: "DELETE", body: { kind: "embeddings" } },
    { path: "/api/admin/setup", method: "GET" },
    { path: "/api/admin/setup/test", method: "POST", body: { target: "chat" } },
    { path: "/api/admin/documents", method: "GET" },
    {
      path: "/api/admin/documents",
      method: "POST",
      form: { document: { name: "precios.md", mimeType: "text/markdown", buffer: Buffer.from("Afinación: 380 pesos.") } },
    },
    { path: "/api/admin/documents/reingest", method: "POST", body: { name: "no-existe.md" } },
    { path: "/api/admin/documents/delete", method: "POST", body: { name: "no-existe.md" } },
    { path: "/api/admin/business", method: "GET" },
    { path: "/api/admin/business", method: "PUT", body: { name: "Taller La Horquilla", tone: "close", language: "es" } },
    { path: "/api/admin/business/logo", method: "GET" },
    {
      path: "/api/admin/business/logo",
      method: "POST",
      form: { logo: { name: "logo.png", mimeType: "image/png", buffer: png } },
    },
    { path: "/api/admin/conversations", method: "GET" },
    { path: "/api/admin/conversations/delete", method: "POST", body: {} },
    // The voice screen (merged with elevenlabs-voice-agent): without a key of ElevenLabs the agent cannot be created,
    // and 503 is the answer of an installation that has not set voice up. It must still carry no key.
    { path: "/api/admin/voice", method: "GET" },
    { path: "/api/admin/voice", method: "POST", body: {}, allow: [503] },
    { path: "/api/admin/login", method: "POST", body: { password: "no-es-la-clave" } },
    { path: "/api/admin/logout", method: "POST", body: {} },
  ];

  for (const call of calls) {
    const headers: Record<string, string> = {
      origin: new URL(page.url()).origin,
      "x-forwarded-for": E2E_ADDRESS,
    };

    if (call.body !== undefined) {
      headers["content-type"] = "application/json";
    }

    const answer = await page.request.fetch(call.path, {
      method: call.method,
      headers,
      ...(call.body === undefined ? {} : { data: JSON.stringify(call.body) }),
      ...(call.form === undefined ? {} : { multipart: call.form }),
    });
    const text = await answer.text();

    if (!call.allow?.includes(answer.status())) {
      expect(answer.status(), `${call.method} ${call.path}`).toBeLessThan(500);
    }
    expect(text, `${call.method} ${call.path}`).not.toContain(goodKey);
    expect(text, `${call.method} ${call.path}`).not.toContain("v1:");
    expect(text, `${call.method} ${call.path}`).not.toContain("Incorrect API key");
  }

  // After the logout and the failed login of the list above, the session of the panel is gone: it is opened again to
  // read the state and the pages with a session, which is what the owner has.
  await page.goto("/admin");
  await page.getByLabel(english.passwordLabel).fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: english.signIn }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(english.setupTitle);

  const state = await page.request.get("/api/admin/providers");
  const stateText = await state.text();

  expect(stateText).toContain("7788");
  expect(stateText).not.toContain(goodKey);

  // The page the owner reads, and the page of whoever installs.
  for (const path of ["/admin/ai", "/admin", "/admin/documents", "/admin/business", "/admin/conversations"]) {
    const html = await (await page.request.get(path)).text();

    expect(html, path).not.toContain(goodKey);
    expect(html, path).not.toContain("v1:");
  }

  // The store itself: the raw bytes of the file of the database, which is what a copy of the installation would carry.
  const bytes = readFileSync(E2E_AFFILIATE_DATABASE_URL);
  const raw = bytes.toString("latin1");

  expect(raw).not.toContain(goodKey);
  expect(raw).toContain("v1:");

  const database = new DatabaseSync(E2E_AFFILIATE_DATABASE_URL, { readOnly: true });
  const rows = database
    .prepare("SELECT provider, model, key_ciphertext, key_last4 FROM provider_settings WHERE kind = 'chat'")
    .all() as Array<Record<string, unknown>>;

  database.close();

  expect(rows).toHaveLength(1);
  expect(rows[0]?.["provider"]).toBe("deepseek");
  expect(String(rows[0]?.["key_last4"])).toBe("7788");
  expect(String(rows[0]?.["key_ciphertext"])).toMatch(/^v1:/);
  expect(JSON.stringify(rows)).not.toContain(goodKey);
});
