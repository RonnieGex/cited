import { mkdirSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { assertHonestRecord } from "./readme-graphics/honesty.mjs";
import { outfit, outfitFace } from "./readme-graphics/font.mjs";

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
// and its ink variant on the paper of the light one, beside the `by Katalis` line and to its left. It is embedded as a
// data URI because the page is set with `setContent` and has no base address. Section 10 of the contract: at the height
// of the line the mark measured 19 px and did not read as the flame of Katalis, so the style sheet of the template
// draws it at 48 px and the render fails below 40.
const flame = {
  dark: "public/brand/katalis-flame-192.png",
  light: "public/brand/katalis-flame-ink-192.png",
  minimumHeight: 40,
  where: "beside the by Katalis line, to its left, taller than the line",
};
const font = {
  name: outfit.name,
  source: outfit.subset,
  license: outfit.license,
  loadedAtRenderTime: true,
  fileInRepository: true,
};
const tokens = {
  ink: "#171717",
  lime: "#DDF469",
  offWhite: "#F7F6F2",
};

const absolute = (relative) => resolve(root, relative);
const template = readFileSync(absolute(templatePath), "utf8");
const dataUri = (path) => `data:image/png;base64,${readFileSync(absolute(path)).toString("base64")}`;
const round = (value) => Math.round(value * 100) / 100;

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
    FONT_FACE: outfitFace(absolute),
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
      x: mark.x,
      y: mark.y,
    };
  });

  if (placed === null) {
    throw new Error(`The ${theme} banner draws no flame beside by Katalis.`);
  }

  if (placed.height < flame.minimumHeight) {
    throw new Error(
      `The flame of the ${theme} banner is ${placed.height}px high; the mark of the maker reads at ${flame.minimumHeight}px or more beside by Katalis.`,
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
    `rendered ${target} (the flame is ${placed.width.toFixed(1)} by ${placed.height.toFixed(1)}px, the line ${placed.line}px, the floor ${flame.minimumHeight}px)`,
  );

  return {
    x: round(placed.x),
    y: round(placed.y),
    width: round(placed.width),
    height: round(placed.height),
    line: placed.line,
  };
}

mkdirSync(dirname(absolute(recordPath)), { recursive: true });

const browser = await chromium.launch();
const rendered = {};

try {
  rendered.dark = await screenshot(browser, bannerPath, "dark");
  rendered.light = await screenshot(browser, bannerLightPath, "light");
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
  flame: {
    dark: flame.dark,
    light: flame.light,
    minimumHeight: flame.minimumHeight,
    where: flame.where,
    rendered,
  },
  font,
  tokens,
};

assertHonestRecord(record, recordPath);
await writeFile(absolute(recordPath), `${JSON.stringify(record, null, 2)}\n`);

console.log(`wrote ${recordPath}`);
