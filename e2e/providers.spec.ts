import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { adminStrings } from "../lib/i18n/admin";
import { E2E_ADMIN_PASSWORD, E2E_BASE_URL } from "./admin-fixtures";

// Task 2.3 of the contract: the browser flows of "AI and keys" and of "For the installer". The provider is the local
// double this spec serves on port 3216, which `playwright.config.ts` points `OPENAI_BASE_URL` at: the panel makes a
// real HTTP round trip and no test reaches a real provider. The key of the good case is a string of the test, and the
// store of this server is disposable.

const english = adminStrings("en");
const spanish = adminStrings("es");
const goodKey = "sk-buena-0000000000007788";
const badKey = "sk-rechazada-0000000000000001";
const doublePort = 3216;
const hostedOffer = "https://katalis.dev/cited";
const signupLinks = ["https://platform.openai.com/api-keys", "https://platform.deepseek.com"];

let double: Server;

function providerDouble(): Server {
  return createServer((request, response) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const authorization = request.headers.authorization ?? "";

      response.setHeader("content-type", "application/json");

      if (authorization === `Bearer ${goodKey}`) {
        response.writeHead(200);
        response.end(
          JSON.stringify({
            id: "chatcmpl-doble",
            object: "chat.completion",
            created: 1_700_000_000,
            model: "gpt-4o-mini",
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

async function axe(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    results.violations.map(
      (violation) => `${violation.id} (${violation.impact}): ${violation.nodes.length} nodes`,
    ),
  ).toEqual([]);
}

async function signIn(page: Page): Promise<void> {
  await page.goto("/admin");
  await page.getByLabel(english.passwordLabel).fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: english.signIn }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(english.setupTitle);

  await page.goto("/admin/ai");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(english.aiTitle);
}

test("the page of AI and keys lists the providers with one honest line and a link", async ({
  page,
}) => {
  await signIn(page);

  const answers = page.getByRole("region", { name: english.answersSection });

  await expect(answers).toContainText(english.notConnected);
  await expect(answers).toContainText("DeepSeek");
  await expect(answers).toContainText("China");
  await expect(answers.getByRole("link", { name: english.getKey }).first()).toBeVisible();

  const meaning = page.getByRole("region", { name: english.meaningSection });

  await expect(meaning).toContainText(english.notConnected);
  await expect(meaning.getByRole("button", { name: english.keywordChoose })).toBeVisible();

  await axe(page);
});

test("the affiliate switch is off, the links are plain and the hosted offer is shown", async ({
  page,
}) => {
  await signIn(page);

  const answers = page.getByRole("region", { name: english.answersSection });
  const links = answers.getByRole("link", { name: english.getKey });
  const hrefs = await links.evaluateAll((found) =>
    found.map((one) => (one as HTMLAnchorElement).href),
  );

  expect(hrefs.length).toBeGreaterThan(3);

  for (const href of hrefs) {
    expect(href.startsWith("https://")).toBe(true);
    expect(href).not.toContain("afiliado");
  }

  expect(signupLinks.some((one) => hrefs.includes(one))).toBe(true);
  expect(await page.getByText(english.paidLink).count()).toBe(0);
  await expect(answers.getByRole("link", { name: english.hostedOffer })).toHaveAttribute(
    "href",
    hostedOffer,
  );
});

test("a rejected key is said in words and nothing is saved", async ({ page }) => {
  await signIn(page);

  const answers = page.getByRole("region", { name: english.answersSection });

  await answers.getByLabel(english.providerLabel).selectOption("openai");
  await answers.getByLabel(english.keyLabel).fill(badKey);
  await answers.getByRole("button", { name: english.testKey }).click();

  await expect(answers.getByRole("alert")).toContainText(english.reasonRejectedKey);

  const html = await page.content();

  // The text of the provider never reaches the browser; the key the owner pasted stays in the field until they fix
  // it, which is what the form is for, and nothing was saved.
  expect(html).not.toContain("Incorrect API key");
  expect(html).not.toContain("v1:");
  await expect(answers.getByRole("button", { name: english.saveKey })).toBeDisabled();
  await expect(answers).toContainText(english.notConnected);
});

test("a chat provider is connected through its double and only its last four characters show", async ({
  page,
}) => {
  await signIn(page);

  const answers = page.getByRole("region", { name: english.answersSection });

  await answers.getByLabel(english.providerLabel).selectOption("openai");
  await answers.getByLabel(english.keyLabel).fill(goodKey);
  await answers.getByRole("button", { name: english.testKey }).click();

  await expect(answers.getByRole("status")).toContainText("gpt-4o-mini");

  await answers.getByRole("button", { name: english.saveKey }).click();
  await expect(answers.getByText(/••••7788/)).toBeVisible();

  const html = await page.content();

  expect(html).not.toContain(goodKey);
  expect(html).not.toContain("v1:");

  await page.reload();
  await expect(page.getByRole("region", { name: english.answersSection }).getByText(/••••7788/)).toBeVisible();
});

test("keyword search is connected without a key and says it searches by words", async ({ page }) => {
  await signIn(page);

  const meaning = page.getByRole("region", { name: english.meaningSection });

  await meaning.getByRole("button", { name: english.keywordChoose }).click();
  await expect(meaning.getByRole("status")).toContainText(english.keywordSaved);

  // The confirmation is inline, as every other action of the panel; the card of the connected state is what the page
  // renders from the store on the next visit.
  await page.reload();
  await expect(page.getByRole("region", { name: english.meaningSection })).toContainText(
    english.keywordActive,
  );
});

test("the panel server shows its own provider as set by the server, read only", async ({ page }) => {
  await signIn(page);
  await page.goto(`${E2E_BASE_URL}/admin/ai`);

  const answers = page.getByRole("region", { name: english.answersSection });

  await expect(answers).toContainText(english.setByServer);
  await expect(answers).toContainText(english.serverExplanation);
  await expect(answers.getByLabel(english.keyLabel)).toHaveCount(0);
  expect(await page.getByText(english.paidLink).count()).toBe(0);

  await axe(page);
});

test("the page speaks Spanish completely", async ({ page }) => {
  await signIn(page);

  await page.getByTestId("language-switch").getByRole("button", { name: "Español" }).click();
  await page.waitForLoadState("load");

  const answers = page.getByRole("region", { name: spanish.answersSection });
  const meaning = page.getByRole("region", { name: spanish.meaningSection });

  await expect(page.getByRole("heading", { level: 1 })).toContainText(spanish.aiTitle);
  await expect(answers).toContainText(spanish.connected);
  await expect(meaning).toContainText(spanish.keywordActive);

  const html = await page.content();

  expect(html).not.toContain(goodKey);
  expect(html).not.toContain("CHAT_PROVIDER");
  expect(html).not.toContain("ENCRYPTION_KEY");
});
