import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import type { Server } from "node:http";
import { resolve } from "node:path";
import { adminStrings } from "../lib/i18n/admin";
import { PUBLIC_STRINGS } from "../lib/i18n/public";
import { buildDocx, buildPdf, buildZip } from "../tests/fixtures/documents";
import { E2E_ADDRESS, E2E_ADMIN_PASSWORD } from "./admin-fixtures";
import {
  PROVIDER_DOUBLE_KEY,
  closeDouble,
  listenOnDoublePort,
  providerDouble,
} from "./provider-double";

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
const sampleDocument = "cafe-la-horquilla.md";
const color = "#0f5132";
const colorRgb = "rgb(15, 81, 50)";
// Decision 22 of the second amendment: the captures of a run land in `test-results/`, which `.gitignore` excludes and
// Playwright empties at the start of every run, and never over an image the documentation tracks. The images under
// `docs/images/admin/` are re-rendered on purpose by their own script, so a green suite leaves its clone clean (the
// Minor m-5 of `revision-community-13b.md`).
const captures = resolve(process.cwd(), "test-results", "captures", "admin");
const secondsLimit = 300;

let double: Server;


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

// The head of a PNG and a payload: the bytes of a picture, whatever a name claims (decision 15).
function pngBytes(): Buffer {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array<number>(24).fill(7)]);
}

test.beforeAll(async () => {
  double = providerDouble();

  await listenOnDoublePort(double);
});

test.afterAll(async () => {
  await closeDouble(double);
});

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "x-forwarded-for": E2E_ADDRESS } });

