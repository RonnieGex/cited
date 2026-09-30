import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { resolve } from "node:path";
import { adminStrings } from "../lib/i18n/admin";
import { PUBLIC_STRINGS } from "../lib/i18n/public";
import { E2E_ADDRESS, E2E_ADMIN_PASSWORD } from "./admin-fixtures";

// The browser suite of `openspec/changes/guided-setup-and-knowledge/tasks.md`, tasks 2.2 and 7.1: every scenario of
// `specs/owner-setup/spec.md`, the walk "from zero to an answer" timed end to end, an axe check of every page of the
// round in both languages, and the captures the guide and the README carry.
//
// The server of this suite (project `setup`, port 3217) starts with an empty store and with no provider of any kind, so
// the walk is real: the owner connects the AI in the panel, chooses how to search, loads the sample business, asks a
// suggested question, marks the answer right and publishes. The chat provider is the local double this spec serves on
// port 3216, which the environment of that server points the OpenAI entry of the catalogue at: there is a real HTTP
// round trip and no test reaches a real provider.
//
// The cases run in order: the first one needs the store empty and the later ones need what the ones before it built.

const english = adminStrings("en");
const spanish = adminStrings("es");
const publicEnglish = PUBLIC_STRINGS.en;
const publicSpanish = PUBLIC_STRINGS.es;
const password = E2E_ADMIN_PASSWORD;
const goodKey = "sk-buena-0000000000007788";
const doublePort = 3216;
const sampleDocument = "cafe-la-horquilla.md";
const color = "#0f5132";
const colorRgb = "rgb(15, 81, 50)";
const captures = resolve(process.cwd(), "docs", "images", "admin");
const secondsLimit = 300;

let double: Server;

// The answer of the double carries a citation mark, which is what `extractCitations()` reads: the panel shows the
// answer with its numbered citation and the passage of the sample business beside it.
function providerDouble(): Server {
  return createServer((request, response) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const authorization = request.headers.authorization ?? "";
      const body = Buffer.concat(chunks).toString("utf8");

      response.setHeader("content-type", "application/json");

      if (authorization !== `Bearer ${goodKey}`) {
        response.writeHead(401);
        response.end(
          JSON.stringify({
            error: { message: "Incorrect API key provided", type: "invalid_request_error", code: "invalid_api_key" },
          }),
        );

        return;
      }

      // The system prompt of the answer asks for the citation marks; the double answers a question about the prices of
      // the sample business with the first passage it was handed.
      const cited = body.includes("embedding") ? "ok" : "La afinación de bicicleta cuesta 380 pesos [1].";

      response.writeHead(200);
      response.end(
        JSON.stringify({
          object: "list",
          data: [{ object: "embedding", index: 0, embedding: Array.from({ length: 8 }, () => 0.1) }],
          id: "chatcmpl-doble",
          created: 1_700_000_000,
          model: "gpt-4o-mini",
          choices: [{ index: 0, message: { role: "assistant", content: cited }, finish_reason: "stop" }],
        }),
      );
    });
  });
}

// A PDF with one page and no text layer at all: the header `%PDF-`, a catalogue, one page, an empty content stream and
// a font nobody uses. `pdf-parse` reads it and finds no text, which is the scan of the scenario "A scanned PDF".
function blankPdf(): Buffer {
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    "4 0 obj\n<< /Length 1 >>\nstream\n\nendstream\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];
  let document = "%PDF-1.4\n";
  const offsets: number[] = [];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(document, "latin1"));
    document += object;
  }

  const started = Buffer.byteLength(document, "latin1");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  document += `${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${started}\n%%EOF\n`;

  return Buffer.from(document, "latin1");
}

test.beforeAll(async () => {
  double = providerDouble();

  await new Promise<void>((resolve_) => {
    double.listen(doublePort, "127.0.0.1", resolve_);
  });
});

test.afterAll(async () => {
  await new Promise<void>((resolve_) => {
    double.closeAllConnections();
    double.close(() => {
      resolve_();
    });
  });
});

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

  if (await page.getByLabel(english.passwordLabel).isVisible()) {
    await page.getByLabel(english.passwordLabel).fill(password);
    await page.getByRole("button", { name: english.signIn }).click();
  }

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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

async function shoot(page: Page, name: string, width: number): Promise<void> {
  await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
  await page.screenshot({ path: resolve(captures, `${name}-${width}.png`), fullPage: true });
}

