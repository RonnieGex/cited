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
const baseURL = E2E_BASE_URL;
const resetStore =
  "node -e \"const fs = require('node:fs'); for (const file of ['" +
  E2E_DATABASE_URL +
  "', '" +
  E2E_DATABASE_URL +
  "-wal', '" +
  E2E_DATABASE_URL +
  "-shm']) { fs.rmSync(file, { force: true }); }\"";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    extraHTTPHeaders: { "x-forwarded-for": E2E_ADDRESS },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `${resetStore} && npm run build && npm start -- --port ${port}`,
    url: baseURL,
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
});
