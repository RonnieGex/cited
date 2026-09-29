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
// The password is read from the environment and is never printed, and it is only sent to the machine itself: with a
// password the base URL must be localhost, 127.0.0.1 or [::1]. Without it only the pages that need no session are
// captured. The default question has no amount in its answer, so no capture shows money (CAPTURE_QUESTION changes it).

const target = process.argv[2];
const base = (process.argv[3] ?? "http://localhost:3300").replace(/\/$/, "");
const password = process.env.ADMIN_PASSWORD ?? "";
const question = process.env.CAPTURE_QUESTION ?? "When are you open on Saturday?";
const sizes = [
  { suffix: "1440", width: 1440, height: 900 },
  { suffix: "375", width: 375, height: 812 },
];

if (target === undefined) {
  throw new Error("The first argument is the directory of the captures.");
}

if (password.length > 0 && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname) === false) {
  throw new Error(`ADMIN_PASSWORD is only sent to this machine: ${new URL(base).origin} is not localhost or 127.0.0.1.`);
}

const directory = resolve(target);

mkdirSync(directory, { recursive: true });

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  // The entrance motion of the page lands before the shot: the capture shows the state a reader ends up looking at. Every
  // animation that ends is awaited (the waiting bar loops, so it is left out), as in `render-readme-captures.mjs`.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

async function shot(page, name, size, options = {}) {
  await page.setViewportSize({ width: size.width, height: size.height });

  if (options.scrollTo !== undefined) {
    await page.locator(options.scrollTo).first().scrollIntoViewIfNeeded();
  }

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

  // On a phone the ask form sticks to the foot of the screen, so a full-page shot paints it over the open citation: the
  // 375 shot is the screen a reader sees with the citation scrolled into view.
  for (const size of sizes) {
    await shot(
      page,
      "public-answer",
      size,
      size.width < 768 ? { fullPage: false, scrollTo: '[data-cited="citation"]' } : {},
    );
  }

  await page.goto(`${base}/embed`);
  for (const size of sizes) {
    await shot(page, "embed", size);
  }

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
