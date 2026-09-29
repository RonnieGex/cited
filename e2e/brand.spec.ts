import AxeBuilder from "@axe-core/playwright";
import { expect, request, test, type Page } from "@playwright/test";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_SECRET } from "./admin-fixtures";

// The scenarios of `openspec/changes/brand-identity-ui/specs/design-system/spec.md` and
// `openspec/changes/brand-identity-ui/specs/public-chat/spec.md` that a browser can prove, with the data hooks and the
// names of decision 17 of `design.md`. The scenarios of the panel live in `e2e/admin-brand.spec.ts`, because the panel
// project of `playwright.config.ts` serves them.
//
// The application is the one served by `npm run start` with the corpus of `samples/` ingested by the deterministic
// providers; no scenario of this file calls a real provider. The public server has no business row and the other specs
// depend on that (the demo lime, the `Cited` heading), so the two scenarios that need a business run against a server
// of their own, started by this file on its own store: see `startBrandedServer`.

const questionLabel = "Your question";
const askButton = "Ask";
const answer = '[data-cited="answer"]';
const lime = "rgb(221, 244, 105)";
const ink = "rgb(23, 23, 23)";
const afinacion = "¿Cuánto cuesta la afinación de una bicicleta?";

const markers = [
  "button-primary",
  "button-secondary",
  "input",
  "chip",
  "panel",
  "section-title",
];

async function ask(page: Page, text: string): Promise<void> {
  await page.getByLabel(questionLabel).fill(text);
  await page.getByRole("button", { name: askButton }).click();
}

async function axe(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  console.log(`${label}: axe ${results.violations.length} violations, ${results.passes.length} rules passed`);

  expect(
    results.violations.map(
      (violation) => `${label} ${violation.id} (${violation.impact}): ${violation.nodes.length} nodes`,
    ),
  ).toEqual([]);
}

