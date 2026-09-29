import { mkdirSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { assertHonestRecord } from "./readme-graphics/honesty.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = "scripts/readme-banner.html";
const bannerPath = "docs/images/readme-banner-dark.png";
const bannerLightPath = "docs/images/readme-banner-light.png";
const recordPath = "docs/images/readme-banner.json";
const wordmark = "Cited";
const mark = "[1]";
const tagline = "Ask your own documents. Get the passage and where it came from.";
const byline = "by Katalis";
// The mark of the maker (design decision 3): the flame of `public/brand/`, the original on the ink of the dark theme
// and its ink variant on the paper of the light one, at the height of the `by Katalis` line and to its left. It is
// embedded as a data URI because the page is set with `setContent` and has no base address.
const flame = {
  dark: "public/brand/katalis-flame-192.png",
  light: "public/brand/katalis-flame-ink-192.png",
  height: "1em",
  where: "at the height of the by Katalis line, to its left",
};
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
const dataUri = (path) => `data:image/png;base64,${readFileSync(absolute(path)).toString("base64")}`;

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
    FLAME: dataUri(dark ? flame.dark : flame.light),
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

  const placed = await page.evaluate(() => {
    const line = document.querySelector(".byline");
    const image = document.querySelector(".byline .flame");
    const word = document.querySelector(".byline span");

    if (line === null || image === null || word === null) {
      return null;
    }

    const mark = image.getBoundingClientRect();
    const text = word.getBoundingClientRect();

    return {
      height: mark.height,
      line: Number.parseFloat(getComputedStyle(line).fontSize),
      toTheLeft: mark.right <= text.left + 0.5,
      middle: Math.abs(mark.top + mark.height / 2 - (text.top + text.height / 2)),
      width: mark.width,
    };
  });

  if (placed === null) {
    throw new Error(`The ${theme} banner draws no flame beside by Katalis.`);
  }

  if (Math.abs(placed.height - placed.line) > 0.5) {
    throw new Error(
      `The flame of the ${theme} banner is ${placed.height}px high and the by Katalis line is ${placed.line}px.`,
    );
  }

  if (placed.toTheLeft === false) {
    throw new Error(`The flame of the ${theme} banner is not to the left of by Katalis.`);
  }

  if (placed.middle > 1) {
    throw new Error(
      `The flame of the ${theme} banner sits ${placed.middle}px away from the middle of the by Katalis line.`,
    );
  }

  await page.screenshot({ path: absolute(target), type: "png" });
  await page.close();
  console.log(
    `rendered ${target} (the flame is ${placed.width.toFixed(1)} by ${placed.height.toFixed(1)}px, the line ${placed.line}px)`,
  );
}

mkdirSync(dirname(absolute(recordPath)), { recursive: true });

const browser = await chromium.launch();

try {
  await screenshot(browser, bannerPath, "dark");
  await screenshot(browser, bannerLightPath, "light");
} finally {
  await browser.close();
}

const record = {
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
  flame,
  font,
  tokens,
};

assertHonestRecord(record, recordPath);
await writeFile(absolute(recordPath), `${JSON.stringify(record, null, 2)}\n`);

console.log(`wrote ${recordPath}`);
