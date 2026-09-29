import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { adminStrings } from "../lib/i18n/admin";
import { E2E_ADDRESS, E2E_ADMIN_PASSWORD, E2E_BASE_URL } from "./admin-fixtures";

const english = adminStrings("en");
const spanish = adminStrings("es");
const password = E2E_ADMIN_PASSWORD;
const sample = resolve(process.cwd(), "samples", "cafe-la-horquilla.md");
const language = { name: "Español" };

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "x-forwarded-for": E2E_ADDRESS } });

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

  await page.getByLabel(english.passwordLabel).fill(password);
  await page.getByRole("button", { name: english.signIn }).click();

  await expect(page.getByRole("heading", { level: 1 })).toContainText(english.setupTitle);
}

test("the panel opens in English and signs the owner in", async ({ page }) => {
  const response = await page.goto("/admin");

  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(english.signInTitle);
  await expect(page.getByRole("button", { name: english.signIn })).toBeVisible();

  await page.getByLabel(english.passwordLabel).fill("no-es-la-clave");
  await page.getByRole("button", { name: english.signIn }).click();
  await expect(page.getByText(english.wrongPassword)).toBeVisible();

  await page.getByLabel(english.passwordLabel).fill(password);
  await page.getByRole("button", { name: english.signIn }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(english.setupTitle);

  await axe(page);
});

test("the sixth attempt of one address is locked", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: E2E_BASE_URL,
    extraHTTPHeaders: { "x-forwarded-for": "198.51.100.240" },
  });
  const page = await context.newPage();

  await page.goto("/admin");

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    await page.getByLabel(english.passwordLabel).fill(`intento-${attempt}`);
    await page.getByRole("button", { name: english.signIn }).click();
    await expect(page.getByText(english.wrongPassword)).toBeVisible();
  }

  await page.getByLabel(english.passwordLabel).fill(password);
  await page.getByRole("button", { name: english.signIn }).click();
  await expect(page.getByText(english.locked)).toBeVisible();

  await context.close();
});

test("the setup page lists the variables without their values and tests a provider", async ({
  page,
}) => {
  await signIn(page);

  await expect(page.getByText("ADMIN_PASSWORD", { exact: true })).toBeVisible();
  await expect(page.getByText("EMBEDDINGS_PROVIDER", { exact: true })).toBeVisible();
  await expect(page.getByText("ALLOWED_ORIGINS", { exact: true })).toBeVisible();

  const html = await page.content();

  expect(html).not.toContain(password);

  await page.getByRole("button", { name: english.testChat }).click();
  await expect(page.getByRole("status")).toBeVisible({ timeout: 30_000 });

  await axe(page);
});

test("the business form is saved and the panel speaks Spanish", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/business");

  await page.getByLabel(english.businessName).fill("Café La Horquilla");
  await page.getByLabel(english.businessTone).fill("cercano y breve");
  await page.getByLabel(english.businessTopics).fill("precios de la competencia");
  await page.getByLabel(english.welcomeEn).fill("Welcome. Ask about our policies.");
  await page.getByLabel(english.welcomeEs).fill("Bienvenido. Pregunta por nuestras políticas.");
  await page.getByRole("button", { name: english.saveBusiness }).click();
  await expect(page.getByRole("status")).toContainText(english.saved);

  await expect(page.getByTestId("language-switch").getByRole("button", { name: language.name })).toBeVisible();
  await page.getByRole("button", { name: language.name }).click();
  await page.waitForLoadState("load");

  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("button", { name: spanish.saveBusiness })).toBeVisible();

  await axe(page);
});

test("an SVG logo is refused and a document is uploaded, listed and deleted", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/business");

  await page.getByLabel(english.logoLabel).setInputFiles({
    name: "logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>'),
  });
  await page.getByRole("button", { name: english.uploadLogo }).click();
  await expect(page.getByText(/not a PNG, JPEG or WebP/)).toBeVisible();

  await page.goto("/admin/documents");
  await page.getByLabel(english.uploadDocument).setInputFiles(sample);
  await page.getByRole("button", { name: english.upload }).click();
  await expect(page.getByText("cafe-la-horquilla.md")).toBeVisible();

  const row = page.getByRole("row", { name: /cafe-la-horquilla\.md/ });

  await expect(row).toContainText("4");
  await row.getByRole("button", { name: `${english.deleteDocument} cafe-la-horquilla.md` }).click();
  await expect(page.getByText("cafe-la-horquilla.md")).toHaveCount(0);

  await axe(page);
});

test("the conversations are listed and deleted", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/documents");
  await page.getByLabel(english.uploadDocument).setInputFiles(sample);
  await page.getByRole("button", { name: english.upload }).click();
  await expect(page.getByText("cafe-la-horquilla.md")).toBeVisible();

  const answered = await page.request.post("/api/ask", {
    data: { question: "¿Cuánto cuesta una afinación de bicicleta?", sessionId: "e2e-panel" },
  });

  expect(answered.status()).toBe(200);

  await page.goto("/admin/conversations");
  await expect(page.getByText("¿Cuánto cuesta una afinación de bicicleta?")).toBeVisible();
  await expect(page.getByText(english.answered)).toBeVisible();

  await axe(page);

  await page.getByRole("button", { name: english.deleteAll }).click();
  await expect(page.getByText("¿Cuánto cuesta una afinación de bicicleta?")).toHaveCount(0);
});