/** The animations that end have ended, and the font is in: the measurements below read a page at rest. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

// The sampler of `e2e/design-system.spec.ts` (WCAG 2.2 relative luminance over the ground an element sits on, composited
// in a canvas so that a color with alpha is measured as the reader sees it), extended to what the identity adds: the
// number inside a citation mark is a text like any other, and the words inside the highlighter sit on two grounds (the
// paper above the paint and the lime of the paint), so the ratio that counts is the worse of the two.
type SampledText = {
  tag: string;
  text: string;
  fontSize: number;
  ratio: number;
  required: number;
  inMark: boolean;
  inHighlight: boolean;
  seen: string;
};

async function sampleTexts(page: Page, root: string): Promise<SampledText[]> {
  await settle(page);

  return page.evaluate((rootSelector) => {
    type Pixel = [number, number, number];

    const canvas = document.createElement("canvas");
    const surface = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = 1;
    canvas.height = 1;

    if (surface === null) {
      throw new Error("the page cannot composite the computed colours: no 2d context");
    }

    const read = (): Pixel => {
      const data = surface.getImageData(0, 0, 1, 1).data;

      return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0];
    };

    /** The page ground first (white), then every colour in the order it is painted. */
    const paint = (...colors: string[]): Pixel => {
      surface.clearRect(0, 0, 1, 1);
      surface.fillStyle = "#FFFFFF";
      surface.fillRect(0, 0, 1, 1);

      for (const color of colors) {
        surface.fillStyle = color;
        surface.fillRect(0, 0, 1, 1);
      }

      return read();
    };

    const asColor = (pixel: Pixel): string => `rgb(${pixel.join(", ")})`;
    const over = (color: string, ground: Pixel): Pixel => paint(asColor(ground), color);

    const groundOf = (element: Element, itself: boolean): Pixel => {
      const chain: Element[] = [];

      for (let node: Element | null = itself ? element : element.parentElement; node !== null; node = node.parentElement) {
        chain.unshift(node);
      }

      return paint(...chain.map((node) => getComputedStyle(node).backgroundColor));
    };

    const channel = (octet: number): number => {
      const value = octet / 255;

      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (pixel: Pixel): number =>
      0.2126 * channel(pixel[0]) + 0.7152 * channel(pixel[1]) + 0.0722 * channel(pixel[2]);
    const contrast = (one: Pixel, other: Pixel): number => {
      const first = luminance(one);
      const second = luminance(other);

      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };

    /** The paint of the highlighter: the last colour with some opacity in its computed gradient. */
    const paintOf = (highlight: Element): string => {
      const colors = [...getComputedStyle(highlight).backgroundImage.matchAll(/rgba?\([^)]*\)/g)]
        .map((match) => match[0])
        .filter((color) => /rgba\([^)]*,\s*0\)/.test(color) === false);
      const last = colors.at(-1);

      if (last === undefined) {
        throw new Error("the highlighter paints no colour: its background-image is " + getComputedStyle(highlight).backgroundImage);
      }

      return last;
    };

    const found: SampledText[] = [];
    const add = (element: Element, text: string, color: string, kind: string): void => {
      const style = getComputedStyle(element);
      const highlight = element.closest(".hl");
      const fontSize = Number.parseFloat(style.fontSize);
      const grounds: Pixel[] =
        highlight === null
          ? [groundOf(element, true)]
          : [groundOf(highlight, false), over(paintOf(highlight), groundOf(highlight, false))];
      const ratios = grounds.map((ground) => contrast(over(color, ground), ground));

      found.push({
        tag: kind,
        text: text.replaceAll(/\s+/g, " ").trim().slice(0, 48),
        fontSize,
        ratio: Math.min(...ratios),
        required: fontSize >= 24 ? 3 : 4.5,
        inMark: element.closest('[data-brand="citation-mark"]') !== null,
        inHighlight: highlight !== null,
        seen: `${color} over ${grounds.map(asColor).join(" and ")}`,
      });
    };

    for (const element of document.querySelectorAll(`${rootSelector}, ${rootSelector} *`)) {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      // Visually hidden text (the `h1` under the wordmark, a screen reader label) is not painted, so it has no ground.
      if (element.getClientRects().length === 0 || box.width <= 1 || box.height <= 1 || style.visibility === "hidden") {
        continue;
      }

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        if (element.placeholder.length > 0 && element.value.length === 0) {
          add(element, element.placeholder, getComputedStyle(element, "::placeholder").color, "placeholder");
        }

        continue;
      }

      const own = [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 0,
      );

      if (own) {
        add(element, element.textContent ?? "", style.color, element.tagName.toLowerCase());
      }
    }

    return found;
  }, root);
}

