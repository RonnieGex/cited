import { mkdirSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = "scripts/readme-banner.html";
const bannerPath = "docs/images/readme-banner-dark.png";
const bannerLightPath = "docs/images/readme-banner-light.png";
const recordPath = "docs/images/readme-banner.json";
const wordmark = "Cited";
const mark = "[1]";
const tagline = "Answers from your own documents, with the page they came from.";
const byline = "by Katalis";
const font = {
  name: "Outfit",
  source: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap",
  loadedAtRenderTime: true,
  fileInRepository: false,
};
const tokens = {
  ink: "#171717",
  lime: "#DDF469",
  offWhite: "#F7F6F2",
};

const absolute = (relative) => resolve(root, relative);
const template = readFileSync(absolute(templatePath), "utf8");

function fill(values) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
    template,
  );
}

function html(theme) {
  const dark = theme === "dark";

  return fill({
    THEME: theme,
    BACKGROUND: dark ? tokens.ink : tokens.offWhite,
    TEXT: dark ? tokens.offWhite : tokens.ink,
    GLOW: dark ? "rgba(221, 244, 105, 0.16)" : "rgba(221, 244, 105, 0.30)",
    MARK_OUTLINE: dark ? "0.6px rgba(23, 23, 23, 0.9)" : `1.6px ${tokens.ink}`,
    TAGLINE_OPACITY: dark ? "0.92" : "0.88",
    BYLINE_OPACITY: dark ? "0.62" : "0.58",
    TAGLINE: tagline,
  });
}

async function screenshot(browser, target, theme) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 320 },
    deviceScaleFactor: 1,
  });

  await page.setContent(html(theme), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  const loaded = await page.evaluate(() => document.fonts.check('700 132px "Outfit"'));

  if (!loaded) {
    throw new Error(
      "The Outfit font did not load: a banner rendered without it is not the brand of the README.",
    );
  }

  await page.screenshot({ path: absolute(target), type: "png" });
  await page.close();
  console.log(`rendered ${target}`);
}

mkdirSync(dirname(absolute(recordPath)), { recursive: true });

const browser = await chromium.launch();

try {
  await screenshot(browser, bannerPath, "dark");
  await screenshot(browser, bannerLightPath, "light");
} finally {
  await browser.close();
}

await writeFile(
  absolute(recordPath),
  `${JSON.stringify(
    {
      wordmark,
      mark,
      tagline,
      byline,
      width: 1280,
      height: 320,
      dark: bannerPath,
      light: bannerLightPath,
      darkBackground: tokens.ink,
      lightBackground: tokens.offWhite,
      lightMarkOutline: tokens.ink,
      font,
      tokens,
    },
    null,
    2,
  )}\n`,
);

console.log(`wrote ${recordPath}`);
