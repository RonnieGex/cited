import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;

// The sites of the widget tests, served by the specs themselves from origins the app allows. Each spec serves its own
// port because the files and the tests inside a file run in parallel. The environment of the server carries them in
// ALLOWED_ORIGINS, so the `frame-ancestors` of `/embed` names them and the widget can be embedded there.
const widgetSites = "http://127.0.0.1:3210,http://127.0.0.1:3212";
const environment = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // The corpus of `samples/` is ingested with the deterministic providers before the server starts, so every
    // scenario answers from the real store and no test calls a real provider. The limits are high on purpose: the
    // count of questions of a run and a half cannot reach them, and a limit of the day would make the suite flaky.
    command: `npm run build && npm run ingest -- samples/ && npm start -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...environment,
      EMBEDDINGS_PROVIDER: "fake",
      CHAT_PROVIDER: "fake",
      DATABASE_URL: ".data/e2e.sqlite",
      ALLOWED_ORIGINS: widgetSites,
      RATE_LIMIT_PER_IP_PER_HOUR: "1000",
      DAILY_MODEL_CALL_LIMIT: "1000",
    },
  },
});