function expectEveryTextToRead(samples: SampledText[], where: string, atLeast = 4): void {
  expect(samples.length, `${where}: the texts the test measured`).toBeGreaterThanOrEqual(atLeast);

  for (const sample of samples) {
    console.log(
      `${where} ${sample.tag} "${sample.text}" at ${sample.fontSize}px: ${sample.seen} = ${sample.ratio.toFixed(2)}:1 ` +
        `(asks ${sample.required}:1)`,
    );

    expect(
      sample.ratio,
      `${where} ${sample.tag} "${sample.text}" at ${sample.fontSize}px: the text over the ground it sits on`,
    ).toBeGreaterThanOrEqual(sample.required);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// The design system: the kit shows the devices, every text reads, motion is removed on request.
// ---------------------------------------------------------------------------------------------------------------------

test("the kit renders the wordmark, the citation mark and the highlighter next to the six markers, and passes axe", async ({
  page,
}) => {
  const response = await page.goto("/kit");

  expect(response?.status()).toBe(200);

  for (const marker of [...markers, "wordmark", "citation-mark", "highlighter"]) {
    await expect(page.locator(`[data-kit="${marker}"]`), marker).toHaveCount(1);
  }

  // The `h1` stays unique: the wordmark is never a heading.
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  const wordmark = page.locator('[data-kit="wordmark"] [data-brand="wordmark"]').first();

  await expect(wordmark, "the wordmark of the kit").toBeVisible();

  // The accessible name is `Cited`: the visible `1` of its mark is hidden from assistive technology.
  const named = await wordmark.evaluate((element) => {
    const copy = element.cloneNode(true) as HTMLElement;

    for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) {
      hidden.remove();
    }

    return element.getAttribute("aria-label") ?? (copy.textContent ?? "").trim();
  });

  expect(named, "the wordmark is named Cited").toBe("Cited");

  const marks = page.locator('[data-kit="citation-mark"] [data-brand="citation-mark"]');

  await expect(marks.first(), "a citation mark in its section").toBeVisible();
  expect(await marks.first().evaluate((element) => getComputedStyle(element).backgroundColor), "lime").toBe(lime);
  expect(await marks.first().evaluate((element) => getComputedStyle(element).color), "with ink text").toBe(ink);

  await settle(page);

  const highlighted = page.locator('[data-kit="highlighter"] .hl').first();

  await expect(highlighted, "a highlighted phrase in its section").toBeVisible();

  const painted = await highlighted.evaluate((element) => {
    const style = getComputedStyle(element);

    return { image: style.backgroundImage, size: style.backgroundSize };
  });

  expect(painted.image, "the highlighter paints lime behind the words").toContain(lime);
  expect(painted.size, "and it is fully painted once the sweep has landed").toBe("100% 100%");

  await axe(page, "/kit");
});

test("every text of /kit reaches 4.5:1, the number inside a citation mark and the words in the highlighter included", async ({
  page,
}) => {
  const response = await page.goto("/kit");

  expect(response?.status()).toBe(200);

  const samples = await sampleTexts(page, "body");

  expect(samples.some((sample) => sample.inMark), "the sampler reached the number of a citation mark").toBe(true);
  expect(samples.some((sample) => sample.inHighlight), "the sampler reached the words of the highlighter").toBe(true);

  expectEveryTextToRead(samples, "/kit");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  for (const path of ["/", "/kit"]) {
    test(`${path}: no element carries an animation and the highlighter is painted at once`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);

      const measured = await page.evaluate(() => {
        const all = [...document.querySelectorAll("*")];
        const animated = all
          .filter((element) => getComputedStyle(element).animationName !== "none")
          .map((element) => `${element.tagName.toLowerCase()}.${String(element.getAttribute("class")).slice(0, 40)}`);
        const highlights = [...document.querySelectorAll(".hl")].map((element) => ({
          text: (element.textContent ?? "").trim().slice(0, 40),
          size: getComputedStyle(element).backgroundSize,
        }));

        return {
          animated,
          running: document
            .getAnimations()
            .filter((animation) => animation.playState === "running")
            .map((animation) => animation.constructor.name),
          highlights,
        };
      });

      console.log(`${path} under reduced motion: ${JSON.stringify(measured)}`);

      expect(measured.animated, `${path}: elements whose animation-name is not none`).toEqual([]);
      expect(measured.running, `${path}: running animations`).toEqual([]);
      expect(measured.highlights.length, `${path}: the page carries the highlighter`).toBeGreaterThan(0);

      for (const highlight of measured.highlights) {
        expect(highlight.size, `${path}: "${highlight.text}" is painted in its final state`).toBe("100% 100%");
      }
    });
  }

  test("an open citation keeps its passage in the highlighter, painted at once, with nothing moving", async ({ page }) => {
    await mockAnswer(page);
    await page.goto("/");
    await ask(page, afinacion);
    await page.getByRole("button", { name: "Citation 1", exact: true }).click();

    const citation = page.locator('[data-cited="citation"]');

    await expect(citation).toBeVisible();
    await expect(citation.locator(".hl")).toContainText("Afinación de bicicleta: 380 pesos.");

    const measured = await page.evaluate(() => ({
      animated: [...document.querySelectorAll("*")]
        .filter((element) => getComputedStyle(element).animationName !== "none")
        .map((element) => element.tagName.toLowerCase()),
      running: document.getAnimations().filter((animation) => animation.playState === "running").length,
      size: getComputedStyle(document.querySelector('[data-cited="citation"] .hl') as Element).backgroundSize,
    }));

    expect(measured.animated, "elements whose animation-name is not none").toEqual([]);
    expect(measured.running, "running animations").toBe(0);
    expect(measured.size, "the passage is painted in its final state").toBe("100% 100%");
  });
});

