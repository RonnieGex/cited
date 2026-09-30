import { defineConfig, devices } from "@playwright/test";
import {
  E2E_ADDRESS,
  E2E_ADMIN_PASSWORD,
  E2E_ADMIN_SECRET,
  E2E_AFFILIATE_BASE_URL,
  E2E_AFFILIATE_DATABASE_URL,
  E2E_AFFILIATE_PORT,
  E2E_AFFILIATE_URL,
  E2E_BASE_URL,
  E2E_DATABASE_URL,
  E2E_PORT,
  E2E_SETUP_BASE_URL,
  E2E_SETUP_DATABASE_URL,
  E2E_SETUP_PORT,
} from "./e2e/admin-fixtures";

const port = E2E_PORT;
const panelBaseURL = E2E_BASE_URL;
const reset = (databaseUrl: string): string =>
  "node -e \"const fs = require('node:fs'); for (const file of ['" +
  databaseUrl +
  "', '" +
  databaseUrl +
  "-wal', '" +
  databaseUrl +
  "-shm']) { fs.rmSync(file, { force: true }); }\"";
const resetStore = reset(E2E_DATABASE_URL);

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

// The panel where the owner connects the AI (`e2e/providers.spec.ts`) keeps its own server and its own store: it is
// the only one that starts with no `CHAT_PROVIDER` and no `EMBEDDINGS_PROVIDER`, so the panel is the source of the
// provider, and its store is empty at the start of the run. The key of the encryption is generated here, never
// committed, and the store it protects is disposable. The provider of the tests is the local double that the spec
// itself serves on port 3216: `OPENAI_BASE_URL` points the OpenAI entry of the catalogue at it, so the panel tests a
// real HTTP round trip and no test reaches a real provider.
const keysPort = 3214;
const keysBaseURL = `http://127.0.0.1:${keysPort}`;
const keysDatabaseURL = ".data/e2e-keys.sqlite";
const keysEncryptionKey = Buffer.alloc(32, 7).toString("base64");
const providerDoubleBaseURL = "http://127.0.0.1:3216/v1";

