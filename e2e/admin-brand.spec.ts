import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { adminStrings, formatWhen } from "../lib/i18n/admin";
import { E2E_ADMIN_PASSWORD, E2E_BASE_URL } from "./admin-fixtures";

// The scenarios of `openspec/changes/brand-identity-ui/specs/admin-panel/spec.md`: the navigation at 1440 and at 375 px
// and the sign-in in Spanish, with the data hooks of decision 17 of `design.md` (`data-admin="sidebar"`, the
// `aria-current` of the current link, one language switch and one sign-out in the DOM at any width).
//
// The panel project of `playwright.config.ts` serves this file, against the server with its own store and the password
// of `e2e/admin-fixtures.ts`. The spec signs in through the API of the panel, as the form does, so that each scenario
// measures the page and not the login; it uses an address of its own, so that the lockout counters of `admin.spec.ts`
// are never touched. The sign-in scenario is the one that needs no session.

const english = adminStrings("en");
const spanish = adminStrings("es");
const ink = "rgb(23, 23, 23)";
const lime = "rgb(221, 244, 105)";
// 212 to 231: away from the 11 to 210 of `E2E_ADDRESS` and from the 198.51.100.240 of the lockout scenario.
const address = `198.51.100.${212 + Math.floor(Math.random() * 20)}`;
const sidebar = '[data-admin="sidebar"]';

test.use({ extraHTTPHeaders: { "x-forwarded-for": address } });

async function signInThroughTheApi(page: Page): Promise<void> {
  const response = await page.request.post("/api/admin/login", {
    data: { password: E2E_ADMIN_PASSWORD },
    headers: { origin: E2E_BASE_URL },
  });

  expect(response.status(), "the API of the panel signs the owner in").toBe(200);
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

// The sampler of `e2e/design-system.spec.ts`, over the ground each text sits on (a color with alpha is composited in a
// canvas, so `text-paper/60` is measured as the reader sees it over the ink). WCAG 2.2 relative luminance.
type SampledText = { tag: string; text: string; fontSize: number; ratio: number; seen: string };

async function sampleTexts(page: Page, root: string): Promise<SampledText[]> {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );

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
    const groundOf = (element: Element): Pixel => {
      const chain: Element[] = [];

      for (let node: Element | null = element; node !== null; node = node.parentElement) {
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

    const found: SampledText[] = [];

    for (const element of document.querySelectorAll(`${rootSelector}, ${rootSelector} *`)) {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      if (element.getClientRects().length === 0 || box.width <= 1 || box.height <= 1 || style.visibility === "hidden") {
        continue;
      }

      const own = [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 0,
      );

      if (own === false) {
        continue;
      }

      const ground = groundOf(element);

      found.push({
        tag: element.tagName.toLowerCase(),
        text: (element.textContent ?? "").replaceAll(/\s+/g, " ").trim().slice(0, 48),
        fontSize: Number.parseFloat(style.fontSize),
        ratio: contrast(over(style.color, ground), ground),
        seen: `${style.color} over ${asColor(ground)}`,
      });
    }

    return found;
  }, root);
}

function links(page: Page) {
  return page.locator(`${sidebar} nav a`);
}

// The keyboard, from a fresh load: the first Tab lands on the wordmark (nothing moved the starting point of the focus), and
// each next Tab lands on the next section, which the bar brings whole into the screen by itself; nothing here scrolls it.
async function tabThroughTheBar(page: Page, label: string, minimumHeight: number): Promise<void> {
  const wordmark = page.locator(`${sidebar} [data-brand="wordmark"]`);

  await page.keyboard.press("Tab");
  await expect(wordmark, `${label}: the first Tab focuses the wordmark`).toBeFocused();

  const mark = await wordmark.boundingBox();

  console.log(`${label}: the wordmark target ${JSON.stringify(mark)}`);
  expect(mark?.height ?? 0, `${label}: the wordmark is a target of ${minimumHeight} px`).toBeGreaterThanOrEqual(minimumHeight);

  for (let index = 0; index < 4; index += 1) {
    const link = links(page).nth(index);

    await page.keyboard.press("Tab");
    await expect(link, `${label}: Tab ${index + 2} focuses link ${index + 1}`).toBeFocused();
    await expect(link, `${label}: link ${index + 1} is whole on the screen when it has the focus`).toBeInViewport({
      ratio: 1,
    });

    const target = await link.boundingBox();

    console.log(`${label}: link ${index + 1} focused at ${JSON.stringify(target)}`);
    expect(target?.height ?? 0, `${label}: link ${index + 1} is a target of ${minimumHeight} px`).toBeGreaterThanOrEqual(
      minimumHeight,
    );
  }
}

