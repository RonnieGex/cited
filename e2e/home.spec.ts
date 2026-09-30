import { expect, test } from "@playwright/test";

test("home page answers with the product name", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Cited",
  );
});

// The scenario "Every signature carries the flame" of `openspec/changes/brand-identity-ui/specs/design-system/spec.md`
// on the two public documents, in both languages: every element whose own text names Katalis has a flame image as a
// child or a sibling. `e2e/brand.spec.ts` covers the panel and the kit.
for (const lang of ["en", "es"] as const) {
  for (const path of ["/", "/embed"]) {
    test(`${path} in ${lang}: every Katalis signature carries the flame`, async ({ page, context, baseURL }) => {
      await context.addCookies([{ name: "cited-lang", value: lang, url: baseURL ?? "http://127.0.0.1:3100" }]);
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);

      const unsigned = await page.evaluate(() =>
        [...document.body.querySelectorAll<HTMLElement>("*")]
          // The payload of the router (a `script` carrying the meta description) is not a visible signature.
          .filter((element) => element.closest("script, style, noscript, template") === null)
          .filter((element) =>
            [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && /Katalis/.test(node.textContent ?? "")),
          )
          .filter((element) => {
            const flame = 'img[src*="katalis-flame"]';

            return element.querySelector(flame) === null && element.parentElement?.querySelector(flame) === null;
          })
          .map((element) => `${element.tagName}: ${element.textContent?.trim().slice(0, 60)}`),
      );

      expect(unsigned, `${path} ${lang}`).toEqual([]);

      if (path === "/") {
        await expect(page.getByText(lang === "es" ? "Hecho por Katalis" : "Built by Katalis", { exact: true })).toBeVisible();
      }
    });
  }
}