// The scenario "A first visit" and the scenario "Not ready", with the capture of the page that is not ready yet.
test("a first visit shows one sentence of value, four steps and a start button", async ({ page }) => {
  mkdirSync(captures, { recursive: true });

  const response = await page.goto("/");

  // The store of this suite is empty: the public page has no AI connected yet, says so and offers the owner the way in.
  expect(response?.status()).toBe(200);
  await expect(page.getByText(publicEnglish.notReadyTitle)).toBeVisible();
  await expect(page.getByRole("link", { name: publicEnglish.notReadyPanel })).toHaveAttribute("href", "/admin");
  expect(await page.getByLabel(publicEnglish.question.label).count()).toBe(0);
  await shoot(page, "public-not-ready", 1440);
  await shoot(page, "public-not-ready", 375);

  await signIn(page);

  await expect(page.getByRole("heading", { level: 1 })).toContainText(english.setupWelcomeTitle);
  await expect(page.getByText(english.setupWelcomeBody)).toBeVisible();
  await expect(page.getByText(english.setupMinutes)).toBeVisible();
  await expect(page.getByRole("button", { name: english.setupStart })).toBeVisible();
  await axe(page);
  await shoot(page, "guided-welcome", 1440);
  await shoot(page, "guided-welcome", 375);

  await page.getByRole("button", { name: english.setupStart }).click();

  await expect(step(page, "ai")).toBeVisible();
  await expect(step(page, "ai").getByRole("button", { expanded: true })).toBeVisible();
  expect(await state(page, "ai")).toBe("todo");
  expect(await state(page, "information")).toBe("todo");
  expect(await state(page, "try")).toBe("todo");
  expect(await state(page, "publish")).toBe("todo");
  await axe(page);
  await shoot(page, "guided-step-1", 1440);
  await shoot(page, "guided-step-1", 375);
});

// The scenario "From zero to an answer": the four steps in front of the browser, timed end to end.
test("from zero to an answer, timed", async ({ page }) => {
  const marks: Array<[string, number]> = [];
  const mark = (name: string): void => {
    marks.push([name, Date.now()]);
  };

  await signIn(page);
  const started = Date.now();

  // Step 1: the key of the provider, tested against the double and saved.
  await expect(step(page, "ai")).toBeVisible();

  const answers = page.getByRole("region", { name: english.answersSection });

  await answers.getByRole("radio", { name: /OpenAI/ }).check();
  await answers.getByLabel(english.keyLabel).fill(goodKey);
  await answers.getByRole("button", { name: english.testKey }).click();
  await expect(answers.getByRole("status")).toContainText("gpt-4o-mini");
  await answers.getByRole("button", { name: english.saveKey }).click();
  await expect(answers.getByText(/••••7788/)).toBeVisible();
  mark("ai connected");

  // The search: by words, with no second key, which is the other door the step offers.
  const meaning = page.getByRole("region", { name: english.meaningSection });

  await meaning.getByRole("button", { name: english.keywordChoose }).click();
  await expect(meaning.getByRole("status")).toContainText(english.keywordSaved);

  await page.reload();
  expect(await state(page, "ai")).toBe("verified");
  mark("step 1 verified");

  // Step 2: the sample business, in one press.
  await openStep(page, "information");
  await page.getByRole("button", { name: english.sampleTry }).click();
  await expect(page.getByText(english.sampleLoaded.replace("{name}", "Café La Horquilla"))).toBeVisible();
  await page.reload();
  expect(await state(page, "information")).toBe("verified");
  mark("step 2 verified");

  // Step 3: a suggested question, the answer with its citation, the passage beside it, and the answer marked right.
  await openStep(page, "try");
  await page.getByRole("button", { name: /Precios/ }).first().click();
  await expect(page.locator('[data-try="turn"]')).toContainText("380 pesos");
  await expect(page.locator('[data-citation-passage="open"]')).toContainText("380 pesos");
  await axe(page);
  await shoot(page, "guided-try", 1440);
  await shoot(page, "guided-try", 375);

  await page.getByRole("button", { name: english.thisIsRight }).click();
  await expect(page.getByText(english.answerRightSaved)).toBeVisible();
  mark("answer marked right");

  await page.reload();
  expect(await state(page, "try")).toBe("verified");
  mark("step 3 verified");

  const seconds = (marks.at(-1)?.[1] ?? started) - started;

  console.log(
    `from zero to an answer: ${(seconds / 1000).toFixed(1)} s ` +
      marks.map(([name, at]) => `${name} ${((at - started) / 1000).toFixed(1)} s`).join(" · "),
  );

  expect(seconds, `from zero to an answer took ${seconds} ms`).toBeLessThan(secondsLimit * 1000);
});

// The scenario "A scanned PDF": one file fails alone and the files after it are read.
test("a scanned PDF is said in words while the other file is read", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/information");

  await page.getByLabel(english.uploadDocument).setInputFiles([
    { name: "escaneo.pdf", mimeType: "application/pdf", buffer: blankPdf() },
    { name: "horario-nuevo.md", mimeType: "text/markdown", buffer: Buffer.from("# Horario\n\nAbrimos de martes a domingo.\n") },
  ]);

  await expect(page.getByText(english.uploadScanTitle)).toBeVisible();
  await expect(page.getByText(english.uploadScanAdvice)).toBeVisible();
  await expect(page.getByText(english.uploadReady.replace("{n}", "1"))).toBeVisible();
});

