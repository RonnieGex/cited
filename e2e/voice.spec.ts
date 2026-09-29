import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import type { VoiceFakeApi } from "../tests/fakes/elevenlabs-react";

// The scenarios of the requirement "The microphone with the Orb" of
// `openspec/changes/elevenlabs-voice-agent/specs/voice-agent/spec.md` that only a browser proves: the microphone
// button, the Orb that arrives on demand, the four states in words, the written question echoed once and the citation
// chips named by section. The application is served by `npm run start` over the build of `npm run build:e2e`, whose
// `@elevenlabs/react` is the test SDK of `tests/fakes/elevenlabs-react.tsx`: no scenario reaches ElevenLabs.

const signedUrl = "wss://api.elevenlabs.io/v1/convai/conversation?signed=e2e";
const sentinel = "no-recibe-la-llave";

// The microphone has to exist for the session to open: Chromium is launched with its fake capture device and the
// permission is granted, so no test depends on the hardware of the machine that runs the suite.
test.use({
  permissions: ["microphone"],
  launchOptions: {
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
});

interface Chunk {
  url: string;
  body: string;
}

type FakeWindow = Window & { __katalisVoiceFake?: VoiceFakeApi };

/** Every body of a script the page fetched, so a test can prove what arrived on demand and what never carries a key. */
function watchChunks(page: Page): Chunk[] {
  const chunks: Chunk[] = [];

  page.on("response", (response) => {
    const url = response.url();

    if (/\.js(\?|$)/.test(url) === false) {
      return;
    }

    void response
      .text()
      .then((body) => {
        chunks.push({ url, body });
      })
      .catch(() => undefined);
  });

  return chunks;
}

function hasMarker(chunks: Chunk[], marker: string): boolean {
  return chunks.some((chunk) => chunk.body.includes(marker));
}

function callFake<T>(page: Page, run: (api: VoiceFakeApi) => T): Promise<T> {
  return page.evaluate((source) => {
    const api = (window as unknown as FakeWindow).__katalisVoiceFake;

    if (api === undefined) {
      throw new Error("the test SDK is not mounted");
    }

    // The body travels as text because a browser function cannot be handed to `evaluate`.
    return new Function("api", `return (${source})(api);`)(api) as T;
  }, run.toString());
}

async function answerSignedUrl(page: Page): Promise<void> {
  await page.route("**/api/voice/signed-url", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: signedUrl }),
    }),
  );
}

async function openPanel(page: Page, path = "/"): Promise<void> {
  await page.goto(path);
  await page.getByTestId("voice-launcher").click();
  await expect(page.getByTestId("voice-panel")).toBeVisible();
}

test("the microphone button opens the panel and the Orb arrives on demand", async ({ page }) => {
  const chunks = watchChunks(page);

  await page.goto("/");
  await expect(page.getByTestId("voice-launcher")).toBeVisible();
  await page.waitForTimeout(500);

  await expect(page.getByTestId("voice-panel")).toHaveCount(0);

  const before = hasMarker(chunks, "perlin-noise");

  await page.getByTestId("voice-launcher").click();
  await expect(page.getByTestId("voice-orb")).toBeVisible();

  expect(before, "the texture of the Orb is not in the first load of the page").toBe(false);

  await expect
    .poll(() => hasMarker(chunks, "perlin-noise"), {
      message: "the chunk of the Orb has to arrive after the panel opens",
    })
    .toBe(true);

  console.log(
    `the texture of the Orb: before the panel opens ${before}, after it ${hasMarker(chunks, "perlin-noise")}, in ${chunks.length} scripts`,
  );
});

test("the panel shows the four states in words", async ({ page }) => {
  await answerSignedUrl(page);
  await openPanel(page);

  const state = page.getByTestId("voice-state");

  await expect(state).toHaveText("Tap to talk");

  await page.getByTestId("voice-start").click();

  await expect(state).toHaveText("I'm listening…");
  await expect.poll(() => callFake(page, (api) => api.startCalls.length)).toBe(1);

  await callFake(page, (api) => {
    api.setMode("speaking");
    api.setSpeaking(false);
  });
  await expect(state).toHaveText("Searching the documents…");

  await callFake(page, (api) => {
    api.setSpeaking(true);
  });
  await expect(state).toHaveText("Answering…");
});

test("a written question is echoed once", async ({ page }) => {
  await answerSignedUrl(page);
  await openPanel(page);

  await page.getByTestId("voice-text").fill("How much is a tune-up?");
  await page.getByTestId("voice-send").click();

  await expect(page.getByTestId("voice-message")).toHaveCount(1);
  await expect(page.getByTestId("voice-message")).toContainText("How much is a tune-up?");
});

test("the chips are named by section and somebody else's page is dropped", async ({ page }) => {
  await answerSignedUrl(page);
  await openPanel(page);

  await page.getByTestId("voice-start").click();
  await expect(page.getByTestId("voice-state")).toHaveText("I'm listening…");

  await callFake(page, (api) => {
    api.callTool("mostrar_fuentes", {
      fuentes: [
        { titulo: "cafe-la-horquilla.md · Precios", url: "/#cita-1" },
        { titulo: "cafe-la-horquilla.md", url: "/#la-regla-de-las-dos-bolsas" },
        { titulo: "Ajeno", url: "https://otro.example/#cita-1" },
      ],
    });
  });

  const chips = page.getByTestId("voice-source");

  await expect(chips).toHaveCount(2);
  await expect(chips.nth(0)).toHaveText("cafe-la-horquilla.md · Precios");
  await expect(chips.nth(1)).toHaveText("cafe-la-horquilla.md · La regla de las dos bolsas");
  await expect(chips.nth(0)).toHaveAttribute("href", "/#cita-1");
});

test("the widget offers the same microphone", async ({ page }) => {
  await answerSignedUrl(page);
  await openPanel(page, "/embed");

  await page.getByTestId("voice-start").click();
  await expect(page.getByTestId("voice-state")).toHaveText("I'm listening…");
});

test("the signed URL of the server names the missing variable and the browser never gets the key", async ({
  page,
}) => {
  const bodies: string[] = [];
  const headers: string[] = [];
  const chunks = watchChunks(page);

  page.on("response", (response) => {
    if (response.url().includes("/api/voice/")) {
      headers.push(JSON.stringify(response.headers()));
    }
  });

  const answer = await page.goto("/api/voice/signed-url");

  expect(answer?.status()).toBe(503);

  bodies.push((await answer?.text()) ?? "");

  await openPanel(page);

  const seen = [...bodies, ...headers, ...chunks.map((chunk) => chunk.body)].join("\n");

  console.log(`the browser saw ${chunks.length} scripts, ${seen.length} characters of them`);

  expect(seen).toContain("ELEVENLABS_API_KEY");
  expect(seen).not.toContain("xi-api-key");
  expect(seen).not.toContain(sentinel);
});

test("the voice panel passes axe at level A and AA", async ({ page }) => {
  await answerSignedUrl(page);
  await openPanel(page);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  console.log(
    `the voice panel: axe ${results.violations.length} violations, ${results.passes.length} rules passed`,
  );

  expect(
    results.violations.map(
      (violation) => `${violation.id} (${violation.impact}): ${violation.nodes.length} nodes`,
    ),
  ).toEqual([]);
});