async function axe(page: Page): Promise<void> {
  // The entrance animations fade their opacity in: axe reads the page at rest, which is the contrast the page offers
  // (the product respects `prefers-reduced-motion`).
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

async function signIn(page: Page, path = "/admin"): Promise<void> {
  await page.goto("/admin");

  if (await page.getByLabel(english.passwordLabel).isVisible()) {
    await page.getByLabel(english.passwordLabel).fill(password);
    await page.getByRole("button", { name: english.signIn }).click();
    // The form reloads the page once the session lands, and the panel is a server-rendered shell: waiting for the
    // network to go quiet keeps that reload from aborting the navigation of the case that follows.
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
  // The walk is measured in seconds by this test itself, so the budget of Playwright is generous: it is not the
  // measure of the round, it is only the ceiling that keeps a stuck page from hanging the suite.
  test.setTimeout(180_000);

  const marks: Array<[string, number]> = [];
  const mark = (name: string): void => {
    marks.push([name, Date.now()]);
  };

  await signIn(page);

  // The lane opens with the start button of the first visit; the case above presses it, and a run of this case alone
  // presses it here, because "from zero" is exactly that: the welcome and then the four steps.
  const start = page.getByRole("button", { name: english.setupStart });

  if (await start.isVisible()) {
    await start.click();
  }

  const started = Date.now();

  // Step 1: the key of the provider, tested against the double and saved. The double answers the Chat Completions API
  // of the OpenAI-compatible entries, which is the one OpenRouter speaks.
  await expect(step(page, "ai")).toBeVisible();

  const answers = page.getByRole("region", { name: english.answersSection });

  await answers.getByRole("radio", { name: /OpenRouter/ }).check();
  await answers.getByLabel(english.keyLabel).fill(PROVIDER_DOUBLE_KEY);
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

  // The suggested questions come from the headings of the documents, and the sample business is three documents: the
  // case presses the first one the panel offers, whatever its heading is, and reads the answer it gets.
  const suggestion = page.locator('[data-try="suggestions"] button').first();

  await expect(suggestion).toBeVisible();
  await suggestion.click();
  await expect(page.locator('[data-try="turn"]')).toContainText("380 pesos");

  // The first citation of the answer opens by itself: the passage of the document the answer came from is in the
  // highlighter on the right, with the name of that document above it.
  const highlighted = page.locator('[data-citation-passage="open"]');

  await expect(highlighted).toBeVisible();
  expect((await highlighted.innerText()).trim().length, "the passage of the citation").toBeGreaterThan(10);
  await expect(page.locator('[data-try="turn"]').getByRole("button", { name: /Citation 1/ })).toBeVisible();
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
  await signIn(page, "/admin/information");

  await page.getByLabel(english.uploadDocument).setInputFiles([
    { name: "escaneo.pdf", mimeType: "application/pdf", buffer: blankPdf() },
    { name: "horario-nuevo.md", mimeType: "text/markdown", buffer: Buffer.from("# Horario\n\nAbrimos de martes a domingo.\n") },
  ]);

  // The first PDF of a cold server takes a while: the parser loads its engine, and this case reads the words of the
  // failure, not the seconds it takes.
  await expect(page.getByText(english.uploadScanTitle)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(english.uploadScanAdvice)).toBeVisible();
  await expect(page.getByText(english.uploadReady.replace("{n}", "1"))).toBeVisible({ timeout: 60_000 });
});

// Task 10.1 of the amendment: the file cases in the browser. Decision 15 says a file is what its bytes say, so a PDF
// and a DOCX are read by their signature even when the name lies, a picture renamed to `.txt` is refused, the size
// limit is read from the file before its bytes, and a name with a parent folder keeps only its base name.
test("a PDF and a DOCX are read by their content, even renamed", async ({ page }) => {
  await signIn(page, "/admin/information");

  await page.getByLabel(english.uploadDocument).setInputFiles([
    {
      name: "aviso-del-taller.pdf",
      mimeType: "application/pdf",
      buffer: buildPdf([["Aviso del taller"], ["El lunes permanecemos cerrados."]]),
    },
    {
      // A real DOCX whose name claims plain text: the signature decides, not the extension.
      name: "guia-del-taller.txt",
      mimeType: "text/plain",
      buffer: buildDocx([
        { text: "Guía del taller", style: "Heading1" },
        { text: "Aceptamos efectivo y tarjeta." },
      ]),
    },
  ]);

  await expect(page.locator('[data-upload-state="ready"]')).toHaveCount(2, { timeout: 60_000 });
  await expect(page.getByRole("link", { name: "aviso-del-taller.pdf" })).toBeVisible();
  await expect(page.getByRole("link", { name: "guia-del-taller.txt" })).toBeVisible();
});

test("a picture renamed to a text extension is refused as a type", async ({ page }) => {
  await signIn(page, "/admin/information");

  await page.getByLabel(english.uploadDocument).setInputFiles([
    { name: "dibujo.png", mimeType: "image/png", buffer: pngBytes() },
    // The Major M-2 of `katalis-dev/tasks/revision-community-13.md`: the extension of a text file never proves that the
    // content is text.
    { name: "dibujo.txt", mimeType: "text/plain", buffer: pngBytes() },
  ]);

  await expect(page.locator('[data-upload-state="failed"]')).toHaveCount(2, { timeout: 60_000 });
  await expect(page.getByText(english.uploadTypeTitle)).toHaveCount(2);
  await expect(page.getByRole("link", { name: "dibujo.txt" })).toHaveCount(0);
});

// Decision 21 of the second amendment: a ZIP is not a DOCX. This archive shares the head `PK\x03\x04` with the
// document of Word and holds no `word/document.xml`, so the owner reads "type not supported" with the list of the
// accepted types and not the generic failure (the Minor m-4 of `katalis-dev/tasks/revision-community-13b.md`).
test("a ZIP renamed to a Word name is refused as a type", async ({ page }) => {
  await signIn(page, "/admin/information");

  await page.getByLabel(english.uploadDocument).setInputFiles([
    {
      name: "paquete.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: buildZip([{ name: "notas.txt", content: "Abrimos de martes a domingo." }]),
    },
  ]);

  await expect(page.getByText(english.uploadTypeTitle)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(english.uploadTypeAdvice)).toBeVisible();
  await expect(page.locator('[data-upload-state="ready"]')).toHaveCount(0);
});

test("a file above the size limit is refused with the limit in words", async ({ page }) => {
  // The 20 MB travel through the browser of the test and through the server, which is the point of the case: the answer
  // is the same for a file the route never reads into memory.
  test.setTimeout(180_000);

  await signIn(page, "/admin/information");

  await page.getByLabel(english.uploadDocument).setInputFiles([
    {
      name: "grande.txt",
      mimeType: "text/plain",
      buffer: Buffer.alloc(20 * 1024 * 1024 + 1, 0x61),
    },
  ]);

  await expect(page.getByText(english.uploadTooLargeTitle)).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText(english.uploadTooLargeAdvice)).toBeVisible();
  await expect(page.locator('[data-upload-state="ready"]')).toHaveCount(0);
});