test("the navigation at 1440 px: an ink column with the numbered sections, the current one marked, every text at 4.5:1", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInThroughTheApi(page);

  const response = await page.goto("/admin/information");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  const column = page.locator(sidebar);

  await expect(column, "the navigation").toBeVisible();
  expect(
    await column.evaluate((element) => getComputedStyle(element).backgroundColor),
    "the navigation sits in an ink column",
  ).toBe(ink);

  const box = await column.boundingBox();

  console.log(`the navigation column: ${JSON.stringify(box)}`);
  expect(box?.x ?? -1, "on the left").toBeLessThanOrEqual(1);
  expect(box?.width ?? 0, "240 px wide").toBeGreaterThanOrEqual(238);
  expect(box?.width ?? 0, "240 px wide").toBeLessThanOrEqual(242);
  expect(box?.height ?? 0, "as tall as the screen").toBeGreaterThanOrEqual(899);

  const content = await page.locator("main").boundingBox();

  expect(content?.x ?? 0, "the content is beside the column, not under it").toBeGreaterThanOrEqual(
    (box?.x ?? 0) + (box?.width ?? 0) - 1,
  );

  // The seven sections of decision 11 of `guided-setup-and-knowledge`, numbered like citations, in order.
  const numbered = [
    { number: "1", name: english.navHome, href: "/admin/home" },
    { number: "2", name: english.navInformation, href: "/admin/information" },
    { number: "3", name: english.navTry, href: "/admin/try" },
    { number: "4", name: english.navConversations, href: "/admin/conversations" },
    { number: "5", name: english.navPublish, href: "/admin/publish" },
    { number: "6", name: english.navAi, href: "/admin/ai" },
    { number: "7", name: english.navSettings, href: "/admin/settings" },
  ];

  await expect(links(page)).toHaveCount(numbered.length);

  for (const [index, section] of numbered.entries()) {
    const link = links(page).nth(index);

    await expect(link).toHaveAttribute("href", section.href);
    await expect(link, `${section.name} reads as "${section.number} ${section.name}"`).toHaveText(
      new RegExp(`^\\s*${section.number}\\s*${section.name}\\s*$`),
    );

    if (section.href === "/admin/information") {
      await expect(link).toHaveAttribute("aria-current", "page");
    } else {
      await expect(link, `${section.name} is not the current page`).not.toHaveAttribute("aria-current", /.*/);
    }
  }

  await expect(page.locator(`${sidebar} [aria-current="page"]`), "exactly one current link").toHaveCount(1);
  await expect(page.getByRole("link", { name: /Information/ }).and(page.locator('[aria-current="page"]'))).toBeVisible();

  // The mark of the current place is the inverted one: its number is lime.
  const current = await links(page)
    .nth(1)
    .evaluate((link) => {
      const leaf = [...link.querySelectorAll("*")].find((node) => (node.textContent ?? "").trim() === "2");

      return leaf === undefined ? null : getComputedStyle(leaf).color;
    });

  expect(current, "the number of the current mark").toBe(lime);

  // One switch and one sign-out in the DOM, at this width and at any other.
  await expect(page.getByTestId("language-switch")).toHaveCount(1);
  await expect(page.locator("button", { hasText: english.signOut })).toHaveCount(1);
  await expect(column.getByTestId("language-switch"), "the switch is at the foot of the column").toBeVisible();
  await expect(column.locator("button", { hasText: english.signOut })).toBeVisible();

  // Built by Katalis, with the real flame, at the foot.
  await expect(column.locator("img[src*='katalis-flame']")).toHaveCount(1);
  await expect(column.getByText("Built by Katalis")).toBeVisible();

  const texts = await sampleTexts(page, sidebar);

  expect(texts.length, "the texts of the column the test measured").toBeGreaterThan(8);

  for (const text of texts) {
    console.log(
      `${text.tag} "${text.text}" at ${text.fontSize}px: ${text.seen} = ${text.ratio.toFixed(2)}:1 (asks 4.5:1)`,
    );

    expect(text.ratio, `${text.tag} "${text.text}": the text over the ink of the column`).toBeGreaterThanOrEqual(4.5);
  }

  await axe(page, "/admin/information at 1440");
});