test("with motion allowed the welcome headline does animate, so the reduced-motion scenario measures something", async ({
  page,
}) => {
  await page.goto("/");

  const animated = await page.evaluate(
    () =>
      [...document.querySelectorAll("*")].filter((element) => getComputedStyle(element).animationName !== "none")
        .length,
  );

  expect(animated, "elements of / that start an animation when motion is allowed").toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------------------------------------------------
// The public page.
// ---------------------------------------------------------------------------------------------------------------------

async function mockAnswer(page: Page): Promise<void> {
  await page.route("**/api/ask", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "answered",
        answer: "The tune-up is 380 pesos [1] and the tube change is 120 pesos [2].",
        citations: [
          {
            n: 1,
            document: "cafe-la-horquilla.md",
            heading: "Precios",
            position: 3,
            excerpt: "Afinación de bicicleta: 380 pesos.",
          },
          {
            n: 2,
            document: "bike-workshop-policies.md",
            heading: "Guarantee",
            position: 1,
            excerpt: "Cambio de cámara: 120 pesos.",
          },
        ],
      }),
    });
  });
}

test("no business yet: the band is ink, shows the wordmark, and the question box is there", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);

  const band = page.locator('[data-public="band"]');

  await expect(band).toBeVisible();
  expect(await band.evaluate((element) => getComputedStyle(element).backgroundColor), "the band is ink").toBe(ink);
  await expect(band.locator('[data-brand="wordmark"]')).toBeVisible();

  // The name of the page is still the `h1`, hidden from the eye because the wordmark is the visible name.
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cited");

  await expect(page.getByLabel(questionLabel)).toBeVisible();
  await expect(page.getByRole("button", { name: askButton })).toBeVisible();

  // The welcome is the headline and its last words are in the highlighter.
  const headline = page.locator("main .hl").first();

  await expect(headline).toBeVisible();
  expect((await headline.textContent())?.trim().length ?? 0, "highlighted words").toBeGreaterThan(0);

  expectEveryTextToRead(await sampleTexts(page, '[data-public="band"]'), "the band without a business");
});

test("four questions on a 375 x 812 viewport keep the ask form in reach, and every answer keeps its markers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const questions = [
    afinacion,
    "¿Cuánto cuesta el cambio de cámara?",
    "How much does a late cancellation cost?",
    "How long do you keep a bicycle after it is ready?",
  ];

  for (const [index, question] of questions.entries()) {
    await ask(page, question);
    await expect(page.locator('[data-cited="turn"]')).toHaveCount(index + 1);
  }

  await expect(page.locator(answer)).not.toHaveCount(0);

  const answered = await page.locator(answer).count();
  const refused = await page.locator('[data-cited="refusal"]').count();

  expect(answered + refused, "every turn is an answer or a refusal").toBe(4);
  expect(await page.locator('[data-cited="sources"]').count(), "every answer keeps its sources").toBe(answered);

  for (let index = 0; index < answered; index += 1) {
    await expect(
      page.locator(answer).nth(index).getByRole("button", { name: /^Citation \d+$/ }).first(),
      `answer ${index + 1} keeps its citation buttons`,
    ).toBeVisible();
  }

  // The thread is longer than the screen, so the test proves something: at the top of the page the box is still on it.
  await page.evaluate(() => window.scrollTo(0, 0));

  const thread = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
  }));

  console.log(`the page is ${thread.height}px tall on a ${thread.viewport}px viewport`);
  expect(thread.height, "the thread is longer than the viewport").toBeGreaterThan(thread.viewport * 1.3);

  const form = page.locator('[data-cited="ask"]');

  await expect(form, "the ask form").toBeInViewport({ ratio: 0.99 });
  await expect(page.getByLabel(questionLabel)).toBeInViewport();
  await expect(page.getByRole("button", { name: askButton })).toBeInViewport();
  expect(await form.evaluate((element) => getComputedStyle(element).position), "the form sticks to the foot").toBe(
    "sticky",
  );
});