// The third service is the same panel with the affiliate switch **on** (`e2e/affiliate.spec.ts`): it is the only way
// to see the label "(paid link)" in a browser, because no link of a programme is committed in this change. The
// virtual store is the address a provider would publish, and `DEEPSEEK_AFFILIATE_URL` is the door the catalogue
// opens for whoever joins a programme.
const affiliateEncryptionKey = Buffer.alloc(32, 9).toString("base64");
// The key of the disposable store of the guided setup: generated here, never committed, and the store it protects is
// removed at the start of every run.
const setupEncryptionKey = Buffer.alloc(32, 11).toString("base64");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  // The suite of the panel and the suite of the keys serve their own provider double on the same port (3216), because
  // the environment of the three services of the panel points at it. One worker at a time keeps them from taking the
  // port from each other; the specs inside a file still run in parallel.
  workers: 1,
  projects: [
    {
      name: "panel",
      testMatch: ["**/admin.spec.ts", "**/admin-brand.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: panelBaseURL,
        trace: "on-first-retry",
        extraHTTPHeaders: { "x-forwarded-for": E2E_ADDRESS },
      },
    },
    {
      name: "public",
      testIgnore: ["**/admin.spec.ts", "**/admin-brand.spec.ts", "**/providers.spec.ts", "**/affiliate.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: publicBaseURL,
        trace: "on-first-retry",
      },
    },
    {
      name: "keys",
      testMatch: "**/providers.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: keysBaseURL,
        trace: "on-first-retry",
        extraHTTPHeaders: { "x-forwarded-for": E2E_ADDRESS },
      },
    },
    {
      name: "affiliate",
      testMatch: "**/affiliate.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: E2E_AFFILIATE_BASE_URL,
        trace: "on-first-retry",
        extraHTTPHeaders: { "x-forwarded-for": E2E_ADDRESS },
      },
    },
    {
      // The guided setup: the owner goes from nothing to a published answer, and the timing of that walk is the measure
      // of the round. The store starts empty, no provider is set by the server, and the double the spec serves on port
      // 3216 is the OpenAI entry of the catalogue.
      name: "setup",
      testMatch: "**/setup.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: E2E_SETUP_BASE_URL,
        trace: "on-first-retry",
        extraHTTPHeaders: { "x-forwarded-for": E2E_ADDRESS },
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
        // The voice of the browser suite is the test SDK of `tests/fakes/elevenlabs-react.tsx`, which
        // `npm run build:e2e` resolves in place of the real package. The empty values are explicit so a key that
        // happens to live in the environment of this machine can never make a test call ElevenLabs: the signed URL
        // route answers 503 with the reason code `voice_unavailable` instead, and `e2e/voice.spec.ts` proves it.
        ELEVENLABS_API_KEY: "",
        ELEVENLABS_AGENT_ID: "",
        ELEVENLABS_VOICE_ID: "",
        VOICE_TOOL_SECRET: "",
      },
    },
    {
      command: `${reset(keysDatabaseURL)} && npm start -- --port ${keysPort}`,
      url: keysBaseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
        ADMIN_SESSION_SECRET: E2E_ADMIN_SECRET,
        DATABASE_URL: keysDatabaseURL,
        TRUST_PROXY: "1",
        ENCRYPTION_KEY: keysEncryptionKey,
        OPENAI_BASE_URL: providerDoubleBaseURL,
        // The double of `e2e/providers.spec.ts` listens on `127.0.0.1`, and the requirement "A provider address
        // cannot reach private networks" refuses a loopback address unless whoever installs allows it: this is the
        // flag of an installation that runs its provider on its own machine.
        ALLOW_LOCAL_PROVIDERS: "1",
        AFFILIATE_LINKS: "off",
        HOSTED_OFFER_URL: "https://katalis.dev/cited",
      },
    },
    {
      command: `${reset(E2E_AFFILIATE_DATABASE_URL)} && npm start -- --port ${E2E_AFFILIATE_PORT}`,
      url: E2E_AFFILIATE_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
        ADMIN_SESSION_SECRET: E2E_ADMIN_SECRET,
        DATABASE_URL: E2E_AFFILIATE_DATABASE_URL,
        TRUST_PROXY: "1",
        ENCRYPTION_KEY: affiliateEncryptionKey,
        DEEPSEEK_BASE_URL: providerDoubleBaseURL,
        ALLOW_LOCAL_PROVIDERS: "1",
        DEEPSEEK_AFFILIATE_URL: E2E_AFFILIATE_URL,
        AFFILIATE_LINKS: "on",
        HOSTED_OFFER_URL: "https://katalis.dev/cited",
      },
    },
    {
      // The server of the guided setup (`e2e/setup.spec.ts`). It starts with an empty store and with no chat provider
      // and no embeddings provider at all, because the walk of that suite is exactly "from zero to an answer": the
      // owner connects the AI in the panel, chooses how to search, loads the sample business, asks, verifies and
      // publishes. The provider of the suite is the local double the spec serves on port 3216, the same one the panel
      // of the keys uses; `workers: 1` keeps the two from holding the port at once.
      command: `${reset(E2E_SETUP_DATABASE_URL)} && npm start -- --port ${E2E_SETUP_PORT}`,
      url: E2E_SETUP_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
        ADMIN_SESSION_SECRET: E2E_ADMIN_SECRET,
        DATABASE_URL: E2E_SETUP_DATABASE_URL,
        TRUST_PROXY: "1",
        ENCRYPTION_KEY: setupEncryptionKey,
        OPENAI_BASE_URL: providerDoubleBaseURL,
        ALLOW_LOCAL_PROVIDERS: "1",
        AFFILIATE_LINKS: "off",
        RATE_LIMIT_PER_IP_PER_HOUR: "1000",
        DAILY_MODEL_CALL_LIMIT: "1000",
        ELEVENLABS_API_KEY: "",
        ELEVENLABS_AGENT_ID: "",
        ELEVENLABS_VOICE_ID: "",
        VOICE_TOOL_SECRET: "",
      },
    },
  ],
});