// The scenario "A document page": the headings in order with their passages, as the store keeps them.
test("a document page lists its headings in reading order", async ({ page }) => {
  await signIn(page);
  await page.goto(`/admin/information/${sampleDocument}`);

  const headings = await page.getByRole("heading", { level: 2 }).allTextContents();

  expect(headings).toContain("Horario");
  expect(headings).toContain("Precios");
  expect(headings.indexOf("Horario")).toBeLessThan(headings.indexOf("Precios"));
  await expect(page.getByText("Afinación de bicicleta: 380 pesos.")).toBeVisible();
  await axe(page);
  await shoot(page, "guided-document", 1440);
  await shoot(page, "guided-document", 375);
});

// The scenario "A refusal while trying".
test("a refusal says the documents do not say it and suggests adding one", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/try");

  await page.getByLabel(english.question.label).fill("hangar zeppelin helicóptero");
  await page.getByRole("button", { name: english.question.submit }).click();

  await expect(page.getByText(english.tryRefusalAdvice)).toBeVisible();
});

// The scenario "A change of color": the preview is the real page and it shows the saved color without reloading the
// panel. The fourth step is verified here as well.
test("the publish step paints the color in the preview and verifies the step", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/publish");

  await page.getByLabel(english.businessColor).fill(color);
  await page.getByRole("button", { name: english.saveBusiness }).click();
  await expect(page.getByText(english.saved)).toBeVisible();

  const preview = page.frameLocator(`iframe[title="${english.previewTitle}"]`);
  const ask = preview.getByRole("button", { name: publicEnglish.question.submit });

  await expect(ask).toBeVisible();
  expect(await ask.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(colorRgb);

  await page.getByRole("button", { name: english.publish }).click();
  await expect(page.getByText(english.published)).toBeVisible();
  await shoot(page, "guided-publish", 1440);
  await shoot(page, "guided-publish", 375);

  await page.goto("/admin?step=publish");
  expect(await state(page, "publish")).toBe("verified");
});

// The scenario "The disclosure", in both languages, on the page and on the frame of the widget.
test("the public page and the widget are honest about AI and link the privacy page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(publicEnglish.discloseAi)).toBeVisible();
  await expect(page.getByRole("link", { name: publicEnglish.privacyLink })).toHaveAttribute("href", "/privacy");
  await expect(page.getByLabel(publicEnglish.question.label)).toBeVisible();
  await shoot(page, "public-ready", 1440);
  await shoot(page, "public-ready", 375);

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(publicEnglish.privacyTitle);
  await expect(page.getByText("OpenAI")).toBeVisible();
  await axe(page);

  await page.goto("/embed");
  await expect(page.getByText(publicEnglish.discloseAi)).toBeVisible();
  await expect(page.getByRole("link", { name: publicEnglish.privacyLink })).toBeVisible();

  // Spanish, on the page and on the privacy page.
  await page.goto("/");
  await page.getByRole("button", { name: "Español" }).click();
  await expect(page.getByText(publicSpanish.discloseAi)).toBeVisible();
  await expect(page.getByRole("link", { name: publicSpanish.privacyLink })).toBeVisible();

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(publicSpanish.privacyTitle);
  await axe(page);
});

// Every page of the round, in both languages.
test("every page of the round passes axe in English and in Spanish", async ({ page }) => {
  const pages = [
    { path: "/admin?step=ai", title: english.setupStepsTitle },
    { path: "/admin/home", title: english.homeTitle },
    { path: "/admin/information", title: english.navInformation },
    { path: `/admin/information/${sampleDocument}`, title: english.documentName },
    { path: "/admin/try", title: english.navTry },
    { path: "/admin/publish", title: english.navPublish },
    { path: "/privacy", title: publicEnglish.privacyTitle },
  ];

  await signIn(page);

  for (const one of pages) {
    await page.goto(one.path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(one.title);
    await axe(page);
  }

  // The panel in Spanish, page by page.
  const labels = [
    { path: "/admin?step=ai", title: spanish.setupStepsTitle },
    { path: "/admin/home", title: spanish.homeTitle },
    { path: "/admin/information", title: spanish.navInformation },
    { path: "/admin/try", title: spanish.navTry },
    { path: "/admin/publish", title: spanish.navPublish },
    { path: "/privacy", title: publicSpanish.privacyTitle },
  ];

  await page.goto("/admin?step=ai");
  await page.getByTestId("language-switch").getByRole("button", { name: "Español" }).click();
  await page.waitForLoadState("load");

  for (const one of labels) {
    await page.goto(one.path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(one.title);
    await axe(page);
  }
});
