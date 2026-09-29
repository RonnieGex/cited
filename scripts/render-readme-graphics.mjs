import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { roadmap, states, statusRows, tokens } from "./readme-graphics/data.mjs";
import { outfit, outfitFace } from "./readme-graphics/font.mjs";
import { assertHonestRecord } from "./readme-graphics/honesty.mjs";
import { graphics, social } from "./readme-graphics/manifest.mjs";
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
const askCommand = `EMBEDDINGS_PROVIDER=fake CHAT_PROVIDER=fake npm run ask -- "${searchQuestion}"`;
const maximumLine = 112;
const minimumFontSize = 16;
const minimumHeadline = { wide: 44, card: 30 };
const minimumArtShare = 0.4;
const maximumEmptyBand = 0.25;
const minimumContrast = 4.5;
const terminalMaximum = 0.3;
const maximumRoadmapHeight = 720;
const font = {
  name: outfit.name,
  source: outfit.subset,
  license: outfit.license,
  loadedAtRenderTime: true,
  fileInRepository: true,
};

// The mark of the maker (design decision 3): the flame of `public/brand/` beside `by Katalis` in the social preview,
// the same flame the banner and the foot of the README use. It is embedded as a data URI because the pages are set
// with `setContent` and have no base address. Section 10 of the contract: at the height of the line the mark measured
// 20 px and did not read as the flame of Katalis, so the styles of this script draw it at 68 px and the render fails
// below 64.
const flame = {
  dark: "public/brand/katalis-flame-192.png",
  ink: "public/brand/katalis-flame-ink-192.png",
  minimumHeight: 64,
  where: "beside the by Katalis line, to its left, taller than the line",
};

const absolute = (relative) => resolve(root, relative);
const dataUri = (path) => `data:image/png;base64,${readFileSync(absolute(path)).toString("base64")}`;

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
    BAR_BACKGROUND: "rgba(247, 246, 242, 0.05)",
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
    BAR_BACKGROUND: "rgba(247, 246, 242, 0.05)",
    BAR_TEXT: "rgba(247, 246, 242, 1)",
    BAR_DOT: "rgba(247, 246, 242, 0.34)",
    TERMINAL_FILL: tokens.ink,
    TERMINAL_BORDER: "rgba(23, 23, 23, 0.35)",
    SCREEN_TEXT: tokens.offWhite,
    HIT_BACKGROUND: "transparent",
    HIT_TEXT: tokens.lime,
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
  const bar = over(theme.BAR_BACKGROUND, terminal);
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
/* The roadmap has to carry every available row of the status table inside the 720px of decision 11, and the change
   elevenlabs-voice-agent moved the voice row from the second column to the first: its board is a little denser than
   the page of every other graphic, and nothing of it goes below the 16px of the smallest text. */
