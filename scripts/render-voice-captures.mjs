// The captures of the voice panel that the delivery of `elevenlabs-voice-agent` shows. Everything in them is the real
// interface: the public page served by `npm run start`, the ported panel, the ported Orb with the local texture, the
// words in English and the citation chips of a real `mostrar_fuentes` call. The conversation transport is the test SDK
// of `tests/fakes/elevenlabs-react.tsx`, which is what `npm run build:e2e` resolves in place of `@elevenlabs/react`:
// no test and no capture of this repository opens a session against ElevenLabs.
//
//   npm run build:e2e
//   EMBEDDINGS_PROVIDER=fake CHAT_PROVIDER=fake npm start -- --port 3200
//   node scripts/render-voice-captures.mjs <the directory of the captures> [http://127.0.0.1:3200]
//
// Chromium is launched with its fake capture device, because the microphone is what opens a session.

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const target = process.argv[2];
const base = process.argv[3] ?? "http://127.0.0.1:3200";
const signedUrl = "wss://api.elevenlabs.io/v1/convai/conversation?signed=captura";

if (target === undefined) {
  throw new Error("The first argument is the directory of the captures.");
}

mkdirSync(target, { recursive: true });

const sizes = [
  { suffix: "1440", width: 1440, height: 900 },
  { suffix: "375", width: 375, height: 812 },
];

const browser = await chromium.launch({
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});

try {
  for (const size of sizes) {
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      permissions: ["microphone"],
    });
    const page = await context.newPage();

    await page.route("**/api/voice/signed-url", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: signedUrl }),
      }),
    );

    const response = await page.goto(base);

    if (response?.status() !== 200) {
      throw new Error(`${base} answered ${response?.status()}: start the application first.`);
    }

    await page.getByTestId("voice-launcher").click();

    const panel = page.getByTestId("voice-panel");

    await panel.waitFor();
    await page.getByTestId("voice-start").click();

    try {
      await page.getByTestId("voice-state").filter({ hasText: "I'm listening" }).waitFor({ timeout: 15_000 });
    } catch (error) {
      const state = await page.getByTestId("voice-state").textContent();
      const failure = await page
        .getByTestId("voice-error")
        .textContent()
        .catch(() => "(no error line)");

      console.error(`the session did not open: state "${state}", error "${failure}"`);
      throw error;
    }

    await page.evaluate(() => {
      const api = window.__katalisVoiceFake;

      if (api === undefined) {
        throw new Error("the build does not carry the test SDK: run npm run build:e2e");
      }

      api.emitMessage({ message: "How much is a tune-up?", source: "user" });
      api.emitMessage({
        message: "A tune-up of a bicycle costs 380 pesos. [1]",
        source: "ai",
      });
      api.callTool("mostrar_fuentes", {
        fuentes: [
          { titulo: "cafe-la-horquilla.md · Precios", url: "/#cita-1" },
          { titulo: "bike-workshop-policies.md · Guarantee", url: "/#cita-2" },
          { titulo: "Ajeno", url: "https://otro.example/#cita-1" },
        ],
      });
      api.setMode("speaking");
      api.setSpeaking(true);
    });

    await page.getByTestId("voice-source").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    // The chunk of the Orb arrives on demand and three.js fades the sphere in over a few frames.
    await page.waitForTimeout(2500);

    await page.screenshot({
      path: resolve(target, `voice-${size.suffix}.png`),
      fullPage: true,
    });
    await panel.screenshot({ path: resolve(target, `voice-panel-${size.suffix}.png`) });
    console.log(`rendered voice-${size.suffix}.png and voice-panel-${size.suffix}.png (${size.width}px wide)`);

    await context.close();
  }
} finally {
  await browser.close();
}
