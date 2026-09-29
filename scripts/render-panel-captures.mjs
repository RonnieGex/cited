import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

// The captures of `provider-keys-in-panel` for the delivery and for `docs/admin.md`. The page is the real one, served
// by `npm run start`; the provider is the local double this script serves on port 3216, which is the only provider
// that is ever called. No real key is written in a capture: the key of the good case is a string of the test.
//
//   # the panel that owns its provider (no CHAT_PROVIDER, no EMBEDDINGS_PROVIDER)
//   ENCRYPTION_KEY=<32 bytes of base64> ADMIN_PASSWORD=<the password> ADMIN_SESSION_SECRET=<the secret> \
//     DATABASE_URL=.data/captures.sqlite OPENAI_BASE_URL=http://127.0.0.1:3216/v1 TRUST_PROXY=1 \
//     npm run start -- --port 3220
//   node scripts/render-panel-captures.mjs panel docs/images/admin http://127.0.0.1:3220 <the password>
//
//   # the same page when the server sets the providers: CHAT_PROVIDER=fake EMBEDDINGS_PROVIDER=fake
//   node scripts/render-panel-captures.mjs server docs/images/admin http://127.0.0.1:3223 <the password>
//
// Every capture gets its own page with its own viewport: resizing the window of a page and navigating it in the same
// step aborts the navigation in Chromium.

const mode = process.argv[2] ?? "panel";
const target = process.argv[3] ?? "docs/images/admin";
const base = process.argv[4] ?? "http://127.0.0.1:3220";
const password = process.argv[5] ?? "";
const goodKey = "sk-buena-0000000000007788";
const badKey = "sk-rechazada-0000000000000001";
const doublePort = 3216;
const wide = { suffix: "1440", width: 1440, height: 900 };
const narrow = { suffix: "375", width: 375, height: 812 };
const sizes = [wide, narrow];

const strings = {
  passwordLabel: "Password",
  signIn: "Sign in",
  navAi: "AI and keys",
  providerLabel: "Provider",
  keyLabel: "API key",
  testKey: "Test",
  saveKey: "Save",
  answers: "Answers",
  meaning: "Meaning search",
  keyword: "Use search by words",
};

function providerDouble() {
  return createServer((request, response) => {
    const chunks = [];

    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      response.setHeader("content-type", "application/json");

      if ((request.headers.authorization ?? "") === `Bearer ${goodKey}`) {
        response.writeHead(200);
        response.end(
          JSON.stringify({
            id: "chatcmpl-doble",
            object: "chat.completion",
            created: 1_700_000_000,
            model: "gpt-4o-mini",
            choices: [
              { index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" },
            ],
          }),
        );

        return;
      }

      response.writeHead(401);
      response.end(
        JSON.stringify({
          error: { message: "Incorrect API key provided", code: "invalid_api_key" },
        }),
      );
    });
  });
}

mkdirSync(resolve(target), { recursive: true });

const double = providerDouble();
const browser = await chromium.launch();

async function panelPage(size) {
  const page = await browser.newPage({
    viewport: { width: size.width, height: size.height },
  });

  await page.goto(`${base}/admin`);
  await page.getByLabel(strings.passwordLabel).fill(password);
  await page.getByRole("button", { name: strings.signIn }).click();
  // The sign in reloads the page, so the wait is for something only the panel carries: navigating before that reload
  // ends aborts the navigation.
  await page.getByRole("link", { name: strings.navAi }).waitFor();

  return page;
}

async function capture(name, size, prepare, route = "/admin/ai") {
  const page = await panelPage(size);

  await page.goto(`${base}${route}`);
  await page.getByRole("heading", { level: 1 }).waitFor();

  if (prepare !== undefined) {
    await prepare(page);
  }

  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(target, name), fullPage: true });
  await page.close();
  console.log(`rendered ${name} (${size.width}px wide)`);
}

// The save confirms itself inline, as every action of the panel does; the capture shows the card the page renders
// from the store on the next visit, which is the state the owner comes back to. A second capture of the same state
// finds the provider already connected and leaves it alone.
async function connectGood(page) {
  const answers = page.getByRole("region", { name: strings.answers });

  if ((await answers.getByLabel(strings.providerLabel).count()) === 0) {
    return;
  }

  await answers.getByLabel(strings.providerLabel).selectOption("openai");
  await answers.getByLabel(strings.keyLabel).fill(goodKey);
  await answers.getByRole("button", { name: strings.testKey }).click();
  await answers.getByRole("button", { name: strings.saveKey }).click();
  await page.getByText(/••••/).first().waitFor();
  await page.goto(`${base}/admin/ai`);
  await page.getByRole("heading", { level: 1 }).waitFor();
}

async function rejectBadKey(page) {
  await page.getByRole("region", { name: strings.answers }).getByLabel(strings.providerLabel).selectOption("openai");
  await page.getByRole("region", { name: strings.answers }).getByLabel(strings.keyLabel).fill(badKey);
  await page.getByRole("region", { name: strings.answers }).getByRole("button", { name: strings.testKey }).click();
  await page.getByRole("alert").first().waitFor();
}

async function chooseKeyword(page) {
  const meaning = page.getByRole("region", { name: strings.meaning });

  if ((await meaning.getByRole("button", { name: strings.keyword }).count()) === 0) {
    return;
  }

  await meaning.getByRole("button", { name: strings.keyword }).click();
  await page.getByRole("status").first().waitFor();
  await page.goto(`${base}/admin/ai`);
  await page.getByRole("heading", { level: 1 }).waitFor();
}

try {
  await new Promise((ready) => {
    double.listen(doublePort, "127.0.0.1", ready);
  });

  if (mode === "server") {
    for (const size of sizes) {
      await capture(`ai-keys-server-${size.suffix}.png`, size);
    }
  } else {
    // The page "For the installer" is captured at the width of a laptop: it is the page whoever installs reads.
    await capture("installer-1440.png", wide, undefined, "/admin");

    // Nothing connected yet: the list of providers with one honest line each and the offer of Katalis under it.
    for (const size of sizes) {
      await capture(`ai-keys-${size.suffix}.png`, size);
    }

    // A key the provider rejects, said in words next to the field and never in a modal.
    for (const size of sizes) {
      await capture(`ai-keys-rejected-${size.suffix}.png`, size, rejectBadKey);
    }

    // The connected provider: the model, the last four characters and the last test with its latency.
    for (const size of sizes) {
      await capture(`ai-keys-connected-${size.suffix}.png`, size, connectGood);
    }

    // The meaning search in keyword mode: connected without a key.
    await capture("ai-keys-keyword-1440.png", wide, chooseKeyword);
  }
} finally {
  await browser.close();
  await new Promise((closed) => {
    double.closeAllConnections();
    double.close(() => {
      closed();
    });
  });
}