test("the marks of an answer: lime buttons named Citation n, the sources beside it, the passage in the highlighter", async ({
  page,
}) => {
  await mockAnswer(page);
  await page.goto("/");
  await ask(page, afinacion);

  await expect(page.locator(answer)).toHaveCount(1);

  const first = page.locator(answer).getByRole("button", { name: "Citation 1", exact: true });
  const second = page.locator(answer).getByRole("button", { name: "Citation 2", exact: true });

  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  await settle(page);

  for (const mark of [first, second]) {
    const painted = await mark.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color,
    }));

    expect(painted.background, "a citation mark is lime").toBe(lime);
    expect(painted.color, "with ink text").toBe(ink);
  }

  const sources = page.locator('[data-cited="sources"]');

  await expect(sources, "one list of sources for the answer").toHaveCount(1);
  await expect(sources).toContainText("cafe-la-horquilla.md");
  await expect(sources).toContainText("bike-workshop-policies.md");

  const listed = [
    sources.getByRole("button", { name: "[1] cafe-la-horquilla.md" }),
    sources.getByRole("button", { name: "[2] bike-workshop-policies.md" }),
  ];

  for (const source of listed) {
    await expect(source, "a source of the list").toBeVisible();
    expect(
      await source.evaluate((element) =>
        [element, ...element.querySelectorAll("*")].some(
          (node) => getComputedStyle(node).backgroundColor === "rgb(221, 244, 105)",
        ),
      ),
      "each source carries a lime mark",
    ).toBe(true);
  }

  await first.click();

  const citation = page.locator('[data-cited="citation"]');

  await expect(citation).toBeVisible();
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(citation).toContainText("cafe-la-horquilla.md");
  await expect(citation).toContainText("Precios");

  // The passage sits in the highlighter, with the paint behind its words.
  const passage = citation.locator(".hl");

  await expect(passage).toContainText("Afinación de bicicleta: 380 pesos.");
  await settle(page);

  const paint = await passage.first().evaluate((element) => ({
    image: getComputedStyle(element).backgroundImage,
    size: getComputedStyle(element).backgroundSize,
  }));

  expect(paint.image, "the passage has the lime paint behind it").toContain(lime);
  expect(paint.size, "fully painted").toBe("100% 100%");

  // An open mark is ink with lime text, so the reader sees which passage is on the page.
  const open = await first.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    color: getComputedStyle(element).color,
  }));

  expect(open.background, "the open mark is ink").toBe(ink);
  expect(open.color, "with lime text").toBe(lime);

  await citation.getByRole("button", { name: "Close" }).click();
  await expect(citation).toHaveCount(0);
});

// ---------------------------------------------------------------------------------------------------------------------
// A business is configured. The public server has no business row and the other specs depend on it, so this group starts a
// server of its own (the same build, `next start`, its own port and its own store, the deterministic providers), signs in
// to its panel through the API and saves a business, exactly as the owner does. Nothing is seeded behind the back of the
// application and nothing of the shared servers changes.
// ---------------------------------------------------------------------------------------------------------------------

const brandedPort = Number(process.env["E2E_BRAND_PORT"] ?? 3241);
const brandedBase = `http://127.0.0.1:${brandedPort}`;
const brandedStore = ".data/e2e-brand.sqlite";
const business = { name: "Taller Rueda Libre", primaryColor: "#1d4ed8" };

let branded: ChildProcess | null = null;

function removeBrandedStore(): void {
  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(resolve(process.cwd(), `${brandedStore}${suffix}`), { force: true });
  }
}