.roadmap {
  padding: 28px 52px;
  gap: 18px;
}
.roadmap .column {
  gap: 7px;
}
.roadmap .row {
  padding: 6px 14px;
  gap: 2px;
}
.roadmap .row-capability {
  line-height: 1.2;
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
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--muted);
}
.byline .flame {
  display: block;
  height: 68px;
  width: auto;
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
    FONT_FACE: outfitFace(absolute),
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
      CHAT_PROVIDER: "fake",
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
    const terminal = document.querySelector(".terminal");
    const terminalBox = terminal === null ? null : terminal.getBoundingClientRect();

    return {
      smallest: sizes.length === 0 ? minimumFontSize : Math.min(...sizes),
      headlines,
      outside,
      art,
      terminal:
        terminalBox === null
          ? null
          : {
              x: terminalBox.x,
              y: terminalBox.y,
              width: terminalBox.width,
              height: terminalBox.height,
            },
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

  if (graphic.name === "roadmap" && graphic.height > maximumRoadmapHeight) {
    throw new Error(
      `${graphic.name} (${theme}) is ${graphic.height}px high; decision 11 allows ${maximumRoadmapHeight}px.`,
    );
  }

  return found;
}

async function auditFlame(page, graphic, theme) {
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
      width: mark.width,
      line: Number.parseFloat(getComputedStyle(line).fontSize),
      toTheLeft: mark.right <= text.left + 0.5,
      middle: Math.abs(mark.top + mark.height / 2 - (text.top + text.height / 2)),
      x: mark.x,
      y: mark.y,
    };
  });

  if (placed === null) {
    throw new Error(`${graphic.name} (${theme}) draws no flame beside by Katalis.`);
  }

  if (placed.height < flame.minimumHeight) {
    throw new Error(
      `${graphic.name} (${theme}) draws the flame ${placed.height}px high; the mark of the maker reads at ${flame.minimumHeight}px or more beside by Katalis.`,
    );
  }

  if (placed.toTheLeft === false) {
    throw new Error(`${graphic.name} (${theme}) draws the flame to the right of by Katalis.`);
  }

  if (placed.middle > 1) {
    throw new Error(
      `${graphic.name} (${theme}) draws the flame ${placed.middle}px away from the middle of the by Katalis line.`,
    );
  }

  console.log(
    `${graphic.name} (${theme}): the flame is ${placed.width.toFixed(1)} by ${placed.height.toFixed(1)}px beside a line of ${placed.line}px, the floor ${flame.minimumHeight}px`,
  );

  return {
    x: Math.round(placed.x * 100) / 100,
    y: Math.round(placed.y * 100) / 100,
    width: Math.round(placed.width * 100) / 100,
    height: Math.round(placed.height * 100) / 100,
    line: placed.line,
  };
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

async function meanInside(buffer, box, width, height) {
  const drawn = await sharp(buffer).ensureAlpha().raw().toBuffer();
  const left = Math.max(0, Math.min(width - 1, Math.round(box.x)));
  const top = Math.max(0, Math.min(height - 1, Math.round(box.y)));
  const right = Math.max(left + 1, Math.min(width, Math.round(box.x + box.width)));
  const bottom = Math.max(top + 1, Math.min(height, Math.round(box.y + box.height)));
  let total = 0;
  let count = 0;

  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const at = (y * width + x) * 4;

      total +=
        (0.2126 * (drawn[at] ?? 0) + 0.7152 * (drawn[at + 1] ?? 0) + 0.0722 * (drawn[at + 2] ?? 0)) /
        255;
      count += 1;
    }
  }

  return total / count;
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

  if (graphic.name === social.name) {
    flame.rendered = await auditFlame(page, graphic, theme);
  }

  mkdirSync(dirname(absolute(target)), { recursive: true });

  const png = await page.screenshot({ type: "png" });
  const allowed = Math.floor(graphic.height * maximumEmptyBand);
  let band = { length: 0, start: 0 };
  let inside = null;

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

    band = await emptyBand(png, backgrounds.get(background), graphic.width, graphic.height);

    if (band.length > allowed) {
      throw new Error(
        `${graphic.name} (${theme}) leaves ${band.length}px of empty background from y=${band.start}; the limit is ${allowed}px.`,
      );
    }

    if (audit_.terminal !== null) {
      inside = await meanInside(png, audit_.terminal, graphic.width, graphic.height);

      if (inside > terminalMaximum) {
        throw new Error(
          `${graphic.name} (${theme}) draws its terminal at ${inside.toFixed(3)}; decision 11 asks for ${terminalMaximum} or less.`,
        );
      }
    }
  }

  const optimized =
    sharp === null
      ? png
      : await sharp(png).png({ palette: true, colors: 256, compressionLevel: 9 }).toBuffer();
  const facts = [
    `${optimized.length} bytes`,
    `smallest text ${audit_.smallest}px`,
    `${audit_.headlines.length} headlines`,
    `empty band ${band.length}px of ${allowed}px`,
  ];

  if (audit_.art.length > 0) {
    facts.push(`illustration ${Math.round(Math.min(...audit_.art) * 100)}% of the card`);
  }

  if (inside !== null) {
    facts.push(`terminal luminance ${inside.toFixed(3)}`);
  }

  await writeFile(absolute(target), optimized);
  await page.close();
  console.log(`rendered ${target} (${facts.join(", ")})`);

  return audit_;
}

