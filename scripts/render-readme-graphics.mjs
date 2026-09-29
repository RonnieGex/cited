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
const ingestCommand = "npm run ingest -- samples/";
const searchQuestion = "¿Cuánto cuesta una afinación de bicicleta?";
const searchCommand = `npm run search -- "${searchQuestion}"`;
const maximumLine = 116;
const font = {
  name: "Outfit",
  source: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap",
  loadedAtRenderTime: true,
  fileInRepository: false,
};

const absolute = (relative) => resolve(root, relative);

const themes = {
  dark: {
    theme: "dark",
    background: tokens.ink,
    text: tokens.offWhite,
    muted: "rgba(247, 246, 242, 0.62)",
    mutedSoft: "rgba(247, 246, 242, 0.38)",
    hairline: "rgba(247, 246, 242, 0.16)",
    panel: "rgba(247, 246, 242, 0.06)",
    panelStrong: "rgba(247, 246, 242, 0.10)",
    header: "rgba(23, 23, 23, 0.72)",
    glow: "rgba(221, 244, 105, 0.12)",
    onLime: tokens.ink,
    onInk: tokens.ink,
    markOutline: "0.6px rgba(23, 23, 23, 0.9)",
  },
  light: {
    theme: "light",
    background: tokens.offWhite,
    text: tokens.ink,
    muted: "rgba(23, 23, 23, 0.66)",
    mutedSoft: "rgba(23, 23, 23, 0.42)",
    hairline: "rgba(23, 23, 23, 0.16)",
    panel: "rgba(23, 23, 23, 0.04)",
    panelStrong: "rgba(23, 23, 23, 0.07)",
    header: "rgba(23, 23, 23, 0.06)",
    glow: "rgba(221, 244, 105, 0.30)",
    onLime: tokens.ink,
    onInk: tokens.ink,
    markOutline: "1.6px #171717",
  },
};

