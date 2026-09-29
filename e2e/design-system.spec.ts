import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The two scenarios of `openspec/changes/brand-and-design-system/specs/design-system/spec.md` that need a browser:
// the computed font of `html`, of `body` and of a paragraph with no request to a font host outside the app, and the
// public page `/kit` with one example of each component of the kit and an axe check of level A and AA.
//
// The unit half of the change lives in `tests/design-system.test.ts`.

const markers = [
  "button-primary",
  "button-secondary",
  "input",
  "chip",
  "panel",
  "section-title",
];

test("every text of the app is Outfit, served by the app", async ({ page }) => {
  const asked: string[] = [];

  page.on("request", (request) => {
    asked.push(request.url());
  });

  const response = await page.goto("/kit");

  expect(response?.status()).toBe(200);

  const origin = new URL(page.url()).origin;

  await page.evaluate(() => document.fonts.ready);

  const families = await page.evaluate(() => {
    const family = (element: Element | null): string =>
      element === null ? "no element" : getComputedStyle(element).fontFamily;

    return {
      html: family(document.documentElement),
      body: family(document.body),
      paragraph: family(document.querySelector("p")),
    };
  });

  console.log(`computed font-family: ${JSON.stringify(families)}`);
  console.log(`requests of the page: ${JSON.stringify(asked)}`);

  for (const [where, family] of Object.entries(families)) {
    expect(family, `the computed font-family of ${where}`).toMatch(/^["']?Outfit["']?(\s*,|$)/);
  }

  const fetched = asked.filter((url) => /^(data:|blob:|about:)/.test(url) === false);
  const external = fetched.filter((url) => new URL(url).origin !== origin);
  const families_ = fetched.filter((url) => /\.woff2?(\?|$)/.test(url));

  expect(external, "no request leaves the app").toEqual([]);
  expect(
    families_.some((url) => url.includes("/fonts/outfit/")),
    "the app serves its own Outfit file",
  ).toBe(true);
});

test("the kit renders every component, answers 200 and passes axe", async ({ page }) => {
  const response = await page.goto("/kit");

  expect(response?.status()).toBe(200);

  for (const marker of markers) {
    await expect(page.locator(`[data-kit="${marker}"]`), marker).toHaveCount(1);
  }

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Buscar" })).toBeVisible();
  await expect(page.getByRole("textbox")).toBeVisible();

  const primary = page.locator('[data-kit="button-primary"]');

  await primary.focus();

  const focus = await page.evaluate(() => {
    const element = document.activeElement;
    const style = element === null ? null : getComputedStyle(element);

    return {
      visible: element?.matches(":focus-visible") ?? false,
      width: style?.outlineWidth ?? "0px",
      style: style?.outlineStyle ?? "none",
      color: style?.outlineColor ?? "none",
    };
  });

  console.log(`focus of the primary button: ${JSON.stringify(focus)}`);

  expect(focus.visible, "the focus is visible").toBe(true);
  expect(Number.parseFloat(focus.width), "the outline is 2 px").toBeGreaterThanOrEqual(2);
  expect(focus.style).toBe("solid");
  expect(focus.color.replaceAll(" ", ""), "the outline is lime").toBe("rgb(221,244,105)");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  console.log(
    `axe: ${results.violations.length} violations, ${results.passes.length} rules passed`,
  );

  expect(
    results.violations.map(
      (violation) => `${violation.id} (${violation.impact}): ${violation.nodes.length} nodes`,
    ),
  ).toEqual([]);
});
