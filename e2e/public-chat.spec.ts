import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

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

// The scenario "The color reaches the page" of the requirement "The brand color is seen and the widget closes from
// inside". The demo has no business settings yet, so `lib/public/brand.ts` declares the lime of Cited in `--primary`;
// `tests/public-page.test.tsx` pins that a business with `primaryColor: "#1d4ed8"` declares that color instead. Here a
// browser measures that the ask button of both pages paints the color its `main` declares and follows a change of it.
test("the color reaches the page: the ask button is painted with the primary color of the settings", async ({
  page,
}) => {
  for (const path of ["/", "/embed"]) {
    await page.goto(path);

    const painted = await page.evaluate(async () => {
      const main = document.querySelector("main");
      const ask = document.querySelector('form button[type="submit"]');

      if (main === null || ask === null) {
        throw new Error("the page carries no main or no ask button");
      }

      const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);
      const declared = style(main).getPropertyValue("--primary").trim();
      const withTheDemo = style(ask).backgroundColor;
      const textWithTheDemo = style(ask).color;

      // An accepted business color: the fixture the review used, and the one the unit test of the page declares.
      (main as HTMLElement).style.setProperty("--primary", "#1d4ed8");
      (main as HTMLElement).style.setProperty("--on-primary", "#ffffff");

      // The button carries `transition-colors`, so the computed color lands with the curve of the system.
      await new Promise((resolve) => setTimeout(resolve, 700));

      return {
        declared,
        withTheDemo,
        textWithTheDemo,
        withABusiness: style(ask).backgroundColor,
        textWithABusiness: style(ask).color,
      };
    });

    console.log(
      `${path}: --primary is ${painted.declared}, the ask button is ${painted.withTheDemo} with the text ` +
        `${painted.textWithTheDemo}, and with a business color ${painted.withABusiness} with the text ` +
        `${painted.textWithABusiness}`,
    );

    expect(painted.declared.toLowerCase(), `${path}: the primary color the page declares`).toBe(
      "#ddf469",
    );
    expect(painted.withTheDemo, `${path}: the ask button paints the primary color`).toBe(
      "rgb(221, 244, 105)",
    );
    expect(painted.textWithTheDemo, `${path}: the text over that fill`).toBe("rgb(23, 23, 23)");
    expect(painted.withABusiness, `${path}: an accepted business color reaches the button`).toBe(
      "rgb(29, 78, 216)",
    );
    expect(painted.textWithABusiness, `${path}: the text that is legible over it`).toBe(
      "rgb(255, 255, 255)",
    );
  }
});