test("the navigation at 375 px: a top bar that scrolls sideways, with no horizontal scroll on the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signInThroughTheApi(page);

  const response = await page.goto("/admin/information");

  expect(response?.status()).toBe(200);

  const bar = page.locator(sidebar);

  await expect(bar, "the navigation").toBeVisible();

  const box = await bar.boundingBox();

  console.log(`the navigation bar: ${JSON.stringify(box)}`);
  expect(box?.y ?? -1, "at the top").toBeLessThanOrEqual(1);
  expect(box?.x ?? -1, "from the left edge").toBeLessThanOrEqual(1);
  expect(box?.width ?? 0, "across the whole screen").toBeGreaterThanOrEqual(374);
  expect(box?.height ?? 0, "a bar, not a column").toBeLessThan(320);
  expect(await bar.evaluate((element) => getComputedStyle(element).backgroundColor), "ink").toBe(ink);

  const content = await page.locator("main").boundingBox();

  expect(content?.y ?? 0, "the content starts under the bar").toBeGreaterThanOrEqual(
    (box?.y ?? 0) + (box?.height ?? 0) - 1,
  );

  // The list of sections scrolls sideways: its container clips the overflow on the x axis and it is not the page.
  const scroller = await links(page)
    .first()
    .evaluate((link, selector) => {
      for (let node = link.parentElement; node !== null; node = node.parentElement) {
        const overflow = getComputedStyle(node).overflowX;

        if (overflow === "auto" || overflow === "scroll") {
          return { found: true, inside: node.closest(selector) !== null, tag: node.tagName.toLowerCase() };
        }
      }

      return { found: false, inside: false, tag: "" };
    }, sidebar);

  expect(scroller.found, "an ancestor of the links scrolls on the x axis").toBe(true);
  expect(scroller.inside, "and it belongs to the bar").toBe(true);

  await expect(links(page)).toHaveCount(7);

  await tabThroughTheBar(page, "375", 43.5);

  await expect(links(page).nth(1)).toHaveAttribute("aria-current", "page");

  const page_ = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    viewport: window.innerWidth,
  }));

  console.log(`horizontal size of the page: ${JSON.stringify(page_)}`);
  expect(page_.document, "the page does not scroll sideways").toBeLessThanOrEqual(page_.viewport);
  expect(page_.body, "the body does not scroll sideways").toBeLessThanOrEqual(page_.viewport);

  // One switch and one sign-out in the DOM here too, and the sign-out is a target a thumb can hit.
  await expect(page.getByTestId("language-switch")).toHaveCount(1);
  await expect(page.locator("button", { hasText: english.signOut })).toHaveCount(1);

  const signOut = await page.locator("button", { hasText: english.signOut }).boundingBox();

  expect(signOut?.height ?? 0, "sign out: 44 px of height on a phone").toBeGreaterThanOrEqual(43.5);

  await axe(page, "/admin/information at 375");
});

test("the keyboard starts at the wordmark at 1440 px and walks the bar whole at 320 px, in Spanish", async ({
  page,
  context,
}) => {
  await context.addCookies([{ name: "cited-lang", value: "es", url: E2E_BASE_URL }]);
  await signInThroughTheApi(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  expect((await page.goto("/admin/information"))?.status()).toBe(200);
  await tabThroughTheBar(page, "1440", 24);

  await page.setViewportSize({ width: 320, height: 812 });
  expect((await page.goto("/admin/information"))?.status()).toBe(200);
  await tabThroughTheBar(page, "320", 43.5);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    "the page does not scroll sideways at 320 px",
  ).toBe(true);
});

