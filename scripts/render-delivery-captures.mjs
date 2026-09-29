import { createServer } from "node:http";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

// The captures the delivery of a change shows. Everything here comes from the real thing: the pages are screenshots of
// the application served by `npm run start` with the deterministic providers and the corpus of `samples/` ingested, the
// widget is the real `public/widget.js` loaded by a shop page that this script serves from an origin the app allows,
// and the README is the HTML GitHub itself renders from `README.md`, with its relative images pointing at the files of
// this worktree, which is why the preview file is written at the root of the repository and read as a `file://`
// address.
//
//   EMBEDDINGS_PROVIDER=fake CHAT_PROVIDER=fake DATABASE_URL=.data/step-6.sqlite \
//     ALLOWED_ORIGINS=http://127.0.0.1:3210 npm run start -- --port 3200
//   node scripts/render-delivery-captures.mjs <the directory of the captures> [http://127.0.0.1:3200]

const root = resolve(import.meta.dirname, "..");
const target = process.argv[2];
const base = process.argv[3] ?? "http://127.0.0.1:3200";
const preview = resolve(root, ".readme-preview.html");
const github = "https://api.github.com/markdown";
const widgetSitePort = 3210;
const widgetSite = `http://127.0.0.1:${widgetSitePort}`;

const question = "¿Cuánto cuesta la afinación de una bicicleta?";

if (target === undefined) {
  throw new Error("The first argument is the directory of the captures.");
}

mkdirSync(target, { recursive: true });

async function capture(browser, url, name, width, height, fullPage = true) {
  const page = await browser.newPage({ viewport: { width, height } });

  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);

  await page.screenshot({ path: resolve(target, name), fullPage });
  console.log(`rendered ${name} (${width}px wide)`);
  await page.close();
}

async function captureKit(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const response = await page.goto(`${base}/kit`);

  if (response?.status() !== 200) {
    throw new Error(`${base}/kit answered ${response?.status()}: start the app first.`);
  }

  for (const shot of [
    { name: "kit-1440.png", width: 1440, height: 900 },
    { name: "kit-375.png", width: 375, height: 812 },
  ]) {
    await page.setViewportSize({ width: shot.width, height: shot.height });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: resolve(target, shot.name), fullPage: true });
    console.log(`rendered ${shot.name} (${shot.width}px wide)`);
  }

  await page.close();
}

async function capturePublic(browser) {
  for (const size of [
    { suffix: "1440", width: 1440, height: 900 },
    { suffix: "375", width: 375, height: 812 },
  ]) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });

    await page.goto(`${base}/`);
    await page.getByLabel("Your question").fill(question);
    await page.getByRole("button", { name: "Ask" }).click();
    await page.getByRole("button", { name: "Citation 1" }).click();
    await page.locator('[data-cited="citation"]').waitFor();
    await page.evaluate(() => document.fonts.ready);

    await page.screenshot({ path: resolve(target, `public-${size.suffix}.png`), fullPage: true });
    console.log(`rendered public-${size.suffix}.png (${size.width}px wide)`);
    await page.close();
  }
}

async function captureEmbed(browser) {
  for (const size of [
    { suffix: "1440", width: 1440, height: 900 },
    { suffix: "375", width: 375, height: 812 },
  ]) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });

    await page.goto(`${base}/embed`);
    await page.getByLabel("Your question").fill(question);
    await page.getByRole("button", { name: "Ask" }).click();
    await page.locator('[data-cited="answer"]').first().waitFor();
    await page.evaluate(() => document.fonts.ready);

    await page.screenshot({ path: resolve(target, `embed-${size.suffix}.png`), fullPage: true });
    console.log(`rendered embed-${size.suffix}.png (${size.width}px wide)`);
    await page.close();
  }
}

function shopPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Bike workshop of the test</title>
    <style>
      body { margin: 0; padding: 48px; background: #fafaf9; color: #171717; font-family: system-ui, sans-serif; }
      h1 { font-size: 40px; }
      p { font-size: 18px; max-width: 60ch; }
    </style>
  </head>
  <body>
    <h1>The bike workshop of the test</h1>
    <p>A page of a customer of Cited, from an origin that ALLOWED_ORIGINS accepts.</p>
    <script src="${base}/widget.js"></script>
  </body>
</html>
`;
}

async function captureWidget(browser) {
  const server = createServer((request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(shopPage());
  });

  await new Promise((ready) => {
    server.listen(widgetSitePort, "127.0.0.1", ready);
  });

  try {
    for (const size of [
      { suffix: "1440", width: 1440, height: 900 },
      { suffix: "375", width: 375, height: 812 },
    ]) {
      const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });

      await page.goto(widgetSite);
      await page.getByRole("button", { name: "Ask us" }).click();

      const chat = page.frameLocator("iframe");

      await chat.getByLabel("Your question").fill(question);
      await chat.getByRole("button", { name: "Ask" }).click();
      await chat.locator('[data-cited="answer"]').first().waitFor();
      await page.evaluate(() => document.fonts.ready);

      await page.screenshot({ path: resolve(target, `widget-${size.suffix}.png`) });
      console.log(`rendered widget-${size.suffix}.png (${size.width}px wide)`);
      await page.close();
    }
  } finally {
    server.close();
  }
}

async function captureReadme(browser) {
  const markdown = readFileSync(resolve(root, "README.md"), "utf8");
  const answered = await fetch(github, {
    method: "POST",
    headers: { accept: "application/vnd.github+json", "content-type": "application/json" },
    body: JSON.stringify({ text: markdown, mode: "gfm", context: "RonnieGex/cited" }),
  });

  if (answered.ok === false) {
    throw new Error(`The GitHub Markdown API answered ${answered.status}: ${await answered.text()}`);
  }

  const rendered = await answered.text();

  // GitHub returns the body of the README and nothing else: no ground, no width. The rules below paint the ground of
  // each color scheme, so that the light variant and the dark variant can both be seen, and keep a 1280 px image
  // inside the window. `height` is left alone on purpose: the flame of the foot carries `height="48"` and that
  // attribute is what sizes it.
  const painted = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>README.md, as GitHub renders it</title>
    <style>
      :root { color-scheme: light dark; }
      body { margin: 0; padding: 24px; background: #ffffff; color: #171717; font-family: system-ui, sans-serif; }
      img { max-width: 100%; }
      @media (prefers-color-scheme: dark) { body { background: #171717; color: #f7f6f2; } }
    </style>
  </head>
  <body>
${rendered}
  </body>
</html>
`;

  writeFileSync(preview, painted);

  for (const scheme of ["light", "dark"]) {
    const readme = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      colorScheme: scheme,
    });

    await readme.goto(`file:///${preview.replaceAll("\\", "/")}`, { waitUntil: "load" });
    await readme.evaluate(() => document.fonts.ready);
    await readme.waitForTimeout(400);

    await readme.evaluate(() => window.scrollTo(0, 0));
    await readme.screenshot({ path: resolve(target, `readme-primera-pantalla-${scheme}.png`) });
    console.log(`rendered readme-primera-pantalla-${scheme}.png`);

    await readme.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await readme.waitForTimeout(200);
    await readme.screenshot({ path: resolve(target, `readme-pie-${scheme}.png`) });
    console.log(`rendered readme-pie-${scheme}.png`);

    await readme.close();
  }
}

const browser = await chromium.launch();

try {
  await captureKit(browser);
  await capturePublic(browser);
  await captureEmbed(browser);
  await captureWidget(browser);
  await captureReadme(browser);
} finally {
  await browser.close();
  rmSync(preview, { force: true });
}
