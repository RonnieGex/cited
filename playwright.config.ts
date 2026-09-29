import { defineConfig, devices } from "@playwright/test";
import {
  E2E_ADDRESS,
  E2E_ADMIN_PASSWORD,
  E2E_ADMIN_SECRET,
  E2E_BASE_URL,
  E2E_DATABASE_URL,
  E2E_PORT,
} from "./e2e/admin-fixtures";

const port = E2E_PORT;
const panelBaseURL = E2E_BASE_URL;
const resetStore =
  "node -e \"const fs = require('node:fs'); for (const file of ['" +
  E2E_DATABASE_URL +
  "', '" +
  E2E_DATABASE_URL +
  "-wal', '" +
  E2E_DATABASE_URL +
  "-shm']) { fs.rmSync(file, { force: true }); }\"";

// The two suites keep their own server and their own store, because each one needs a state the other one breaks: the
// public page answers from the corpus of `samples/` that the suite ingests, and the panel uploads, lists and deletes
// the documents of its own store, empty at the start of the run. The build is one, made by `npm run test:e2e` before
// Playwright starts, so the two servers share it.
//
// The sites of the widget tests are served by the specs themselves from origins the app allows. Each spec serves its
// own port because the files and the tests inside a file run in parallel. The environment of the server carries them
// in ALLOWED_ORIGINS, so the `frame-ancestors` of `/embed` names them and the widget can be embedded there. The
// public server keeps the port 3100 that `e2e/widget.spec.ts` names as the origin of the application it embeds, and
// the panel keeps its own (`E2E_PORT`), away from the three ports of the widget suite.
const publicPort = 3100;
const publicBaseURL = `http://127.0.0.1:${publicPort}`;
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
  projects: [
    {
      name: "panel",
      testMatch: "**/admin.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: panelBaseURL,
        trace: "on-first-retry",
        extraHTTPHeaders: { "x-forwarded-for": E2E_ADDRESS },
      },
    },
    {
      name: "public",
      testIgnore: "**/admin.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: publicBaseURL,
        trace: "on-first-retry",
      },
    },
  ],
  webServer: [
    {
      command: `${resetStore} && npm start -- --port ${port}`,
      url: panelBaseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
        ADMIN_SESSION_SECRET: E2E_ADMIN_SECRET,
        CHAT_PROVIDER: "fake",
        EMBEDDINGS_PROVIDER: "fake",
        DATABASE_URL: E2E_DATABASE_URL,
        TRUST_PROXY: "1",
      },
    },
    {
      // The corpus of `samples/` is ingested with the deterministic providers before the server starts, so every
      // scenario answers from the real store and no test calls a real provider. The limits are high on purpose: the
      // count of questions of a run and a half cannot reach them, and a limit of the day would make the suite flaky.
      command: `npm run ingest -- samples/ && npm start -- --port ${publicPort}`,
      url: publicBaseURL,
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
  ],
});
