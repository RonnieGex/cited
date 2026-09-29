import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { roadmap, states, statusRows, tokens } from "./readme-graphics/data.mjs";
import { graphics, logo, social } from "./readme-graphics/manifest.mjs";
import { patchReadmeQuickStart, terminalLines, withoutNpmNoise } from "./readme-graphics/quickstart.mjs";

const loadOptimizer = async () => {
  try {
    const { default: sharp } = await import("sharp");

    return sharp;
  } catch {
    console.warn("sharp is not installed: the graphics are written without the extra optimization.");

    return null;
  }
};

const sharp = await loadOptimizer();

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templates = "scripts/readme-graphics";
const recordPath = "docs/images/readme-graphics.json";
const bannerRecordPath = "docs/images/readme-banner.json";
const ingestCommand = 'EMBEDDINGS_PROVIDER=fake npm run ingest -- samples/';
const searchQuestion = "¿Cuánto cuesta una afinación de bicicleta?";
const searchCommand = `EMBEDDINGS_PROVIDER=fake npm run search -- "${searchQuestion}"`;
const maximumLine = 112;
const minimumFontSize = 16;
const minimumHeadline = { wide: 44, card: 30 };
const minimumArtShare = 0.4;
const maximumEmptyBand = 0.25;
const minimumContrast = 4.5;
const font = {
  name: "Outfit",
  source: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap",
  loadedAtRenderTime: true,
  fileInRepository: false,
};

const absolute = (relative) => resolve(root, relative);

const themes = {
  dark: {
    THEME: "dark",
    BACKGROUND: tokens.ink,
    TEXT: tokens.offWhite,
    MUTED: "rgba(247, 246, 242, 0.8)",
    MUTED_SOFT: "rgba(247, 246, 242, 0.34)",
    HAIRLINE: "rgba(247, 246, 242, 0.18)",
    PANEL: "rgba(247, 246, 242, 0.05)",
    PANEL_STRONG: "rgba(247, 246, 242, 0.09)",
    CARD_FILL: "rgba(247, 246, 242, 0.05)",
    CARD_BORDER: "rgba(247, 246, 242, 0.24)",
    CARD_SHADOW: "0 18px 40px rgba(0, 0, 0, 0.45)",
    BAR_BACKGROUND: "rgba(247, 246, 242, 0.09)",
    BAR_TEXT: "rgba(247, 246, 242, 1)",
    BAR_DOT: "rgba(247, 246, 242, 0.34)",
    TERMINAL_FILL: "rgba(247, 246, 242, 0.04)",
    TERMINAL_BORDER: "rgba(247, 246, 242, 0.2)",
    SCREEN_TEXT: tokens.offWhite,
    HIT_BACKGROUND: "transparent",
    HIT_TEXT: tokens.lime,
    NEXT_BACKGROUND: "transparent",
    NEXT_TEXT: tokens.lime,
    NEXT_BORDER: tokens.lime,
    LIME: tokens.lime,
    LIME_EDGE: "transparent",
    MARK: tokens.lime,
    ON_LIME: tokens.ink,
    GLOW: "radial-gradient(880px 460px at 8% -12%, rgba(221, 244, 105, 0.16), transparent 70%)",
  },
  light: {
    THEME: "light",
    BACKGROUND: tokens.offWhite,
    TEXT: tokens.ink,
    MUTED: "rgba(23, 23, 23, 0.92)",
    MUTED_SOFT: "rgba(23, 23, 23, 0.28)",
    HAIRLINE: "rgba(23, 23, 23, 0.14)",
    PANEL: "rgba(23, 23, 23, 0.03)",
    PANEL_STRONG: "rgba(23, 23, 23, 0.07)",
    CARD_FILL: "#FFFFFF",
    CARD_BORDER: "rgba(23, 23, 23, 0.16)",
    CARD_SHADOW: "0 14px 34px rgba(23, 23, 23, 0.12)",
    BAR_BACKGROUND: tokens.ink,
    BAR_TEXT: "rgba(247, 246, 242, 1)",
    BAR_DOT: "rgba(247, 246, 242, 0.34)",
    TERMINAL_FILL: tokens.offWhite,
    TERMINAL_BORDER: "rgba(23, 23, 23, 0.2)",
    SCREEN_TEXT: tokens.ink,
    HIT_BACKGROUND: tokens.lime,
    HIT_TEXT: tokens.ink,
    NEXT_BACKGROUND: "transparent",
    NEXT_TEXT: tokens.ink,
    NEXT_BORDER: tokens.ink,
    LIME: tokens.lime,
    LIME_EDGE: "rgba(23, 23, 23, 0.55)",
    MARK: tokens.ink,
    ON_LIME: tokens.ink,
    GLOW: "radial-gradient(880px 460px at 8% -12%, rgba(221, 244, 105, 0.45), transparent 70%)",
  },
};