const styles = `
.page {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 40px 52px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  row-gap: 22px;
}
.page.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  padding: 30px 52px;
}
.head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.headline {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.15;
}
.headline.big {
  font-size: 46px;
}
.sub {
  font-size: 15px;
  font-weight: 300;
  max-width: 720px;
  opacity: 0.75;
  line-height: 1.5;
}
.card {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 30px 28px 26px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card .headline {
  font-size: 30px;
}
.card .body {
  font-size: 16px;
  font-weight: 300;
  line-height: 1.45;
  opacity: 0.82;
}
.card .art {
  width: 100%;
  height: auto;
}
.stroke-strong {
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.stroke-soft {
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.34;
}
.stroke-ink {
  stroke: ${tokens.ink};
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.stroke-paper {
  stroke: ${tokens.offWhite};
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.stroke-lime {
  stroke: ${tokens.lime};
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.fill-lime {
  fill: ${tokens.lime};
}
.fill-lime-soft {
  fill: ${tokens.lime};
  opacity: 0.4;
}
.fill-ink {
  fill: ${tokens.ink};
}
.fill-paper {
  fill: ${tokens.offWhite};
}
.glow-soft {
  opacity: 0.9;
}
.wave {
  fill: none;
}
.card .mark {
  font-family: Outfit, sans-serif;
  font-size: 16px;
  font-weight: 700;
  fill: ${tokens.ink};
  text-anchor: middle;
}
.pipeline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  align-self: center;
}
.node {
  position: relative;
  flex: none;
  width: 200px;
  padding: 18px 16px;
  border: 1px solid var(--hairline);
  border-radius: 14px;
  background: var(--panel);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.node-index {
  font-size: 13px;
  font-weight: 700;
  color: ${tokens.lime};
  -webkit-text-stroke: var(--mark-outline);
}
.node-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}
.node-sub {
  font-size: 13px;
  font-weight: 300;
  opacity: 0.68;
  line-height: 1.35;
}
.node-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}
.tag {
  padding: 3px 9px 2px;
  border-radius: 999px;
  border: 1px solid var(--hairline);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  opacity: 0.8;
}
.node-answer {
  background: var(--panel-strong);
}
.node-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.node-top .next {
  padding: 2px 9px 1px;
  font-size: 11px;
}
.arrow {
  flex: none;
  width: 26px;
  height: 12px;
}
.foot {
  display: flex;
  align-items: center;
  gap: 14px;
  align-self: end;
}
.foot-text {
  font-size: 15px;
  font-weight: 300;
  opacity: 0.72;
}
.next {
  border: 1px solid ${tokens.ink};
  box-shadow: 0 1px 0 0 rgba(23, 23, 23, 0.2);
}
.next.floating {
  position: absolute;
  top: 26px;
  right: 26px;
}
.pipeline .next.floating,
.node .next.floating {
  position: static;
  align-self: flex-start;
  padding: 2px 9px 1px;
  font-size: 11px;
}
.node {
  padding-right: 20px;
}
.terminal {
  height: 100%;
  border-radius: 14px;
  border: 1px solid var(--hairline);
  background: var(--panel);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.columns {
  display: flex;
  gap: 22px;
  align-self: stretch;
  min-height: 0;
}
.columns .terminal {
  flex: 1;
  min-width: 0;
}
.bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  background: var(--header);
  border-bottom: 1px solid var(--hairline);
}
.light {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--muted-soft);
}
.light-a {
  background: ${tokens.lime};
  opacity: 0.85;
}
.bar-title {
  margin-left: 6px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  opacity: 0.55;
}
.screen {
  flex: 1;
  padding: 18px 22px;
  font-family: "Cascadia Mono", "Consolas", "DejaVu Sans Mono", monospace;
  font-size: 13px;
  line-height: 1.5;
  overflow: hidden;
}
.prompt {
  color: ${tokens.lime};
  font-weight: 700;
}
.prompt .sign {
  margin-right: 8px;
}
.screen .prompt {
  -webkit-text-stroke: var(--mark-outline);
}
.out {
  white-space: pre-wrap;
  margin: 6px 0 12px;
  font-size: 12px;
  line-height: 1.5;
  opacity: 0.9;
}
.cursor {
  display: inline-block;
  width: 9px;
  height: 15px;
  background: ${tokens.lime};
  transform: translateY(2px);
}
.board {
  display: flex;
  gap: 24px;
  align-self: stretch;
}
.column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.column-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 3px;
  opacity: 0.9;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.dot-available {
  background: ${tokens.lime};
  border: 1px solid ${tokens.ink};
}
.dot-planned {
  background: transparent;
  border: 1px solid currentColor;
  opacity: 0.7;
}
.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 12px;
  border: 1px solid var(--hairline);
  border-radius: 10px;
  background: var(--panel);
}
.row-available {
  border-left: 3px solid ${tokens.lime};
}
.row-capability {
  font-size: 13.5px;
  font-weight: 400;
  line-height: 1.28;
}
.row-reference {
  flex: none;
  font-family: "Cascadia Mono", "Consolas", "DejaVu Sans Mono", monospace;
  font-size: 11px;
  opacity: 0.6;
}
.orb-wrap {
  width: 186px;
  height: 186px;
}
.orb {
  width: 100%;
  height: 100%;
}
.mark-line {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.wordmark {
  font-size: 96px;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 0.92;
}
.mark-sup {
  font-size: 30px;
  font-weight: 600;
  color: ${tokens.lime};
  -webkit-text-stroke: var(--mark-outline);
  margin-top: 4px;
}
.tagline {
  font-size: 24px;
  font-weight: 300;
  opacity: 0.86;
}
.byline {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  opacity: 0.6;
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

  return fill(base, {
    ...values,
    HAIRLINE: values.hairline,
    PANEL: values.panel,
    PANEL_STRONG: values.panelStrong,
    HEADER: values.header,
    MUTED_SOFT: values.mutedSoft,
    MARK_OUTLINE: values.markOutline,
    STYLES: styles,
    CONTENT: content,
    WIDTH: width,
    HEIGHT: height,
  });
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
    .map(
      (row) =>
        `<div class="row${state === "Available" ? " row-available" : ""}"><span class="row-capability">${escapeHtml(
          row.capability,
        )}</span><span class="row-reference">${escapeHtml(row.reference)}</span></div>`,
    )
    .join("\n      ");
}

async function render(browser, graphic, content, theme, target) {
  const page = await browser.newPage({
    viewport: { width: graphic.width, height: graphic.height },
    deviceScaleFactor: 1,
  });

  await page.setContent(html(content, theme, graphic.width, graphic.height), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  const loaded = await page.evaluate(() => document.fonts.check('600 34px "Outfit"'));

  if (!loaded) {
    throw new Error(`The Outfit font did not load for ${graphic.name} (${theme}).`);
  }

  mkdirSync(dirname(absolute(target)), { recursive: true });

  const png = await page.screenshot({ type: "png" });
  const optimized =
    sharp === null
      ? png
      : await sharp(png).png({ palette: true, colors: 128, compressionLevel: 9 }).toBuffer();

  await writeFile(absolute(target), optimized);
  await page.close();
  console.log(`rendered ${target} (${optimized.length} bytes)`);
}

const banner = JSON.parse(readFileSync(absolute(bannerRecordPath), "utf8"));
const templatesOf = new Map(
  await Promise.all(
    [...graphics, social, logo].map(async (graphic) => [
      graphic.name,
      await readFile(absolute(`${templates}/${graphic.template}`), "utf8"),
    ]),
  ),
);

const ingest = withoutNpmNoise(run("npm", ["run", "ingest", "--", "samples/"]));
const search = withoutNpmNoise(run("npm", ["run", "search", "--", searchQuestion]));
const drawn = {
  ingest: {
    command: ingestCommand,
    output: ingest,
    drawn: terminalLines(ingest, 8),
    readme: ingest,
  },
  search: {
    command: searchCommand,
    output: search,
    drawn: terminalLines(search, 15),
    readme: search,
  },
};
const contents = new Map(
  [...graphics, social].map((graphic) => [
    graphic.name,
    fill(templatesOf.get(graphic.name), {
      INGEST_COMMAND: escapeHtml(ingestCommand),
      INGEST_OUTPUT: escapeLines(drawn.ingest.drawn),
      SEARCH_COMMAND: escapeHtml(searchCommand),
      SEARCH_OUTPUT: escapeLines(drawn.search.drawn),
      AVAILABLE_ROWS: rowsOf("Available"),
      PLANNED_ROWS: rowsOf("Planned"),
      TAGLINE: escapeHtml(banner.tagline),
    }),
  ]),
);

const browser = await chromium.launch();
const written = [];

try {
  for (const graphic of graphics) {
    for (const theme of ["dark", "light"]) {
      await render(browser, graphic, contents.get(graphic.name), theme, graphic[theme]);
    }

    written.push({
      name: graphic.name,
      dark: graphic.dark,
      light: graphic.light,
      width: graphic.width,
      height: graphic.height,
      shows: graphic.shows,
      label: graphic.label,
      alt: graphic.alt,
    });
  }

  await render(browser, social, contents.get(social.name), "dark", social.dark);

  for (const theme of ["light", "dark"]) {
    const logoPage = await browser.newPage({
      viewport: { width: 340, height: 170 },
      deviceScaleFactor: 1,
    });
    const target = theme === "dark" ? logo.dark : logo.light;

    await logoPage.setContent(html(templatesOf.get(logo.name), theme, 340, 170), { waitUntil: "load" });
    await logoPage.evaluate(() => document.fonts.ready);
    await logoPage.evaluate((value) => {
      document.body.dataset["theme"] = value;
    }, theme);

    const logoPng = await logoPage.locator(".logo").screenshot({ type: "png" });
    const logoOptimized =
      sharp === null
        ? logoPng
        : await sharp(logoPng).png({ palette: true, colors: 64, compressionLevel: 9 }).toBuffer();

    await writeFile(absolute(target), logoOptimized);
    await logoPage.close();
    console.log(`rendered ${target} (${logoOptimized.length} bytes)`);
  }
} finally {
  await browser.close();
}

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

for (const readme of ["README.md", "README.es.md"]) {
  const patched = patchReadmeQuickStart(readFileSync(absolute(readme), "utf8"), drawn);

  await writeFile(absolute(readme), patched.text);
  console.log(`updated the quick start of ${readme}`);
}
if (existsSync(absolute(".data/katalis.sqlite"))) {
  console.log("the store of the run lives in .data/katalis.sqlite, which git ignores");
}
