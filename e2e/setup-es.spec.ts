import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import type { Server } from "node:http";
import { resolve } from "node:path";
import { adminStrings } from "../lib/i18n/admin";
import { PUBLIC_STRINGS } from "../lib/i18n/public";
import { E2E_ADDRESS, E2E_ADMIN_PASSWORD } from "./admin-fixtures";
import {
  PROVIDER_DOUBLE_KEY,
  closeDouble,
  listenOnDoublePort,
  providerDouble,
} from "./provider-double";

// Task 10.1 of the amendment to `openspec/changes/guided-setup-and-knowledge/tasks.md`: the scenario "From zero to an
// answer" of `specs/owner-setup/spec.md` in Spanish, on the server of port 3211 that `playwright.config.ts` starts with
// an empty store and no provider at all. The chat provider is the local double this spec serves on port 3216, which the
// environment of that server points the OpenAI-compatible entries at: there is a real HTTP round trip and no test
// reaches a real provider.
//
// The cases run in order: the first one needs the store empty and the ones after it need what the first one built.

const spanish = adminStrings("es");
const spanishPublic = PUBLIC_STRINGS.es;
const password = E2E_ADMIN_PASSWORD;
const sampleDocument = "cafe-la-horquilla.md";
const secondsLimit = 300;
// Task 10.4 of the amendment: the captures of this walk land where `.gitignore` excludes them and are copied into the
// change by its report; they are taken with `prefers-reduced-motion: reduce`, so the highlighter is at rest.
const captures = resolve(process.cwd(), "test-results", "captures", "admin");

let double: Server;

test.beforeAll(async () => {
  double = providerDouble();

  await listenOnDoublePort(double);
});

test.afterAll(async () => {
  await closeDouble(double);
});

// Serial, and with no retry: a retry would re-enter a store another case of the group already walked.
test.describe.configure({ mode: "serial", retries: 0 });
test.use({ extraHTTPHeaders: { "x-forwarded-for": E2E_ADDRESS } });

async function shoot(page: Page, name: string, width: number): Promise<void> {
  mkdirSync(captures, { recursive: true });
  await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({ path: resolve(captures, `${name}-${width}.png`), fullPage: true });
}

async function axe(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    results.violations.map(
      (violation) => `${violation.id} (${violation.impact}): ${violation.nodes.length} nodes`,
    ),
  ).toEqual([]);
}

// The language is chosen on the public page, which is the same origin and writes the cookie the panel reads. Every case
// does it, because the browser of a case is a context of its own and the cookie of one does not reach the next. The
// first case still finds the assistant not ready, which is the scenario "Not ready" in Spanish.
async function speakSpanish(page: Page, notReady = false): Promise<void> {
  await page.goto("/");

  if (notReady) {
    await expect(page.getByText(PUBLIC_STRINGS.en.notReadyTitle)).toBeVisible();
  }

  await page.getByRole("button", { name: "Español" }).click();
  await page.waitForLoadState("load");

  if (notReady) {
    await expect(page.getByText(spanishPublic.notReadyTitle)).toBeVisible();
    await expect(page.getByRole("link", { name: spanishPublic.notReadyPanel })).toHaveAttribute(
      "href",
      "/admin",
    );
  }
}

async function signIn(page: Page, path = "/admin"): Promise<void> {
  await page.goto("/admin");

  if (await page.getByLabel(spanish.passwordLabel).isVisible()) {
    await page.getByLabel(spanish.passwordLabel).fill(password);
    await page.getByRole("button", { name: spanish.signIn }).click();
    await page.waitForLoadState("networkidle");
  }

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  if (path !== "/admin") {
    await page.goto(path);
    await page.waitForLoadState("load");
  }
}

function step(page: Page, id: string) {
  return page.locator(`[data-setup-step="${id}"]`);
}

async function state(page: Page, id: string): Promise<string | null> {
  return step(page, id).getAttribute("data-state");
}

async function openStep(page: Page, id: string): Promise<void> {
  await page.goto(`/admin?step=${id}`);
  await expect(step(page, id)).toBeVisible();
}

// The scenario "Not ready" and the scenario "A first visit", in Spanish.
test("la primera visita en español muestra el saludo y los cuatro pasos", async ({ page }) => {
  await speakSpanish(page, true);
  await signIn(page);

  await expect(page.getByRole("heading", { level: 1 })).toContainText(spanish.setupWelcomeTitle);
  await expect(page.getByText(spanish.setupWelcomeBody)).toBeVisible();
  await expect(page.getByText(spanish.setupMinutes)).toBeVisible();
  await expect(page.getByRole("button", { name: spanish.setupStart })).toBeVisible();
  await axe(page);

  await page.getByRole("button", { name: spanish.setupStart }).click();

  await expect(step(page, "ai")).toBeVisible();
  expect(await state(page, "ai")).toBe("todo");
  expect(await state(page, "information")).toBe("todo");
  expect(await state(page, "try")).toBe("todo");
  expect(await state(page, "publish")).toBe("todo");
});