// Finding of the review of step 12: on a phone the actions of a document were cut at the edge of the box and broke at the
// hyphen. The spec uploads a document of its own with a long name, so it never touches the one of `admin.spec.ts`.
// Finding of the review of step 12, kept for the page the change of decision 5 of `guided-setup-and-knowledge` built:
// the controls of a document are whole, on one line, inside the box and inside the screen at 375 and 320 px, and the
// removal asks in place with a real undo of a few seconds. The spec uploads a document of its own with a long name, so
// it never touches the one of `admin.spec.ts`.
test("the document page at 375 and 320 px keeps every control whole, on one line, inside the box and the screen", async ({
  page,
  context,
}) => {
  await context.addCookies([{ name: "cited-lang", value: "es", url: E2E_BASE_URL }]);
  await signInThroughTheApi(page);

  const name = "e2e-politicas-del-taller-de-bicicletas.md";
  const uploaded = await page.request.post("/api/admin/documents", {
    headers: { origin: E2E_BASE_URL },
    multipart: {
      document: {
        name,
        mimeType: "text/markdown",
        buffer: Buffer.from("# Politicas del taller\n\nLas reparaciones se entregan en tres dias habiles.\n"),
      },
    },
  });

  expect(uploaded.status(), "the document of this spec is ingested").toBe(200);

  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto(`/admin/information/${name}`);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(spanish.documentName);

    const box = await page.locator("main").boundingBox();
    // Only the controls of the page: the numbered sections of the bar live outside `main` and scroll with it.
    const controls = page.locator("main").getByRole("button").or(page.locator("main").getByRole("link"));

    expect(await controls.count(), `${width}: the controls of the page`).toBeGreaterThan(0);

    for (const control of await controls.all()) {
      const target = await control.boundingBox();
      const label = `${width}: ${(await control.textContent()) ?? ""}`;

      if (target === null) {
        continue;
      }

      console.log(`${label} at ${JSON.stringify(target)} inside ${JSON.stringify(box)}`);
      expect(target.height, `${label}: 44 px, one line`).toBeGreaterThanOrEqual(43.5);
      expect(target.height, `${label}: one line, not broken at the hyphen`).toBeLessThan(60);
      expect(target.x + target.width, `${label}: inside the box`).toBeLessThanOrEqual(
        (box?.x ?? 0) + (box?.width ?? 0),
      );
      expect(target.x + target.width, `${label}: inside the screen`).toBeLessThanOrEqual(width);
    }

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `${width}: the page does not scroll sideways`,
    ).toBe(true);
  }

  await axe(page, "/admin/information/[id] at 320 in Spanish");

  // Decision 5: "Remove" opens a window of a few seconds in which nothing was deleted and the undo keeps the document.
  await page.getByRole("button", { name: spanish.documentRemove }).click();
  await expect(page.getByText(spanish.documentRemoving.replace("{name}", name))).toBeVisible();
  await page.getByRole("button", { name: spanish.documentUndo }).click();
  await expect(page.getByText(spanish.documentKept)).toBeVisible();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
});

// Scenario "Dates read like dates" (decision 19 of `design.md`). The spec uploads a document of its own and asks about it,
// so it never touches the document that `admin.spec.ts` uploads and deletes. The question is asked once, with a text of its
// own, and only the reading of the page is polled (finding 44 of the third review): a retry that asked again would hide a race
// and spend the limit of the address. The suite runs on one worker, so no other spec clears the turn in between.
// The reader lives far from any server (UTC+14, second review of step 12): the date is printed in the zone of the browser,
// not in the zone of the container, so an owner never reads another hour or another day.
const READER_ZONE = "Pacific/Kiritimati";

test.describe("a reader in another zone", () => {
  test.use({ timezoneId: READER_ZONE });

  test("the conversations in Spanish print each date as a time an owner reads, with the stored value in dateTime", async ({
    page,
    context,
  }) => {
    const hydration: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error" && /hydrat/i.test(message.text())) {
        hydration.push(message.text());
      }
    });

    await context.addCookies([{ name: "cited-lang", value: "es", url: E2E_BASE_URL }]);
    await page.setViewportSize({ width: 1440, height: 900 });
    await signInThroughTheApi(page);

    const name = "e2e-fechas-del-taller.md";
    const uploaded = await page.request.post("/api/admin/documents", {
      headers: { origin: E2E_BASE_URL },
      multipart: {
        document: {
          name,
          mimeType: "text/markdown",
          buffer: Buffer.from("# Horario del taller\n\nEl taller de bicicletas abre los sábados de diez a dos.\n"),
        },
      },
    });

    expect(uploaded.status(), "the document of this spec is ingested").toBe(200);

    const question = `¿El taller de bicicletas abre los sábados? (${Date.now()})`;
    const row = page.getByRole("row").filter({ hasText: question }).first();
    const asked = await page.request.post("/api/ask", {
      data: { question, sessionId: `e2e-fechas-${Date.now()}` },
    });

    expect(asked.status(), "the question is answered once").toBe(200);

    await expect(async () => {
      await page.goto("/admin/conversations");
      await expect(row).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });

    const time = row.locator("time");

    await expect(time, "the date cell is a time element").toHaveCount(1);

    const reader = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

    expect(reader, "the browser of this case lives in the zone it was given").toBe(READER_ZONE);

    const stored = (await time.getAttribute("datetime")) ?? "";
    const shown = ((await time.textContent()) ?? "").trim();

    console.log(`the date of the turn: dateTime="${stored}", text="${shown}"`);
    expect(stored, "dateTime carries the stored ISO value").toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
    expect(shown, "the visible text has no T and no Z").not.toMatch(/[TZ]/);
    expect(shown, "the date and hour formatted for es in the zone of the reader").toBe(
      formatWhen(stored, "es", reader),
    );
    expect(hydration, "the server and the browser print the same date").toEqual([]);

    await axe(page, "/admin/conversations in Spanish");

    const removed = await page.request.post("/api/admin/documents/delete", {
      headers: { origin: E2E_BASE_URL },
      data: { name },
    });

    expect(removed.status(), "the document of this spec is removed").toBe(200);
  });
});