test("a name with a parent folder is stored by its base name", async ({ page }) => {
  await signIn(page, "/admin/information");

  // The picker of a browser sends the base name of a local path, so the traversal name is built in the page itself:
  // this is the only way the file reaches the server with `../` in its name.
  await page.getByLabel(english.uploadDocument).evaluate((element) => {
    const input = element as HTMLInputElement;
    const transfer = new DataTransfer();

    transfer.items.add(
      new File(["# Notas del taller\n\nAbrimos de martes a domingo.\n"], "../notas-del-taller.txt", {
        type: "text/plain",
      }),
    );
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await expect(page.locator('[data-upload-state="ready"]')).toHaveCount(1, { timeout: 60_000 });
  await expect(page.getByRole("link", { name: "notas-del-taller.txt" })).toBeVisible();
  await expect(page.getByRole("link", { name: "../notas-del-taller.txt" })).toHaveCount(0);
});

// The scenario "A document page": the headings in order with their passages, as the store keeps them.
test("a document page lists its headings in reading order", async ({ page }) => {
  await signIn(page, `/admin/information/${sampleDocument}`);

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
  await signIn(page, "/admin/try");

  await page.getByLabel(english.question.label).fill("hangar zeppelin helicóptero");
  await page.getByRole("button", { name: english.question.submit }).click();

  await expect(page.getByText(english.tryRefusalAdvice)).toBeVisible();
});

// The scenario "A change of color": the preview is the real page and it shows the saved color without reloading the
// panel. The fourth step is verified here as well.
test("the publish step paints the color in the preview and verifies the step", async ({ page }) => {
  await signIn(page, "/admin/publish");

  await page.getByLabel(english.businessColor).fill(color);
  await page.getByRole("button", { name: english.saveBusiness }).click();
  await expect(page.getByText(english.saved)).toBeVisible();

  const preview = page.frameLocator(`iframe[title="${english.previewTitle}"]`);
  const ask = preview.getByRole("button", { name: publicEnglish.question.submit });

  await expect(ask).toBeVisible();
  expect(await ask.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(colorRgb);

  await page.getByRole("button", { name: english.publish }).click();
  // The chip and the confirmation say the same words: the case reads the first one.
  await expect(page.getByText(english.published).first()).toBeVisible();
  await shoot(page, "guided-publish", 1440);
  await shoot(page, "guided-publish", 375);

  // With the four steps verified the lane is gone, which is what decision 2 promises a finished owner: the panel says
  // the assistant is ready and offers the link and Home instead of the setup.
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(english.setupDoneTitle);
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
  // The page names the provider the walk connected and says that the search is by words, which is what it chose.
  await expect(page.getByText("OpenRouter")).toBeVisible();
  await expect(page.getByText(publicEnglish.privacyWords)).toBeVisible();
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
    // With the four steps verified the lane gives way to the page of a finished owner: either title is the panel.
    { path: "/admin?step=ai", title: new RegExp(`${english.setupStepsTitle}|${english.setupDoneTitle}`) },
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
    { path: "/admin?step=ai", title: new RegExp(`${spanish.setupStepsTitle}|${spanish.setupDoneTitle}`) },
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
