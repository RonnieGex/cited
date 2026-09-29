import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";

// Every scenario of `openspec/changes/public-page-and-widget/specs/public-chat/spec.md` that a browser can prove,
// against the application served by `npm run start` with the corpus of `samples/` ingested by the deterministic
// providers: no scenario of this file calls a real provider.
//
// The widget has its own file, `e2e/widget.spec.ts`, because both of its scenarios need a second origin.

const questionLabel = "Your question";
const askButton = "Ask";
const answer = '[data-cited="answer"]';

async function ask(page: Page, text: string): Promise<void> {
  await page.getByLabel(questionLabel).fill(text);
  await page.getByRole("button", { name: askButton }).click();
}

test("an answer with its sources: the chip opens the excerpt, the document and the heading", async ({
  page,
}) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);

  await ask(page, "¿Cuánto cuesta la afinación de una bicicleta?");

  await expect(page.locator(answer).first()).toContainText("380 pesos");

  const chip = page.getByRole("button", { name: "Citation 1" });

  await expect(chip).toBeVisible();
  await chip.click();
  await expect(page.locator('[data-cited="citation"]')).toContainText(
    "Afinación de bicicleta: 380 pesos.",
  );
  await expect(page.locator('[data-cited="citation"]')).toContainText("cafe-la-horquilla.md");
  await expect(page.locator('[data-cited="citation"]')).toContainText("Precios");
});

test("a refusal: the message is styled as such and carries no citation chip", async ({ page }) => {
  await page.goto("/");

  await ask(page, "Do you sell submarines?");

  await expect(page.locator('[data-cited="refusal"]')).toContainText(
    "I can't find that in this business's documents.",
  );
  await expect(page.locator('[data-cited="refusal"]')).toContainText("Not in the documents");
  await expect(page.getByRole("button", { name: /^Citation \d+$/ })).toHaveCount(0);
});

test("the answer is rendered safely: injected HTML reaches no element of the DOM", async ({
  page,
}) => {
  await page.route("**/api/ask", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "answered",
        answer:
          "<img src=x onerror=alert(1)> and [a link](javascript:alert(1)) and the tune-up is 380 pesos [1]",
        citations: [
          {
            n: 1,
            document: "cafe-la-horquilla.md",
            heading: "Precios",
            position: 3,
            excerpt: "Afinación de bicicleta: 380 pesos.",
          },
        ],
      }),
    });
  });

  await page.goto("/");
  await ask(page, "¿Cuánto cuesta la afinación de una bicicleta?");

  const hostile = page.locator(answer).first();

  await expect(hostile).toContainText("<img src=x onerror=alert(1)>");
  await expect(hostile).toContainText("javascript:alert(1)");
  await expect(hostile.locator("img")).toHaveCount(0);
  await expect(hostile.locator("a")).toHaveCount(0);
  await expect(page.locator("[onerror], [onload]")).toHaveCount(0);
});

test("a follow-up keeps its thread in the tab and a new tab starts clean", async ({
  page,
  browser,
}) => {
  const sent: string[] = [];
  const watch = (target: Page): void => {
    target.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/api/ask")) {
        sent.push((JSON.parse(request.postData() ?? "{}") as { sessionId?: string }).sessionId ?? "");
      }
    });
  };

  watch(page);
  await page.goto("/");
  await ask(page, "¿Cuánto cuesta la afinación de una bicicleta?");
  await expect(page.locator(answer)).toHaveCount(1);
  await ask(page, "¿Y el cambio de cámara?");
  await expect(page.locator(answer)).toHaveCount(2);

  expect(sent).toHaveLength(2);
  expect(sent[0]).not.toBe("");
  expect(sent[0]).toBe(sent[1]);
  expect(await page.evaluate(() => window.sessionStorage.getItem("cited-session"))).toBe(sent[0]);

  const other = await browser.newContext();
  const otherPage = await other.newPage();

  watch(otherPage);
  await otherPage.goto("/");
  await ask(otherPage, "¿Cuánto cuesta la afinación de una bicicleta?");
  await expect(otherPage.locator(answer)).toHaveCount(1);

  expect(sent).toHaveLength(3);
  expect(sent[2]).not.toBe("");
  expect(sent[2]).not.toBe(sent[0]);

  await other.close();
});

test.describe("the public page speaks English first", () => {
  test.use({ locale: "es-ES" });

  test("opens in English although the browser prefers Spanish, and answers in Spanish", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByLabel(questionLabel)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cited");
    await expect(page.getByText("Ask anything about this business")).toBeVisible();

    await page.getByRole("button", { name: "Español" }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByLabel("Tu pregunta")).toBeVisible();
    await expect(page.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await page.getByLabel("Tu pregunta").fill("¿Cuánto cuesta la afinación de una bicicleta?");
    await page.getByRole("button", { name: "Preguntar" }).click();

    await expect(page.locator(answer).first()).toContainText("Respuesta del proveedor de prueba");
    await expect(page.locator(answer).first()).toContainText("380 pesos");
    await expect(page.getByRole("button", { name: "Cita 1" })).toBeVisible();
  });
});

test("the public page and the embed pass axe at level A and AA", async ({ page }) => {
  for (const path of ["/", "/embed"]) {
    const response = await page.goto(path);

    expect(response?.status(), path).toBe(200);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    console.log(
      `${path}: axe ${results.violations.length} violations, ${results.passes.length} rules passed`,
    );

    expect(
      results.violations.map(
        (violation) => `${path} ${violation.id} (${violation.impact}): ${violation.nodes.length} nodes`,
      ),
    ).toEqual([]);
  }
});