// Decision 32 of `design.md`, the scenario "Every signature carries the flame" of the requirement "Katalis always signs with
// its flame": one loop over `/`, `/embed`, `/kit`, `/admin` signed out and every page of the panel (with `/admin/ai`), in
// English and in Spanish, that finds every signature ("Built by Katalis", "Hecho por Katalis", "by Katalis") and checks a flame
// image (`/brand/katalis-flame*.png`) beside it, and that the Spanish pages read "Hecho por Katalis". A sentence that only mentions
// Katalis inside the text of the kit is not a signature: a signature is an element whose own text ends with "by Katalis".
// The public pages are served by the other server of the suite, on the port that `e2e/widget.spec.ts` names as its origin.
const PUBLIC_ORIGIN = "http://127.0.0.1:3100";

type Signature = { text: string; visible: boolean; flames: number };

async function signaturesOf(page: Page): Promise<Signature[]> {
  return page.evaluate(() => {
    const found: Array<{ text: string; visible: boolean; flames: number }> = [];

    for (const element of document.querySelectorAll("body *")) {
      const own = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? "")
        .join("")
        .trim();

      if (/(?:Built by|Hecho por|by) Katalis$/.test(own) === false) {
        continue;
      }

      const box = element.getBoundingClientRect();
      const scope = element.parentElement ?? element;
      const flames = [...scope.querySelectorAll("img"), ...element.querySelectorAll("img")].filter((image) =>
        /\/brand\/katalis-flame[^"]*\.png/.test(image.getAttribute("src") ?? ""),
      );

      found.push({
        text: own,
        visible: box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== "hidden",
        flames: new Set(flames).size,
      });
    }

    return found;
  });
}

for (const lang of ["en", "es"] as const) {
  test(`in ${lang} every signature of Katalis carries the real flame, on every page of the product`, async ({ page, context }) => {
    const line = lang === "es" ? "Hecho por Katalis" : "Built by Katalis";
    const other = lang === "es" ? "Built by Katalis" : "Hecho por Katalis";

    await page.setViewportSize({ width: 1440, height: 900 });
    await context.addCookies([
      { name: "cited-lang", value: lang, url: E2E_BASE_URL },
      { name: "cited-lang", value: lang, url: PUBLIC_ORIGIN },
    ]);

    // `signature` says whether the page has one at all: the embed and the kit carry no signature of their own.
    const pages: Array<{ url: string; signature: boolean; signedIn: boolean }> = [
      { url: `${PUBLIC_ORIGIN}/`, signature: true, signedIn: false },
      { url: `${PUBLIC_ORIGIN}/embed`, signature: false, signedIn: false },
      { url: `${PUBLIC_ORIGIN}/kit`, signature: false, signedIn: false },
      { url: `${E2E_BASE_URL}/admin`, signature: true, signedIn: false },
    ];
    const panel = ["/admin", "/admin/home", "/admin/information", "/admin/try", "/admin/publish", "/admin/settings", "/admin/conversations", "/admin/ai"];
    const checked: string[] = [];

    async function walk(target: { url: string; signature: boolean }, label: string): Promise<void> {
      const response = await page.goto(target.url);

      expect(response?.status(), label).toBe(200);

      const signatures = await signaturesOf(page);
      const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");

      for (const signature of signatures) {
        expect(signature.flames, `${label}: a flame beside "${signature.text}"`).toBeGreaterThanOrEqual(1);
      }

      if (target.signature) {
        expect(signatures.length, `${label}: the page signs`).toBeGreaterThanOrEqual(1);
        expect(signatures.every((signature) => signature.visible), `${label}: every signature is visible`).toBe(true);
        expect(
          signatures.some((signature) => signature.text.endsWith(line)),
          `${label}: the signature reads "${line}"`,
        ).toBe(true);
      }

      expect(text, `${label}: never the line of the other language`).not.toContain(other);
      checked.push(`${label} (${signatures.length})`);
    }

    for (const target of pages) {
      await walk(target, `${lang} ${target.url.replace(/^https?:\/\/[^/]+/, "")}${target.url.startsWith(PUBLIC_ORIGIN) ? " public" : " signed out"}`);
    }

    await signInThroughTheApi(page);

    for (const path of panel) {
      await walk({ url: `${E2E_BASE_URL}${path}`, signature: true }, `${lang} ${path} signed in`);
    }

    console.log(`the flame in ${lang}: ${checked.join(", ")}`);
    expect(checked.length, "every page of the loop was walked").toBe(pages.length + panel.length);
  });
}

