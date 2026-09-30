// The Orb of the voice teaser of the README is the real one: the component of the panel (`components/ui/orb.tsx`, the
// MIT Orb of ElevenLabs UI with the local texture, in the colours of `ORB_COLORS`), captured from the running
// application instead of drawn. The panel opens with the test SDK and the agent speaks; `prefers-reduced-motion` then
// freezes the Orb on a frame (the `reducedMotion` prop of the port) and that frame is shot over black and over white.
// The two shots give back its alpha exactly: over black a pixel is its colour times its alpha, over white that plus
// one minus its alpha. Several frames are frozen that way and the one with the least white is kept, because the Orb
// ramps from the ink through the lime to white and a frame caught on a white sweep reads as a cut disc on the paper.
// Same build and server as `render-voice-captures.mjs`:
//
//   npm run build:e2e
//   EMBEDDINGS_PROVIDER=fake CHAT_PROVIDER=fake npm start -- --port 3200
//   node scripts/render-readme-orb.mjs [http://127.0.0.1:3200]
//
// It writes `docs/images/voice/orb.png` and `docs/images/voice/orb.json` (what was captured and how);
// `node scripts/render-readme-graphics.mjs voice-teaser` then lays the Orb in the teaser, on the ink and on the paper.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

// The same optional image library the graphics script uses; here the matte cannot be made without it.
const sharp = await import("sharp").then(
  (module) => module.default,
  () => {
    throw new Error("sharp is not installed: the alpha of the Orb is computed with it.");
  },
);

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2] ?? "http://127.0.0.1:3200";
const image = "docs/images/voice/orb.png";
const record = "docs/images/voice/orb.json";
const speakingMs = 4000;
const betweenMs = 900;
const frames = 8;
const signedUrl = "wss://api.elevenlabs.io/v1/convai/conversation?signed=captura";
const colors = JSON.parse(
  readFileSync(resolve(root, "components/voice/voice-config.ts"), "utf8").match(/ORB_COLORS[^=]*=\s*(\[[^\]]*\])/)[1],
);

// The Orb with its alpha from the same frame over black and over white, and the share of its sphere that is white.
async function matte(black, white) {
  const onBlack = await sharp(black).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const onWhite = await sharp(white).removeAlpha().raw().toBuffer();
  const { width, height } = onBlack.info;
  const rgba = Buffer.alloc(width * height * 4);
  const box = { top: height, bottom: -1, left: width, right: -1 };
  let sphere = 0;
  let whiteness = 0;

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    let lift = 0;

    for (let channel = 0; channel < 3; channel += 1) {
      lift += onWhite[pixel * 3 + channel] - onBlack.data[pixel * 3 + channel];
    }

    const alpha = Math.min(1, Math.max(0, 1 - lift / 3 / 255));
    let lowest = 255;

    for (let channel = 0; channel < 3; channel += 1) {
      const value = alpha > 0 ? Math.round(Math.min(1, onBlack.data[pixel * 3 + channel] / 255 / alpha) * 255) : 0;

      rgba[pixel * 4 + channel] = value;
      lowest = Math.min(lowest, value);
    }

    rgba[pixel * 4 + 3] = Math.round(alpha * 255);

    if (alpha > 0) {
      const x = pixel % width;
      const y = Math.floor(pixel / width);

      box.top = Math.min(box.top, y);
      box.bottom = Math.max(box.bottom, y);
      box.left = Math.min(box.left, x);
      box.right = Math.max(box.right, x);
    }

    if (alpha > 0.5) {
      sphere += 1;
      whiteness += lowest > 230 ? 1 : 0;
    }
  }

  return { rgba, width, height, box, white: sphere > 0 ? whiteness / sphere : 1 };
}

const browser = await chromium.launch({
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});

let best = null;

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    permissions: ["microphone"],
  });
  const page = await context.newPage();

  await page.route("**/api/voice/signed-url", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: signedUrl }) }),
  );

  const response = await page.goto(base);

  if (response?.status() !== 200) {
    throw new Error(`${base} answered ${response?.status()}: start the application first.`);
  }

  await page.getByTestId("voice-launcher").click();
  await page.getByTestId("voice-panel").waitFor();
  await page.getByTestId("voice-start").click();
  await page.getByTestId("voice-state").filter({ hasText: "I'm listening" }).waitFor({ timeout: 15_000 });
  await page.evaluate(() => {
    const api = window.__katalisVoiceFake;

    if (api === undefined) {
      throw new Error("the build does not carry the test SDK: run npm run build:e2e");
    }

    api.setMode("speaking");
    api.setSpeaking(true);
  });

  const orb = page.getByTestId("voice-orb");
  const ground = async (color) => {
    await page.evaluate((value) => {
      let style = document.getElementById("orb-ground");

      if (style === null) {
        style = document.createElement("style");
        style.id = "orb-ground";
        document.head.append(style);
      }

      style.textContent = `html, body, body * { background: ${value} !important; box-shadow: none !important; }`;
    }, color);
    await page.waitForTimeout(250);
  };

  for (let frame = 0; frame < frames; frame += 1) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForTimeout(frame === 0 ? speakingMs : betweenMs);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(600);
    await ground("#000");

    const black = await orb.screenshot();

    if (!black.equals(await orb.screenshot())) {
      throw new Error("the Orb still moves: reduced motion did not freeze it, so the two grounds would not match.");
    }

    await ground("#fff");

    const candidate = await matte(black, await orb.screenshot());

    console.log(`frame ${frame + 1}: ${(candidate.white * 100).toFixed(1)}% of the sphere is white`);

    if (best === null || candidate.white < best.white) {
      best = { ...candidate, frame: frame + 1 };
    }
  }
} finally {
  await browser.close();
}

// The sphere, centred on a square of its own size, so the teaser can size it by its width.
const { box } = best;
const wide = box.right - box.left + 1;
const tall = box.bottom - box.top + 1;
const side = Math.max(wide, tall);

await sharp(best.rgba, { raw: { width: best.width, height: best.height, channels: 4 } })
  .extract({ left: box.left, top: box.top, width: wide, height: tall })
  .extend({
    top: Math.floor((side - tall) / 2),
    bottom: Math.ceil((side - tall) / 2),
    left: Math.floor((side - wide) / 2),
    right: Math.ceil((side - wide) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9 })
  .toFile(resolve(root, image));

writeFileSync(
  resolve(root, record),
  `${JSON.stringify(
    {
      image,
      component: "components/ui/orb.tsx",
      origin: "Orb of ElevenLabs UI (MIT), as ported in this repository",
      colors,
      seed: 7,
      state: "talking",
      frames,
      kept: best.frame,
      whiteShare: Number(best.white.toFixed(3)),
      capturedBy: "scripts/render-readme-orb.mjs",
      method: "each frame frozen by prefers-reduced-motion and shot over black and over white; alpha = 1 - (white - black)",
      size: side,
    },
    null,
    2,
  )}\n`,
);

console.log(`wrote ${image} (${side} x ${side}, frame ${best.frame}) and ${record}`);