// The scenario "A tab opened from the page" of the same requirement, and the reproduction of the review: Chromium
// copies the `sessionStorage` of the opener into the tab it opens with `window.open`, so the new tab must not continue
// the conversation of the first one.
test("a tab opened from the page starts its own conversation", async ({ page, context }) => {
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

  const first = await page.evaluate(() => window.sessionStorage.getItem("cited-session"));

  expect(first).not.toBeNull();

  const [opened] = await Promise.all([
    context.waitForEvent("page"),
    page.evaluate(() => {
      window.open("/", "_blank");
    }),
  ]);

  await opened.waitForLoadState();
  watch(opened);
  await ask(opened, "¿Cuánto cuesta la afinación de una bicicleta?");
  await expect(opened.locator(answer)).toHaveCount(1);

  const inherited = await opened.evaluate(() => window.sessionStorage.getItem("cited-session"));
  const fromTheOpened = sent.at(-1) ?? "";

  console.log(
    `the opener tab carries ${first}; the tab it opened carries ${inherited} and asked with ${fromTheOpened}`,
  );

  expect(inherited, "the tab it opened does not keep the id of the opener").not.toBe(first);
  expect(fromTheOpened, "and it does not ask with it either").not.toBe(first);

  await ask(page, "¿Y el cambio de cámara?");
  await expect(page.locator(answer)).toHaveCount(2);

  expect(sent.at(-1), "the first tab keeps its own conversation").toBe(first);

  await opened.close();
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

// The review of step 12: the sticky ask box never hides the control that has the focus (WCAG 2.2, 2.4.11), the new
// entry comes into view above the box, and a passage closed from the keyboard, with Close or with Escape, gives the
// focus back to the mark that opened it. The answer is mocked so that four questions stay deterministic.
test("a four-answer thread at 375 x 812: the focus is never under the ask box and a closed passage returns it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route("**/api/ask", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "answered",
        answer:
          "The tune-up is 380 pesos [1] and it takes one working day. The tube change is 120 pesos [2] and is done " +
          "while you wait, unless the workshop is full on a Saturday.",
        citations: [
          { n: 1, document: "cafe-la-horquilla.md", heading: "Precios", position: 3, excerpt: "Afinación de bicicleta: 380 pesos." },
          { n: 2, document: "bike-workshop-policies.md", heading: null, position: 1, excerpt: "Cambio de cámara: 120 pesos." },
        ],
      }),
    });
  });
  await page.goto("/");

  const form = page.locator('[data-cited="ask"]');

  for (let index = 1; index <= 4; index += 1) {
    await ask(page, `Question ${index}: how much is a tune-up?`);
    await expect(page.locator(answer)).toHaveCount(index);

    const landed = await page.evaluate(() => {
      const turns = document.querySelectorAll('[data-cited="turn"]');
      const last = (turns[turns.length - 1] as HTMLElement).getBoundingClientRect();
      const box = (document.querySelector('[data-cited="ask"]') as HTMLElement).getBoundingClientRect();

      return { top: last.top, formTop: box.top };
    });

    expect(landed.top, `answer ${index} starts on the screen`).toBeGreaterThanOrEqual(0);
    expect(landed.top, `answer ${index} starts above the ask box`).toBeLessThan(landed.formTop);
  }

  await expect(page.locator('[data-cited="announcer"]')).toHaveText("Answer with 2 sources");
  expect(await form.evaluate((element) => getComputedStyle(element).position)).toBe("sticky");

  // Decision 23: once threaded, the label is for the reader of the screen only and the field and the button share one row,
  // so the box takes a small part of the phone instead of a quarter of it.
  const shape = await page.evaluate(() => {
    const box = document.querySelector('[data-cited="ask"]') as HTMLElement;
    const field = box.querySelector("input") as HTMLElement;
    const button = box.querySelector('button[type="submit"]') as HTMLElement;
    const label = box.querySelector("label") as HTMLElement;
    const at = (element: HTMLElement) => element.getBoundingClientRect();

    return {
      boxHeight: at(box).height,
      fieldMiddle: at(field).top + at(field).height / 2,
      buttonMiddle: at(button).top + at(button).height / 2,
      labelWidth: at(label).width,
      labelHeight: at(label).height,
      viewport: window.innerHeight,
    };
  });

  expect(Math.abs(shape.fieldMiddle - shape.buttonMiddle), "the field and the button share one row").toBeLessThan(6);
  expect(Math.max(shape.labelWidth, shape.labelHeight), "the label is for the screen reader only").toBeLessThanOrEqual(1);
  expect(shape.boxHeight, "the box takes under a sixth of a phone").toBeLessThan(shape.viewport / 6);

  // Every control the keyboard reaches outside the box stays clear of it.
  const covered = (): { name: string; overlap: number } | null => {
    const active = document.activeElement as HTMLElement | null;
    const box = document.querySelector('[data-cited="ask"]') as HTMLElement;

    if (active === null || active === document.body || box.contains(active)) {
      return null;
    }

    const rect = active.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    return {
      name: active.getAttribute("aria-label") ?? active.textContent?.trim() ?? active.tagName,
      overlap: Math.max(0, Math.min(rect.bottom, boxRect.bottom) - Math.max(rect.top, boxRect.top)),
    };
  };

  await page.evaluate(() => {
    window.scrollTo(0, 0);
    (document.activeElement as HTMLElement | null)?.blur();
  });

  const hidden: string[] = [];

  for (let step = 0; step < 40; step += 1) {
    await page.keyboard.press("Tab");

    const focus = await page.evaluate(covered);

    if (focus !== null && focus.overlap > 0) {
      hidden.push(`${focus.name}: ${focus.overlap}px under the box`);
    }
  }

  expect(hidden, "no focused control sits under the sticky ask box").toEqual([]);

  // The last passage, opened and closed from the keyboard.
  const mark = page.locator(answer).last().getByRole("button", { name: "Citation 2", exact: true });

  await mark.focus();
  await page.keyboard.press("Enter");

  const citation = page.locator('[data-cited="citation"]');

  await expect(citation).toBeVisible();

  const close = citation.getByRole("button", { name: "Close" });

  for (let step = 0; step < 8 && !(await close.evaluate((element) => element === document.activeElement)); step += 1) {
    await page.keyboard.press("Tab");
  }

  await expect(close, "the keyboard reaches Close").toBeFocused();

  const closeFocus = await page.evaluate(covered);

  expect(closeFocus?.overlap, "Close is not under the ask box").toBe(0);

  await page.keyboard.press("Enter");
  await expect(citation).toHaveCount(0);
  await expect(mark, "Close gives the focus back to the mark").toBeFocused();

  await page.keyboard.press("Enter");
  await expect(citation).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(citation, "Escape closes the passage").toHaveCount(0);
  await expect(mark).toHaveAttribute("aria-expanded", "false");
  await expect(mark, "and gives the focus back to the mark").toBeFocused();
});