test.describe("the sign-in", () => {
  test("in Spanish it shows the tagline with its last words highlighted, keeps its form and passes axe", async ({
    page,
    context,
  }) => {
    await context.addCookies([{ name: "cited-lang", value: "es", url: E2E_BASE_URL }]);
    await page.setViewportSize({ width: 1440, height: 900 });

    const response = await page.goto("/admin");

    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    // The tagline, in one piece for the eye and for the reader of the screen, with its last words in the highlighter.
    const tagline = page.getByText("Cada respuesta enseña de dónde salió.", { exact: true });

    await expect(tagline).toBeVisible();

    const highlight = tagline.locator(".hl");

    await expect(highlight, "the last words are in the highlighter").toHaveCount(1);

    const tail = ((await highlight.textContent()) ?? "").trim();

    console.log(`the highlighted words of the tagline: "${tail}"`);
    expect(tail.length, "some words are highlighted").toBeGreaterThan(0);
    expect("Cada respuesta enseña de dónde salió.".endsWith(tail), "the tail is the end of the sentence").toBe(true);
    expect(tail.split(/\s+/).length, "the last three words").toBe(3);

    await expect(page.locator('[data-brand="wordmark"]').first(), "the wordmark").toBeVisible();

    // Decision 18 of `design.md`: the Spanish signature, with the real flame beside it.
    const signature = page.getByText(spanish.builtBy, { exact: true });

    expect(spanish.builtBy).toBe("Hecho por Katalis");
    await expect(signature).toBeVisible();
    await expect(signature.locator("xpath=..").locator("img[src*='katalis-flame']")).toHaveCount(1);
    await expect(page.getByText(english.builtBy)).toHaveCount(0);

    // The form keeps its label, its button and its messages.
    await expect(page.getByLabel(spanish.passwordLabel)).toBeVisible();
    await expect(page.getByRole("button", { name: spanish.signIn })).toBeVisible();

    await page.getByLabel(spanish.passwordLabel).fill("no-es-la-clave");
    await page.getByRole("button", { name: spanish.signIn }).click();
    await expect(page.getByText(spanish.wrongPassword)).toBeVisible();

    await axe(page, "/admin signed out, in Spanish");
  });

  test("at 375 px the two halves stack, ink first, and nothing scrolls sideways", async ({ page, context }) => {
    await context.addCookies([{ name: "cited-lang", value: "es", url: E2E_BASE_URL }]);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin");

    const tagline = page.getByText("Cada respuesta enseña de dónde salió.", { exact: true });
    const form = page.getByLabel(spanish.passwordLabel);

    await expect(tagline).toBeVisible();
    await expect(form).toBeVisible();

    const above = await tagline.boundingBox();
    const below = await form.boundingBox();

    expect(above?.y ?? Number.POSITIVE_INFINITY, "the tagline comes first").toBeLessThan(below?.y ?? 0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      "the page does not scroll sideways",
    ).toBe(true);
  });
});
