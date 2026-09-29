export const E2E_PORT = 3213;
export const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`;
export const E2E_ADMIN_PASSWORD = "cited-e2e-panel-2026";
export const E2E_ADMIN_SECRET = "cited-e2e-session-secret";
export const E2E_DATABASE_URL = ".data/e2e-admin.sqlite";

// The service of the panel where the owner connects the AI (`e2e/providers.spec.ts` and `e2e/affiliate.spec.ts`).
// Each one of those two suites has its own server and its own store, and both read the file to check what the store
// keeps after a key is saved (task 10.5 of the contract).
export const E2E_KEYS_PORT = 3214;
export const E2E_KEYS_BASE_URL = `http://127.0.0.1:${E2E_KEYS_PORT}`;
export const E2E_KEYS_DATABASE_URL = ".data/e2e-keys.sqlite";
export const E2E_AFFILIATE_PORT = 3215;
export const E2E_AFFILIATE_BASE_URL = `http://127.0.0.1:${E2E_AFFILIATE_PORT}`;
export const E2E_AFFILIATE_DATABASE_URL = ".data/e2e-affiliate.sqlite";
export const E2E_AFFILIATE_URL = "https://afiliados.example/cited?canal=panel";
export const E2E_ADDRESS = `198.51.100.${11 + Math.floor(Math.random() * 200)}`;