const asked = process.argv.slice(2);
const wanted = (name) => asked.length === 0 || asked.includes(name);
const banner = JSON.parse(readFileSync(absolute(bannerRecordPath), "utf8"));
const templatesOf = new Map(
  await Promise.all(
    [...graphics, social].map(async (graphic) => [
      graphic.name,
      await readFile(absolute(`${templates}/${graphic.template}`), "utf8"),
    ]),
  ),
);

reportContrast();

const ingest = withoutNpmNoise(run("npm", ["run", "ingest", "--", "samples/"]));
const search = withoutNpmNoise(run("npm", ["run", "search", "--", searchQuestion]));
const ask = withoutNpmNoise(run("npm", ["run", "ask", "--", searchQuestion]));
const askLines = ask.split("\n");
const askStatus = askLines.find((line) => line.startsWith("status:")) ?? "";
const askAnswer = askLines.find((line) => line.startsWith("answer:")) ?? "";
const askCitation = askLines.find((line) => /^\s*\[1\] /.test(line)) ?? "";
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
  ask: {
    command: askCommand,
    output: ask,
    drawn: [askStatus, askAnswer, askCitation].join("\n"),
    readme: ask,
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
      ASK_COMMAND: escapeHtml(askCommand),
      ASK_STATUS: escapeLines(askStatus),
      ASK_ANSWER: escapeLines(askAnswer),
      ASK_CITATION: escapeLines(askCitation),
      AVAILABLE_ROWS: rowsOf("Available"),
      PLANNED_ROWS: rowsOf("Planned"),
      TAGLINE: escapeHtml(banner.tagline),
      FLAME: dataUri(flame.dark),
    }),
  ]),
);

const browser = await chromium.launch();
const backgrounds = new Map();
const written = [];
let terminalBox = null;

try {
  for (const graphic of graphics) {
    if (wanted(graphic.name) === false) {
      continue;
    }

    for (const theme of ["dark", "light"]) {
      const measured = await render(
        browser,
        graphic,
        contents.get(graphic.name),
        theme,
        graphic[theme],
        backgrounds,
      );

      terminalBox = measured.terminal ?? terminalBox;
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
} finally {
  await browser.close();
}

if (asked.length > 0) {
  console.log(`rendered only ${asked.join(", ")}: the record is left as it is.`);
} else {
  const record = {
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
    flame,
    font,
    tokens,
    artDirection: {
      decision: 10,
      amendedBy: 11,
      darkMaximum: 0.3,
      lightMinimum: 0.8,
      terminalMaximum,
      maximumRoadmapHeight,
      minimumFontSize,
      minimumHeadline,
      minimumArtShare,
      maximumEmptyBand,
      minimumContrast,
    },
    commands: {
      ingest: ingestCommand,
      search: searchCommand,
      ask: askCommand,
      provider: "EMBEDDINGS_PROVIDER=fake",
    },
    demo: {
      exitCode: 0,
      terminal: terminalBox,
      ingest: { command: ingestCommand, output: ingest },
      search: { command: searchCommand, output: search },
      ask: { command: askCommand, output: ask },
      drawn: {
        ingest: drawn.ingest.drawn.split("\n"),
        search: drawn.search.drawn.split("\n"),
        ask: drawn.ask.drawn.split("\n"),
      },
    },
  };

  assertHonestRecord(record, recordPath);
  await writeFile(absolute(recordPath), `${JSON.stringify(record, null, 2)}\n`);

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