function parseColor(text) {
  if (text === "transparent") {
    return [0, 0, 0, 0];
  }

  const hex = /^#([0-9a-f]{6})$/i.exec(text);

  if (hex !== null) {
    const value = Number.parseInt(hex[1] ?? "000000", 16);

    return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff, 1];
  }

  const parts = /^rgba?\(([^)]+)\)$/.exec(text);

  if (parts === null) {
    throw new Error(`Cannot read the color ${text}.`);
  }

  const values = (parts[1] ?? "").split(",").map((part) => Number.parseFloat(part.trim()));

  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0, values[3] ?? 1];
}

function over(foreground, background) {
  const front = parseColor(foreground);
  const back = parseColor(background);
  const alpha = front[3] + back[3] * (1 - front[3]);
  const channel = (index) =>
    Math.round(
      (front[index] * front[3] + back[index] * back[3] * (1 - front[3])) / (alpha === 0 ? 1 : alpha),
    );

  return `rgba(${channel(0)}, ${channel(1)}, ${channel(2)}, ${alpha.toFixed(3)})`;
}

function luminance(color) {
  const [red, green, blue] = parseColor(color);

  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
}

function contrastRatio(foreground, background) {
  const first = luminance(over(foreground, background));
  const second = luminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}

function contrastPairs(theme) {
  const card = over(theme.CARD_FILL, theme.BACKGROUND);
  const terminal = over(theme.TERMINAL_FILL, theme.BACKGROUND);
  const bar = over(theme.BAR_BACKGROUND, theme.BACKGROUND);
  const hit = over(theme.HIT_BACKGROUND, terminal);

  return [
    ["the body text on the page", theme.TEXT, theme.BACKGROUND],
    ["the muted text on the page", theme.MUTED, theme.BACKGROUND],
    ["the muted text on a card", theme.MUTED, card],
    ["the body text on a card", theme.TEXT, card],
    ["the index of a step on its card", theme.MARK, card],
    ["the Next tag on the page", theme.NEXT_TEXT, theme.BACKGROUND],
    ["the Next tag on its surface", theme.NEXT_TEXT, over(theme.NEXT_BACKGROUND, theme.BACKGROUND)],
    ["the commands on the terminal", theme.HIT_TEXT, hit],
    ["the output on the terminal", theme.SCREEN_TEXT, terminal],
    ["the title bar on the terminal", theme.BAR_TEXT, bar],
    ["the ink of a lime shape", theme.ON_LIME, theme.LIME],
  ];
}