// The scenario "From zero to an answer" in Spanish, timed end to end by the case itself.
test("de cero a una respuesta, en español, cronometrado", async ({ page }) => {
  test.setTimeout(180_000);

  const marks: Array<[string, number]> = [];
  const mark = (name: string): void => {
    marks.push([name, Date.now()]);
  };

  await speakSpanish(page);
  await signIn(page);

  const start = page.getByRole("button", { name: spanish.setupStart });

  if (await start.isVisible()) {
    await start.click();
  }

  const started = Date.now();

  await expect(step(page, "ai")).toBeVisible();

  // Step 1: the key of the provider, tested against the double and saved, in Spanish.
  const answers = page.getByRole("region", { name: spanish.answersSection });

  await answers.getByRole("radio", { name: /OpenRouter/ }).check();
  await answers.getByLabel(spanish.keyLabel).fill(PROVIDER_DOUBLE_KEY);
  await answers.getByRole("button", { name: spanish.testKey }).click();
  await expect(answers.getByRole("status")).toContainText("gpt-4o-mini");
  await answers.getByRole("button", { name: spanish.saveKey }).click();
  await expect(answers.getByText(/••••7788/)).toBeVisible();
  mark("ia conectada");

  const meaning = page.getByRole("region", { name: spanish.meaningSection });

  await meaning.getByRole("button", { name: spanish.keywordChoose }).click();
  await expect(meaning.getByRole("status")).toContainText(spanish.keywordSaved);

  await page.reload();
  expect(await state(page, "ai")).toBe("verified");
  mark("paso 1 verificado");

  // Step 2: the sample business, in one press.
  await openStep(page, "information");
  await page.getByRole("button", { name: spanish.sampleTry }).click();
  await expect(page.getByText(spanish.sampleLoaded.replace("{name}", "Café La Horquilla"))).toBeVisible();
  await page.reload();
  expect(await state(page, "information")).toBe("verified");
  mark("paso 2 verificado");

  // Step 3: a suggested question, the answer with its citation and the passage beside it, marked right.
  await openStep(page, "try");

  const suggestion = page.locator('[data-try="suggestions"] button').first();

  await expect(suggestion).toBeVisible();
  // Decision 7 of `passage-display-polish`: the suggestions of the panel in Spanish come from the documents written in
  // Spanish, so the first one names a heading of `cafe-la-horquilla.md` and never one of the English document.
  await expect(suggestion).toContainText("Café La Horquilla");
  await expect(page.locator('[data-try="suggestions"]')).not.toContainText("Bike workshop");
  await suggestion.click();
  await expect(page.locator('[data-try="turn"]')).toContainText("380 pesos");
  await expect(page.locator('[data-citation-passage="open"]')).toBeVisible();
  // Decision 6: the mark beside the cited passage reads the citation's number.
  await expect(page.locator('[data-citation-passage="open"] [data-brand="citation-mark"]')).toHaveText("1");
  await expect(
    page.locator('[data-try="turn"]').getByRole("button", { name: spanish.citationLabel.replace("{n}", "1") }),
  ).toBeVisible();
  // Decision 9 of the amendment: the heading of the passage is the section label of its section, once, and never above
  // the passage nor at the start of its text. The label is read as the document holds it: the label of the panel is
  // painted in capitals, and the text of the node is not.
  const open = page.locator('[data-citation-passage="open"]');
  const sectionLabel = (await open.locator("xpath=ancestor::ul[1]/preceding-sibling::p[1]").textContent()) ?? "";

  await expect(open.locator('[data-passage="heading"]')).toHaveCount(0);
  await expect(open.locator("xpath=ancestor::div[1]").getByText(sectionLabel, { exact: true })).toHaveCount(1);
  await shoot(page, "guided-try-es", 1440);
  await shoot(page, "guided-try-es", 375);

  await page.getByRole("button", { name: spanish.thisIsRight }).click();
  await expect(page.getByText(spanish.answerRightSaved)).toBeVisible();
  mark("respuesta marcada como correcta");

  await page.reload();
  expect(await state(page, "try")).toBe("verified");
  mark("paso 3 verificado");

  const seconds = (marks.at(-1)?.[1] ?? started) - started;

  console.log(
    `de cero a una respuesta en español: ${(seconds / 1000).toFixed(1)} s ` +
      marks.map(([name, at]) => `${name} ${((at - started) / 1000).toFixed(1)} s`).join(" · "),
  );

  expect(seconds, `de cero a una respuesta tomó ${seconds} ms`).toBeLessThan(secondsLimit * 1000);
});

