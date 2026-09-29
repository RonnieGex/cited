import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "@playwright/test";

// The one image of the README that is not drawn: a real capture of the public chat with an answer and its open
// citation. It needs the application running with the corpus of `samples/` ingested and the deterministic providers,
// which is the same server the delivery captures use:
//
//   EMBEDDINGS_PROVIDER=fake CHAT_PROVIDER=fake DATABASE_URL=.data/step-6.sqlite npm run start -- --port 3200
//   node scripts/render-readme-captures.mjs [http://127.0.0.1:3200]

const root = resolve(import.meta.dirname, "..");
const base = process.argv[2] ?? "http://127.0.0.1:3200";
const target = "docs/images/chat-page.png";
const question = "¿Cuánto cuesta la afinación de una bicicleta?";
const viewport = { width: 1280, height: 900 };

mkdirSync(dirname(resolve(root, target)), { recursive: true });

const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const response = await page.goto(`${base}/`);

  if (response?.status() !== 200) {
    throw new Error(`${base}/ answered ${response?.status()}: start the app first.`);
  }

  await page.getByLabel("Your question").fill(question);
  await page.getByRole("button", { name: "Ask" }).click();
  await page.getByRole("button", { name: "Citation 1" }).click();
  await page.locator('[data-cited="citation"]').waitFor();
  await page.evaluate(() => document.fonts.ready);

  const png = await page.screenshot({ type: "png", fullPage: true });

  writeFileSync(resolve(root, target), png);
  console.log(`wrote ${target} (${png.length} bytes)`);

  await page.close();
} finally {
  await browser.close();
}