async function startBrandedServer(): Promise<void> {
  removeBrandedStore();

  const server = spawn(
    process.execPath,
    [resolve(process.cwd(), "node_modules/next/dist/bin/next"), "start", "--port", String(brandedPort)],
    {
      cwd: process.cwd(),
      stdio: "ignore",
      env: {
        ...process.env,
        ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
        ADMIN_SESSION_SECRET: E2E_ADMIN_SECRET,
        CHAT_PROVIDER: "fake",
        EMBEDDINGS_PROVIDER: "fake",
        DATABASE_URL: brandedStore,
        TRUST_PROXY: "1",
      },
    },
  );

  branded = server;

  const deadline = Date.now() + 90_000;

  for (;;) {
    try {
      const response = await fetch(brandedBase);

      if (response.ok) {
        break;
      }
    } catch {
      // Not listening yet.
    }

    if (server.exitCode !== null) {
      throw new Error(`the branded server exited with ${server.exitCode}: is the port ${brandedPort} free?`);
    }

    if (Date.now() > deadline) {
      throw new Error(`the branded server did not answer on ${brandedBase} in 90 seconds`);
    }

    await new Promise((wake) => setTimeout(wake, 500));
  }

  const api = await request.newContext({
    baseURL: brandedBase,
    extraHTTPHeaders: { origin: brandedBase, "x-forwarded-for": "198.51.100.77" },
  });

  const login = await api.post("/api/admin/login", { data: { password: E2E_ADMIN_PASSWORD } });

  expect(login.status(), "the panel of the branded server signs the owner in").toBe(200);

  const saved = await api.put("/api/admin/business", {
    data: {
      name: business.name,
      primaryColor: business.primaryColor,
      tone: "friendly and brief",
      language: "en",
      forbiddenTopics: [],
      welcome: {
        en: "Welcome. Ask anything about our workshop and see where each answer comes from.",
        es: "Bienvenido. Pregunta lo que quieras de nuestro taller y mira de dónde sale cada respuesta.",
      },
    },
  });

  expect(saved.status(), "the business is saved through the API of the panel").toBe(200);
  await api.dispose();
}

function stopBrandedServer(): void {
  if (branded !== null && branded.pid !== undefined && branded.exitCode === null) {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(branded.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      branded.kill("SIGKILL");
    }
  }

  branded = null;
  removeBrandedStore();
}

test.describe("a business is configured", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    test.setTimeout(150_000);
    await startBrandedServer();
  });

  test.afterAll(() => {
    stopBrandedServer();
  });

  test("the band wears the color of the business, its name is the only h1 and the switch reads at 4.5:1", async ({
    page,
  }) => {
    const response = await page.goto(brandedBase);

    expect(response?.status()).toBe(200);

    const band = page.locator('[data-public="band"]');

    await expect(band).toBeVisible();
    expect(
      await band.evaluate((element) => getComputedStyle(element).backgroundColor),
      "the computed background of the band is the primary color of the business",
    ).toBe("rgb(29, 78, 216)");

    // A band spans the page, it is not a box in a column.
    const box = await band.boundingBox();
    const viewport = page.viewportSize();

    expect(box?.width ?? 0, "the band spans the width of the page").toBeGreaterThanOrEqual((viewport?.width ?? 0) - 1);
    expect(box?.y ?? -1, "the band opens the page").toBeLessThanOrEqual(1);

    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(business.name);
    await expect(band.getByRole("heading", { level: 1 })).toHaveText(business.name);

    const switchGroup = band.getByRole("group", { name: "Language" });

    await expect(switchGroup, "the language switch lives inside the band").toBeVisible();
    await expect(switchGroup.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");

    const switchTexts = await sampleTexts(page, '[data-public="band"] [role="group"]');

    expect(switchTexts.length, "the two languages of the switch").toBeGreaterThanOrEqual(2);
    // The switch is two buttons and its label, so its floor is the two languages and not the four of a page.
    expectEveryTextToRead(switchTexts, "the switch over the band of the business", 2);
    expectEveryTextToRead(await sampleTexts(page, '[data-public="band"]'), "the band of the business");

    // The welcome is the headline with its last words highlighted, under the band, on paper.
    await expect(page.locator("main .hl").first()).toBeVisible();

    await axe(page, "the branded public page");
  });

  test("the band follows the language of the visitor and the ask form still answers", async ({ page }) => {
    await page.goto(brandedBase);
    await page.getByRole("button", { name: "Español" }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(business.name);
    await expect(page.getByLabel("Tu pregunta")).toBeVisible();
    expect(
      await page.locator('[data-public="band"]').evaluate((element) => getComputedStyle(element).backgroundColor),
      "the color of the business does not depend on the language",
    ).toBe("rgb(29, 78, 216)");
  });
});