// Decision 11 of the amendment and task 10.4: la página del documento abre en el pasaje que marcó una cita, con el
// resaltador encima, y ahí se toma la captura en español, a 1440 px y a 375 px.
test("la página del documento resalta el pasaje que abrió una cita", async ({ page }) => {
  await speakSpanish(page);
  await signIn(page, `/admin/information/${sampleDocument}?highlight=2`);

  const open = page.locator('[data-document-passage="open"]');

  await expect(open).toHaveCount(1);
  await expect(open).toContainText("380 pesos");
  await expect(open.locator("ul, ol")).toHaveCount(1);
  await expect(open.locator("ul > li, ol > li")).toHaveCount(5);
  await expect(open.locator('[data-passage="heading"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: "Precios" })).toHaveCount(1);
  await axe(page);

  await shoot(page, "guided-document-es", 1440);
  await shoot(page, "guided-document-es", 375);
});

// Step 4 in Spanish: the flag of Publish over the name the sample set, and the page of a finished owner.
test("el paso de publicar en español cierra la configuración", async ({ page }) => {
  await speakSpanish(page);
  await signIn(page, "/admin/publish");

  await page.getByRole("button", { name: spanish.publish }).click();
  await expect(page.getByText(spanish.published).first()).toBeVisible();
  await axe(page);

  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(spanish.setupDoneTitle);
  await axe(page);
});

// Decision 15 of Amendment 2: la misma caminata que la del caso inglés, en español. Los pasajes de las muestras no
// repiten el final del anterior, así que la suite sube un documento propio (`e2e/fixtures/`) cuya única sección se
// parte en dos pasajes y cuyo segundo pasaje empieza con las palabras que cierran el primero: Prueba y la página del
// documento tienen que pintar esas palabras fuera del resaltador y empezar el resaltador en la primera palabra propia.
test("la guía de un pasaje se lee fuera del resaltador en Prueba y en la página de su documento", async ({ page }) => {
  const fixture = "devoluciones-y-garantia.md";
  const repeated = "El taller revisa la bicicleta antes de devolverla.";
  const own = "La calibración láser de la válvula de vacío";

  await speakSpanish(page);
  await signIn(page, "/admin/information");
  await page.getByLabel(spanish.uploadDocument).setInputFiles([
    {
      name: fixture,
      mimeType: "text/markdown",
      buffer: readFileSync(resolve(process.cwd(), "e2e", "fixtures", fixture)),
    },
  ]);
  await expect(page.locator('[data-upload-state="ready"]')).toHaveCount(1, { timeout: 60_000 });
  await expect(page.getByRole("link", { name: fixture })).toBeVisible();

  // Prueba: el doble responde una pregunta sobre la calibración láser y la cita que marca es el segundo pasaje del
  // documento, que es el único que lleva esas palabras.
  await signIn(page, "/admin/try");
  await page.getByLabel(spanish.question.label).fill("¿La calibración láser de la válvula de vacío?");
  await page.getByRole("button", { name: spanish.question.submit }).click();

  const open = page.locator('[data-citation-passage="open"]');

  await expect(open).toHaveCount(1);
  await expect(open).toContainText(own);

  const lead = open.locator('[data-passage="lead"]');
  const highlight = open.locator(".hl");

  await expect(lead, "la guía del pasaje citado en Prueba").toHaveCount(1);
  await expect(lead).toHaveText(repeated);
  await expect(lead).not.toContainText(own);
  expect(
    (await highlight.innerText()).trimStart().startsWith(own),
    "el resaltador de Prueba empieza en la primera palabra propia",
  ).toBe(true);

  // La página del mismo documento: `?highlight=1` nombra su segundo pasaje y ahí la guía se lee igual.
  await signIn(page, `/admin/information/${fixture}?highlight=1`);

  const opened = page.locator('[data-document-passage="open"]');

  await expect(opened).toHaveCount(1);
  await expect(opened).toContainText(own);
  await expect(opened.locator('[data-passage="lead"]'), "la guía del pasaje abierto de la página").toHaveCount(1);
  await expect(opened.locator('[data-passage="lead"]')).toHaveText(repeated);
  expect(
    (await opened.locator(".hl").innerText()).trimStart().startsWith(own),
    "el resaltador de la página empieza en la primera palabra propia",
  ).toBe(true);
});
