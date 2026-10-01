import { expect, test, type Page } from "@playwright/test";

// Requirement "A cited passage reads as its document says it" of the delta `public-chat` (decisions 1 to 5 of
// `openspec/changes/passage-display-polish/design.md`), in a real browser: the heading of a passage once above it, its
// list as a list with one item per line, the words it repeats from the passage before it in the muted colour outside
// the highlighter, and the highlighter from its first own word, at 1440 px and at 375 px, in Spanish and in English.
//
// The cases run in the `public` project against the server of port 3100 (the sample corpus, the deterministic
// providers) and in the `panel` project for the widget of `/embed`; no case calls a real provider. The captures for
// the review of step 7.2 land in `test-results/captures/`, which `.gitignore` excludes.
const captures = "test-results/captures/passage-display";
const answer = '[data-cited="answer"]';

async function shoot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${captures}/${name}.png`, fullPage: true });
}

async function ask(page: Page, text: string): Promise<void> {
  await page.getByLabel("Your question").fill(text);
  await page.getByRole("button", { name: "Ask" }).click();
}

test("the heading of the cited passage is shown once and its list is a list of five items", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await ask(page, "¿Cuánto cuesta la afinación de una bicicleta?");
  await expect(page.locator(answer).first()).toContainText("380 pesos");
  await page.getByRole("button", { name: "Citation 1" }).click();

  const panel = page.locator('[data-cited="citation"]');

  // The heading of the passage is shown once, above it, and never at the start of its text.
  await expect(panel.locator('[data-passage="heading"]')).toHaveText("Precios");
  await expect(panel).not.toContainText("Precios - Espresso");

  const items = panel.locator('[data-passage="item"]');

  await expect(items).toHaveCount(5);
  await expect(items.first()).toHaveText("Espresso: 35 pesos.");
  await expect(items.last()).toHaveText("Cambio de cámara: 120 pesos.");
  await expect(items.first().locator(".hl")).toHaveText("Espresso: 35 pesos.");
  await expect(items.last().locator(".hl")).toHaveText("Cambio de cámara: 120 pesos.");
  await expect(panel).toContainText("cafe-la-horquilla.md");

  await shoot(page, "public-precios-1440-en");

  await page.setViewportSize({ width: 375, height: 812 });
  await shoot(page, "public-precios-375-en");
});

test("the passage of the public page speaks Spanish too", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Español" }).click();
  await page.getByLabel("Tu pregunta").fill("¿Cuánto cuesta la afinación de una bicicleta?");
  await page.getByRole("button", { name: "Preguntar" }).click();
  await expect(page.locator(answer).first()).toContainText("380 pesos");
  await page.getByRole("button", { name: "Cita 1" }).click();

  const panel = page.locator('[data-cited="citation"]');

  await expect(panel.locator('[data-passage="heading"]')).toHaveText("Precios");
  await expect(panel.locator('[data-passage="item"]')).toHaveCount(5);
  await expect(panel).not.toContainText("Precios - Espresso");

  await shoot(page, "public-precios-1440-es");

  await page.setViewportSize({ width: 375, height: 812 });
  await shoot(page, "public-precios-375-es");
});

test("the words a passage repeats are muted and outside the highlighter", async ({ page }) => {
  const lead = "Afinación de bicicleta: ".length;

  await page.route("**/api/ask", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "answered",
        answer: "La afinación de bicicleta cuesta 380 pesos [1].",
        citations: [
          {
            n: 1,
            document: "cafe-la-horquilla.md",
            heading: "Precios",
            position: 3,
            excerpt: "Afinación de bicicleta: 380 pesos.",
            lead,
          },
        ],
      }),
    });
  });

  await page.goto("/");
  await ask(page, "¿Cuánto cuesta la afinación de una bicicleta?");
  await page.getByRole("button", { name: "Citation 1" }).click();

  const panel = page.locator('[data-cited="citation"]');
  const muted = panel.locator('[data-passage="lead"]');

  await expect(muted).toHaveText("Afinación de bicicleta: ");
  await expect(panel.locator(".hl")).toHaveText("380 pesos.");
  // The muted words are outside the highlighter, which is the element that carries the lime band.
  await expect(muted.locator(".hl")).toHaveCount(0);
  await expect(panel.locator(".hl")).not.toContainText("Afinación");
});

test("the highlighter is inline and starts on the first line of its item, at 1440 px and at 375 px", async ({
  page,
}) => {
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
    await page.goto("/");
    await ask(page, "¿Cuánto cuesta la afinación de una bicicleta?");
    await page.getByRole("button", { name: "Citation 1" }).click();

    const measured = await page.evaluate(() => {
      const highlight = document.querySelector('[data-cited="citation"] [data-passage="item"] .hl') as HTMLElement;
      const parent = highlight.parentElement as HTMLElement;
      const band = highlight.getBoundingClientRect();
      const line = parent.getBoundingClientRect();
      const bands = [...document.querySelectorAll('[data-cited="citation"] [data-passage="item"] .hl')].map(
        (item) => Math.round(item.getBoundingClientRect().top),
      );

      return {
        parentTag: parent.tagName,
        display: getComputedStyle(highlight).display,
        break: getComputedStyle(highlight).boxDecorationBreak,
        against: Math.abs(band.top - line.top),
        bands,
      };
    });

    // The highlighter is an inline element of its own list item and never the child of a flex container, so its band
    // starts at the top of the line it belongs to and every line carries its own.
    expect(measured.parentTag, `the parent of the highlighter at ${width} px`).toBe("LI");
    expect(measured.display, `the display of the highlighter at ${width} px`).toBe("inline");
    expect(measured.break, `box-decoration-break at ${width} px`).toBe("clone");
    expect(measured.against, `the band against its line at ${width} px`).toBeLessThan(4);
    expect(measured.bands.length, `one band per item at ${width} px`).toBe(5);
    expect(new Set(measured.bands).size, `a band of its own per item at ${width} px`).toBe(5);
  }
});

test("the widget opens the same passage", async ({ page }) => {
  // The widget is the same chat on `/embed`, which `e2e/widget.spec.ts` embeds on a site of its own; here it is read on
  // its own origin, with the `frame-ancestors` of the page allowing itself.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/embed");
  await ask(page, "¿Cuánto cuesta la afinación de una bicicleta?");
  await expect(page.locator(answer).first()).toContainText("380 pesos");
  await page.getByRole("button", { name: "Citation 1" }).click();

  const panel = page.locator('[data-cited="citation"]');

  await expect(panel.locator('[data-passage="heading"]')).toHaveText("Precios");
  await expect(panel.locator('[data-passage="item"]')).toHaveCount(5);
  await expect(panel).not.toContainText("Precios - Espresso");

  await shoot(page, "widget-precios-375-en");
});