// The scenario "A short or zoomed screen" (decision 23 of `design.md`): 512 x 384 and 320 x 256 are 200% and 400% zoom of
// a 1024 x 768 and a 1280 x 1024 screen. Under 560 px of height the ask box stays in the flow, so the last answer is never
// hidden under it, on the page and on the embed. The answers are mocked so that four questions stay deterministic.
for (const size of [
  { width: 512, height: 384 },
  { width: 320, height: 256 },
]) {
  for (const path of ["/", "/embed"]) {
    test(`a four-answer thread at ${size.width} x ${size.height} on ${path}: the last answer sits above a box that does not stick`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.route("**/api/ask", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "answered",
            answer:
              "The tune-up is 380 pesos [1] and it takes one working day. The tube change is 120 pesos [2] and is done " +
              "while you wait.",
            citations: [
              { n: 1, document: "cafe-la-horquilla.md", heading: "Precios", position: 3, excerpt: "Afinación de bicicleta: 380 pesos." },
              { n: 2, document: "bike-workshop-policies.md", heading: "Guarantee", position: 1, excerpt: "Cambio de cámara: 120 pesos." },
            ],
          }),
        });
      });
      await page.goto(path);

      for (let index = 1; index <= 4; index += 1) {
        await ask(page, `Question ${index}: how much is a tune-up?`);
        await expect(page.locator(answer)).toHaveCount(index);
      }

      const form = page.locator('[data-cited="ask"]');

      expect(
        await form.evaluate((element) => getComputedStyle(element).position),
        "under 560 px of height the box does not stick",
      ).not.toBe("sticky");

      // The reader brings the box to the foot of the screen: the last answer has to sit right above it, and be seen.
      await form.evaluate((element) => element.scrollIntoView({ block: "end" }));

      const seen = await page.evaluate(() => {
        const answers = document.querySelectorAll('[data-cited="answer"]');
        const last = answers[answers.length - 1] as HTMLElement;
        const text = (last.querySelector("p") ?? last) as HTMLElement;
        const box = (document.querySelector('[data-cited="ask"]') as HTMLElement).getBoundingClientRect();
        const rect = text.getBoundingClientRect();
        const middle = Math.min(Math.max(rect.top + rect.height / 2, 1), window.innerHeight - 1);
        const onTop = document.elementFromPoint(rect.left + Math.min(rect.width / 2, 30), middle);

        return {
          above: rect.bottom <= box.top + 0.5,
          inView: rect.bottom > 0 && rect.top < window.innerHeight,
          covered: onTop === null || last.contains(onTop) === false,
          boxTop: box.top,
          viewport: window.innerHeight,
        };
      });

      expect(seen.above, "the text of the last answer ends above the question box").toBe(true);
      expect(seen.inView, "and part of it is on the screen").toBe(true);
      expect(seen.covered, "and nothing sits over it").toBe(false);
    });
  }
}

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
