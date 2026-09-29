import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

// Captures of the real interface, for the review of a change and for the README: the public page with an answer and its
// open citation, the embed, the sign in, the panel and the kit, each at 1440 and 375 px. Everything is a screenshot of the
// application that is already running (`npm run dev` or `npm run start`) with the deterministic providers and the
// corpus of `samples/` ingested; nothing is drawn by hand.
//
//   ADMIN_PASSWORD=<the password of the running app> node scripts/capture-ui.mjs <directory> [http://localhost:3300]
//
// The password is read from the environment and is never printed. Without it only the pages that need no session are
// captured.

const target = process.argv[2];
const base = (process.argv[3] ?? "http://localhost:3300").replace(/\/$/, "");
const password = process.env.ADMIN_PASSWORD ?? "";
const question = process.env.CAPTURE_QUESTION ?? "How much does a late cancellation cost?";
const sizes = [
  { suffix: "1440", width: 1440, height: 900 },
  { suffix: "375", width: 375, height: 812 },
];

if (target === undefined) {
  throw new Error("The first argument is the directory of the captures.");
}

const directory = resolve(target);

mkdirSync(directory, { recursive: true });

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  // The entrance motion of the page lands before the shot: the capture shows the state a reader ends up looking at.
  await page.waitForTimeout(1200);
}

async function shot(page, name, size, options = {}) {
  await page.setViewportSize({ width: size.width, height: size.height });
  await settle(page);
  await page.screenshot({ path: resolve(directory, `${name}-${size.suffix}.png`), fullPage: options.fullPage ?? true });
  console.log(`rendered ${name}-${size.suffix}.png`);
}

async function ask(page) {
  await page.getByRole("textbox").first().fill(question);
  await page.getByRole("button", { name: /^(ask|preguntar)$/i }).click();
  await page.locator('[data-cited="answer"]').first().waitFor({ timeout: 20_000 });
}

const browser = await chromium.launch();

try {
  const guest = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await guest.newPage();

  for (const size of sizes) {
    await page.goto(`${base}/admin`);
    await shot(page, "signin", size, { fullPage: false });
  }

  await page.goto(`${base}/`);
  for (const size of sizes) {
    await shot(page, "public-empty", size);
  }

  await ask(page);
  await page.getByRole("button", { name: /^(citation|cita) 1$/i }).first().click();

  for (const size of sizes) {
    await shot(page, "public-answer", size);
  }

  await page.goto(`${base}/embed`);
  await shot(page, "embed", sizes[0]);
  await page.goto(`${base}/kit`);
  for (const size of sizes) {
    await shot(page, "kit", size);
  }

  await guest.close();

  if (password.length === 0) {
    console.log("no ADMIN_PASSWORD: the panel was not captured");
  } else {
    const owner = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const login = await owner.request.post(`${base}/api/admin/login`, {
      headers: { origin: new URL(base).origin, "content-type": "application/json" },
      data: { password },
    });

    if (login.ok() === false) {
      throw new Error(`the sign in answered ${login.status()}`);
    }

    const panel = await owner.newPage();

    for (const [name, path] of [
      ["panel-setup", "/admin"],
      ["panel-business", "/admin/business"],
      ["panel-documents", "/admin/documents"],
      ["panel-conversations", "/admin/conversations"],
      ["panel-ai", "/admin/ai"],
    ]) {
      const response = await panel.goto(`${base}${path}`);

      if (response?.status() !== 200) {
        console.log(`${path} answered ${response?.status()}: skipped`);
        continue;
      }

      for (const size of sizes) {
        await shot(panel, name, size);
      }
    }

    await owner.close();
  }
} finally {
  await browser.close();
}
