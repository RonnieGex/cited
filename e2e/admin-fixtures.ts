export const E2E_PORT = 3213;
export const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`;
export const E2E_ADMIN_PASSWORD = "cited-e2e-panel-2026";
export const E2E_ADMIN_SECRET = "cited-e2e-session-secret";
export const E2E_DATABASE_URL = ".data/e2e-admin.sqlite";

// The second service of the panel is the one where the owner connects the AI (`e2e/providers.spec.ts`): its port, its
// store and its encryption key live in `playwright.config.ts`, which starts it. The third one
// (`e2e/affiliate.spec.ts`) has its own fixture here, because two specs read the same values.
export const E2E_AFFILIATE_PORT = 3215;
export const E2E_AFFILIATE_BASE_URL = `http://127.0.0.1:${E2E_AFFILIATE_PORT}`;
export const E2E_AFFILIATE_DATABASE_URL = ".data/e2e-affiliate.sqlite";
export const E2E_AFFILIATE_URL = "https://afiliados.example/cited?canal=panel";
export const E2E_ADDRESS = `198.51.100.${11 + Math.floor(Math.random() * 200)}`;