function reportContrast() {
  const failures = [];

  for (const [name, theme] of Object.entries(themes)) {
    console.log(`contrast of the ${name} theme:`);

    for (const [what, foreground, background] of contrastPairs(theme)) {
      const ratio = contrastRatio(foreground, background);

      console.log(`  ${ratio.toFixed(2)}:1  ${what}`);

      if (ratio < minimumContrast) {
        failures.push(`${name}: ${what} is ${ratio.toFixed(2)}:1`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`The art direction asks for ${minimumContrast}:1 and these are below it:\n${failures.join("\n")}`);
  }
}

const styles = `
.page {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 36px 52px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.head {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 1080px;
}
.headline {
  font-size: 44px;
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.015em;
}
.headline.big {
  font-size: 56px;
}
.card-headline {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.16;
  letter-spacing: -0.01em;
}
.eyebrow {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--muted);
}
.body {
  font-size: 18px;
  font-weight: 400;
  line-height: 1.45;
  color: var(--muted);
}
.note {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--muted);
}
.card {
  position: absolute;
  inset: 14px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--card-border);
  border-radius: 20px;
  background: var(--card-fill);
  box-shadow: var(--card-shadow);
}
.card .art {
  width: 100%;
  height: 112px;
  flex: none;
}
.card-copy {
  margin-top: auto;
  font-size: 17px;
  font-weight: 400;
  line-height: 1.35;
  color: var(--muted);
}
.node {
  position: absolute;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid var(--card-border);
  border-radius: 16px;
  background: var(--card-fill);
}
.node-index {
  font-size: 16px;
  font-weight: 700;
  color: var(--mark);
}
.node-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.15;
}
.node-sub {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.25;
  color: var(--muted);
}
.node-next {
  align-self: flex-start;
  margin-top: 2px;
}
.node-answer {
  background: var(--panel-strong);
  border-color: var(--lime-edge);
}
.link {
  position: absolute;
  background: var(--lime);
  box-shadow: 0 0 0 1px var(--lime-edge);
}
.fork {
  position: absolute;
  background: var(--lime);
  box-shadow: 0 0 0 1px var(--lime-edge);
}
.next {
  display: inline-block;
  padding: 3px 12px 2px;
  border: 1px solid var(--next-border);
  border-radius: 999px;
  background: var(--next-background);
  color: var(--next-text);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  white-space: nowrap;
}
.next.floating {
  position: absolute;
  top: 18px;
  right: 18px;
}
.terminal {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--terminal-border);
  border-radius: 16px;
  background: var(--terminal-fill);
  overflow: hidden;
}
.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: var(--bar-background);
  border-bottom: 1px solid var(--terminal-border);
}
.light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bar-dot);
}
.light-a {
  background: var(--lime);
  box-shadow: 0 0 0 1px var(--lime-edge);
}
.bar-title {
  margin-left: 8px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--bar-text);
}
.screen {
  flex: 1;
  min-height: 0;
  padding: 14px 22px;
  font-family: "Cascadia Mono", "Consolas", "DejaVu Sans Mono", monospace;
  font-size: 16px;
  line-height: 1.42;
  color: var(--screen-text);
}
.line {
  white-space: pre;
  overflow: hidden;
}
.line.hit {
  background: var(--hit-background);
  color: var(--hit-text);
}
.prompt {
  color: var(--hit-text);
}
.prompt .sign {
  margin-right: 10px;
}
.flow {
  position: relative;
  flex: 1;
  min-height: 0;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid currentColor;
  display: inline-block;
}
.check {
  flex: none;
  width: 22px;
  height: 22px;
}
.check-stroke {
  fill: none;
  stroke: var(--on-lime);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.board {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 26px;
}
.column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.column-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 2px;
}
.check {
  flex: none;
  width: 22px;
  height: 22px;
}
.row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 9px 14px;
  border: 1px solid var(--card-border);
  border-radius: 12px;
  background: var(--card-fill);
}
.row-capability {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
}
.row-detail {
  display: flex;
  align-items: center;
  gap: 10px;
}
.row-reference {
  font-family: "Cascadia Mono", "Consolas", "DejaVu Sans Mono", monospace;
  font-size: 16px;
  color: var(--muted);
}
.column-note {
  margin-top: auto;
  padding-top: 6px;
  font-size: 16px;
  color: var(--muted);
}
.orb-wrap {
  flex: none;
  width: 260px;
  height: 260px;
}
.orb {
  width: 100%;
  height: 100%;
}
.orb-ring {
  stroke: var(--card-border);
  stroke-width: 2;
}
.orb-wave {
  fill: none;
  stroke: ${tokens.ink};
  stroke-width: 7;
  stroke-linecap: round;
}
.orb-core {
  fill: ${tokens.ink};
}
.voice-row {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  gap: 56px;
}
.voice {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: flex-start;
}
.mark-line {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.wordmark {
  font-size: 220px;
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 0.9;
}
.mark-sup {
  font-size: 72px;
  font-weight: 700;
  color: var(--lime);
  margin-top: 12px;
}
.tagline {
  font-size: 36px;
  font-weight: 400;
  line-height: 1.3;
  color: var(--muted);
}
.byline {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--muted);
}
.rule {
  width: 220px;
  height: 6px;
  background: var(--lime);
  box-shadow: 0 0 0 1px var(--lime-edge);
}
.social {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 48px 72px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 30px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-mark {
  width: 64px;
  height: 64px;
}
.logo-plate {
  fill: ${tokens.ink};
}
.logo-stroke {
  stroke: ${tokens.offWhite};
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.logo-word {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${tokens.ink};
}
body[data-theme="dark"] .logo-plate {
  fill: ${tokens.offWhite};
}
body[data-theme="dark"] .logo-stroke {
  stroke: ${tokens.ink};
}
body[data-theme="dark"] .logo-word {
  color: ${tokens.offWhite};
}
.stroke-strong {
  stroke: currentColor;
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.stroke-soft {
  stroke: currentColor;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.34;
}
.stroke-ink {
  stroke: ${tokens.ink};
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.stroke-lime {
  stroke: var(--lime);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.fill-lime {
  fill: var(--lime);
}
.fill-lime,
.stroke-lime {
  filter: drop-shadow(0 0 1px var(--lime-edge));
}
.fill-lime-soft {
  fill: var(--lime);
  opacity: 0.4;
}
.fill-ink {
  fill: ${tokens.ink};
}
.card .mark {
  font-family: Outfit, sans-serif;
  font-size: 18px;
  font-weight: 700;
  fill: ${tokens.ink};
  text-anchor: middle;
}
`;

const base = readFileSync(absolute(`${templates}/base.html`), "utf8");

function fill(template, values) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeLines(text) {
  return escapeHtml(text)
    .split("\n")
    .map((line) => (line.length > maximumLine ? `${line.slice(0, maximumLine - 1)}…` : line))
    .join("\n");
}

function html(content, theme, width, height) {
  const values = themes[theme];
  const page = fill(base, {
    ...values,
    NEXT_BORDER: values.NEXT_BORDER,
    LIME_EDGE: values.LIME_EDGE,
    CARD_SHADOW: values.CARD_SHADOW,
    STYLES: styles,
    CONTENT: content,
    WIDTH: width,
    HEIGHT: height,
  });
  const missing = [...page.matchAll(/\{\{([A-Z_]+)\}\}/g)].map((match) => match[1]);

  if (missing.length > 0) {
    throw new Error(`The template asks for ${[...new Set(missing)].join(", ")} and the renderer has no value.`);
  }

  return page;
}

function npmCli() {
  const candidates = [
    resolve(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
    resolve(dirname(process.execPath), "..", "lib", "node_modules", "npm", "bin", "npm-cli.js"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function run(command, args) {
  const cli = npmCli();
  const file = cli === null ? command : process.execPath;
  const fileArgs = cli === null ? args : [cli, ...args];
  const result = spawnSync(file, fileArgs, {
    cwd: root,
    encoding: "utf8",
    timeout: 180_000,
    env: {
      ...process.env,
      EMBEDDINGS_PROVIDER: "fake",
      DATABASE_URL: "",
      TURSO_DATABASE_URL: "",
      NO_COLOR: "1",
      FORCE_COLOR: "0",
    },
  });

  if (result.error !== undefined || result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed (${result.status}):\n${result.error?.message ?? ""}\n${result.stderr ?? ""}`,
    );
  }

  return `${result.stdout ?? ""}${result.stderr ?? ""}`.replaceAll("\r\n", "\n").trim();
}

function rowsOf(state) {
  return statusRows
    .filter((row) => row.state === state)
    .map((row) => {
      const detail =
        state === "Available"
          ? `<span class="row-reference">${escapeHtml(row.reference)}</span>`
          : `<span class="next">Next</span><span class="row-reference">${escapeHtml(row.reference)}</span>`;

      return `<div class="row"><span class="row-capability">${escapeHtml(
        row.capability,
      )}</span><span class="row-detail">${detail}</span></div>`;
    })
    .join("\n      ");
}

async function audit(page, graphic, theme) {
  const found = await page.evaluate(() => {
    const elements = [...document.querySelectorAll("body *")];
    const words = elements.filter(
      (element) =>
        element.children.length === 0 && (element.textContent ?? "").trim().length > 0,
    );
    const sizes = words.map((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    const headlines = elements
      .filter(
        (element) =>
          element.classList.contains("headline") || element.classList.contains("card-headline"),
      )
      .map((element) => ({
        text: (element.textContent ?? "").trim().slice(0, 48),
        size: Number.parseFloat(getComputedStyle(element).fontSize),
        weight: Number.parseInt(getComputedStyle(element).fontWeight, 10),
      }));
    const outside = elements
      .filter((element) => {
        const box = element.getBoundingClientRect();

        return (
          box.width > 0 &&
          box.height > 0 &&
          (box.right > window.innerWidth + 0.5 ||
            box.bottom > window.innerHeight + 0.5 ||
            box.left < -0.5 ||
            box.top < -0.5)
        );
      })
      .map((element) => `${element.className || element.tagName}`);
    const art = elements
      .filter((element) => element.classList.contains("art"))
      .map((element) => {
        const card = element.closest(".card");

        return card === null
          ? 0
          : element.getBoundingClientRect().height / card.getBoundingClientRect().height;
      });

    return {
      smallest: sizes.length === 0 ? minimumFontSize : Math.min(...sizes),
      headlines,
      outside,
      art,
    };
  });

  if (found.smallest < minimumFontSize) {
    throw new Error(`${graphic.name} (${theme}) draws text at ${found.smallest}px.`);
  }

  const wanted = graphic.width >= 1280 ? minimumHeadline.wide : minimumHeadline.card;

  for (const headline of found.headlines) {
    if (headline.size < wanted || headline.weight < 700) {
      throw new Error(
        `${graphic.name} (${theme}) draws "${headline.text}" at ${headline.size}px and weight ${headline.weight}.`,
      );
    }
  }

  if (found.outside.length > 0) {
    throw new Error(`${graphic.name} (${theme}) overflows the canvas: ${found.outside.join(", ")}.`);
  }

  for (const share of found.art) {
    if (share < minimumArtShare) {
      throw new Error(
        `${graphic.name} (${theme}) gives its illustration ${(share * 100).toFixed(1)}% of the card.`,
      );
    }
  }

  return found;
}

async function emptyBand(buffer, plain, width, height) {
  const drawn = await sharp(buffer).ensureAlpha().raw().toBuffer();
  const empty = await sharp(plain).ensureAlpha().raw().toBuffer();
  let longest = { length: 0, start: 0 };
  let run = 0;

  for (let y = 0; y < height; y += 1) {
    let touched = 0;

    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4;

      if (
        Math.abs((drawn[at] ?? 0) - (empty[at] ?? 0)) > 6 ||
        Math.abs((drawn[at + 1] ?? 0) - (empty[at + 1] ?? 0)) > 6 ||
        Math.abs((drawn[at + 2] ?? 0) - (empty[at + 2] ?? 0)) > 6
      ) {
        touched += 1;
      }
    }

    if (touched / width < 0.005) {
      run += 1;

      if (run > longest.length) {
        longest = { length: run, start: y - run + 1 };
      }
    } else {
      run = 0;
    }
  }

  return longest;
}

async function render(browser, graphic, content, theme, target, backgrounds) {
  const page = await browser.newPage({
    viewport: { width: graphic.width, height: graphic.height },
    deviceScaleFactor: 1,
  });
  const background = `${theme}:${graphic.width}x${graphic.height}`;

  await page.setContent(html(content, theme, graphic.width, graphic.height), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  const loaded = await page.evaluate(() => document.fonts.check('700 44px "Outfit"'));

  if (!loaded) {
    throw new Error(`The Outfit font did not load for ${graphic.name} (${theme}).`);
  }

  const audit_ = await audit(page, graphic, theme);
  mkdirSync(dirname(absolute(target)), { recursive: true });

  const png = await page.screenshot({ type: "png" });

  if (sharp !== null) {
    if (backgrounds.has(background) === false) {
      const plain = await browser.newPage({
        viewport: { width: graphic.width, height: graphic.height },
        deviceScaleFactor: 1,
      });

      await plain.setContent(html("", theme, graphic.width, graphic.height), {
        waitUntil: "load",
      });
      backgrounds.set(background, await plain.screenshot({ type: "png" }));
      await plain.close();
    }

    const band = await emptyBand(png, backgrounds.get(background), graphic.width, graphic.height);
    const allowed = Math.floor(graphic.height * maximumEmptyBand);

    if (band.length > allowed) {
      throw new Error(
        `${graphic.name} (${theme}) leaves ${band.length}px of empty background from y=${band.start}; the limit is ${allowed}px.`,
      );
    }
  }

  const optimized =
    sharp === null
      ? png
      : await sharp(png).png({ palette: true, colors: 256, compressionLevel: 9 }).toBuffer();

  await writeFile(absolute(target), optimized);
  await page.close();
  console.log(
    `rendered ${target} (${optimized.length} bytes, smallest text ${audit_.smallest}px, ${audit_.headlines.length} headlines)`,
  );
}

const asked = process.argv.slice(2);
const wanted = (name) => asked.length === 0 || asked.includes(name);
const banner = JSON.parse(readFileSync(absolute(bannerRecordPath), "utf8"));
const templatesOf = new Map(
  await Promise.all(
    [...graphics, social, logo].map(async (graphic) => [
      graphic.name,
      await readFile(absolute(`${templates}/${graphic.template}`), "utf8"),
    ]),
  ),
);

reportContrast();

const ingest = withoutNpmNoise(run("npm", ["run", "ingest", "--", "samples/"]));
const search = withoutNpmNoise(run("npm", ["run", "search", "--", searchQuestion]));
const drawn = {
  ingest: {
    command: ingestCommand,
    output: ingest,
    drawn: terminalLines(ingest, 5),
    readme: ingest,
  },
  search: {
    command: searchCommand,
    output: search,
    drawn: terminalLines(search, 4),
    readme: search,
  },
};
const searchLines = drawn.search.drawn.split("\n");
const hit = searchLines.findIndex((line) => /^\d+\. /.test(line));
const before = hit === -1 ? searchLines : searchLines.slice(0, hit);
const after = hit === -1 ? [] : searchLines.slice(hit + 1);
const contents = new Map(
  [...graphics, social].map((graphic) => [
    graphic.name,
    fill(templatesOf.get(graphic.name), {
      INGEST_COMMAND: escapeHtml(ingestCommand),
      INGEST_OUTPUT: escapeLines(drawn.ingest.drawn),
      SEARCH_COMMAND: escapeHtml(searchCommand),
      SEARCH_BEFORE: escapeLines(before.join("\n")),
      SEARCH_HIT: escapeLines(searchLines[hit] ?? ""),
      SEARCH_AFTER: escapeLines(after.join("\n")),
      AVAILABLE_ROWS: rowsOf("Available"),
      PLANNED_ROWS: rowsOf("Planned"),
      TAGLINE: escapeHtml(banner.tagline),
    }),
  ]),
);

const browser = await chromium.launch();
const backgrounds = new Map();
const written = [];

try {
  for (const graphic of graphics) {
    if (wanted(graphic.name) === false) {
      continue;
    }

    for (const theme of ["dark", "light"]) {
      await render(browser, graphic, contents.get(graphic.name), theme, graphic[theme], backgrounds);
    }

    written.push({
      name: graphic.name,
      dark: graphic.dark,
      light: graphic.light,
      width: graphic.width,
      height: graphic.height,
      headline: graphic.headline,
      copy: graphic.copy ?? null,
      shows: graphic.shows,
      label: graphic.label,
      alt: graphic.alt,
    });
  }

  if (wanted(social.name)) {
    await render(browser, social, contents.get(social.name), "dark", social.dark, backgrounds);
  }

  if (wanted(logo.name)) {
    for (const theme of ["light", "dark"]) {
      const logoPage = await browser.newPage({
        viewport: { width: 340, height: 170 },
        deviceScaleFactor: 1,
      });
      const target = theme === "dark" ? logo.dark : logo.light;

      await logoPage.setContent(html(templatesOf.get(logo.name), theme, 340, 170), { waitUntil: "load" });
      await logoPage.evaluate(() => document.fonts.ready);
      await logoPage.addStyleTag({ content: "html, body { background: transparent; }" });

      const logoPng = await logoPage.locator(".logo").screenshot({ type: "png", omitBackground: true });
      const logoOptimized =
        sharp === null
          ? logoPng
          : await sharp(logoPng)
              .png({ compressionLevel: 9, effort: 10, palette: false, adaptiveFiltering: true })
              .toBuffer();

      await writeFile(absolute(target), logoOptimized);
      await logoPage.close();
      console.log(`rendered ${target} (${logoOptimized.length} bytes, transparent mark)`);
    }
  }
} finally {
  await browser.close();
}

if (asked.length > 0) {
  console.log(`rendered only ${asked.join(", ")}: the record is left as it is.`);
} else {
  await writeFile(
    absolute(recordPath),
    `${JSON.stringify(
      {
        width: social.width,
        height: social.height,
        states,
        planned: roadmap.filter((row) => row.state === "Planned").map((row) => row.reference),
        roadmap,
        graphics: written,
        social: {
          name: "Cited",
          tagline: banner.tagline,
          byline: "by Katalis",
          file: social.dark,
          width: social.width,
          height: social.height,
        },
        logo: { file: logo.light, dark: logo.dark, alt: logo.alt },
        font,
        tokens,
        artDirection: {
          decision: 10,
          darkMaximum: 0.3,
          lightMinimum: 0.8,
          minimumFontSize,
          minimumHeadline,
          minimumArtShare,
          maximumEmptyBand,
          minimumContrast,
        },
        commands: {
          ingest: ingestCommand,
          search: searchCommand,
          provider: "EMBEDDINGS_PROVIDER=fake",
        },
        demo: {
          exitCode: 0,
          ingest: { command: ingestCommand, output: ingest },
          search: { command: searchCommand, output: search },
          drawn: {
            ingest: drawn.ingest.drawn.split("\n"),
            search: drawn.search.drawn.split("\n"),
          },
        },
      },
      null,
      2,
    )}\n`,
  );

  console.log(`wrote ${recordPath}`);
}

for (const readme of ["README.md", "README.es.md"]) {
  const patched = patchReadmeQuickStart(readFileSync(absolute(readme), "utf8"), drawn);

  await writeFile(absolute(readme), patched.text);
  console.log(`updated the quick start of ${readme}`);
}
if (existsSync(absolute(".data/katalis.sqlite"))) {
  console.log("the store of the run lives in .data/katalis.sqlite, which git ignores");
}
