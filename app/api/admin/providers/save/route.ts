import { reserveProviderTest } from "../../../../../lib/admin/provider-panel.ts";
import { PROVIDER_BODY_ERROR, parseSaveBody } from "../../../../../lib/admin/provider-request.ts";
import { guardRequest } from "../../../../../lib/admin/guard.ts";
import { bodyOf, guardResponse, json } from "../../../../../lib/admin/respond.ts";
import { testProvider, testTimeoutMs, withClosedReason } from "../../../../../lib/providers/test.ts";
import { encryptionAvailable, lastFour, sealSecret } from "../../../../../lib/secrets/index.ts";
import { sharedStore } from "../../../../../lib/store/instance.ts";

export const runtime = "nodejs";

// Decision 4: the save repeats the test and stores the key only when the provider answered. The value is encrypted
// with AES-256-GCM under `ENCRYPTION_KEY`, and without a valid key nothing is stored and the page says why in words,
// without naming a variable. The key never travels back to the browser: the answer carries its last four characters.
export async function POST(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const parsed = parseSaveBody(await bodyOf(request));

  if (parsed === null) {
    return json({ status: "invalid", error: PROVIDER_BODY_ERROR }, 400);
  }

  const store = await sharedStore(process.env);

  if (parsed.mode === "keyword") {
    await store.saveProviderSetting({
      kind: "embeddings",
      provider: "keyword",
      model: null,
      keyCiphertext: null,
      keyLast4: null,
      baseUrl: null,
      mode: "keyword",
      testedAt: new Date().toISOString(),
      testLatencyMs: null,
    });

    return json({ status: "ok", saved: true, mode: "keyword" });
  }

  if (parsed.key.length > 0 && encryptionAvailable(process.env) === false) {
    return json(
      {
        status: "no_encryption_key",
        saved: false,
        error:
          "the server has no encryption key yet, so Cited cannot store keys. Whoever installed Cited sets one once.",
      },
      503,
    );
  }

  const slot = await reserveProviderTest(store);

  if (slot.allowed === false) {
    return json(
      { status: "rate_limited", saved: false, reason: "rate_limited", error: "too many tests in an hour" },
      429,
      { "retry-after": String(slot.retryAfterSeconds) },
    );
  }

  const outcome = await withClosedReason(() =>
    testProvider({ ...parsed, timeoutMs: testTimeoutMs(process.env) }),
  );

  if (outcome.ok === false) {
    return json({ status: "ok", saved: false, reason: outcome.reason });
  }

  const sealed = parsed.key.length === 0 ? null : sealSecret(parsed.key, process.env);

  if (sealed !== null && sealed.ok === false) {
    return json(
      {
        status: "no_encryption_key",
        saved: false,
        error:
          "the server has no usable encryption key, so Cited cannot store keys. Whoever installed Cited sets one once.",
      },
      503,
    );
  }

  await store.saveProviderSetting({
    kind: parsed.kind,
    provider: parsed.provider,
    model: outcome.model,
    keyCiphertext: sealed === null ? null : sealed.value,
    keyLast4: parsed.key.length === 0 ? null : lastFour(parsed.key),
    baseUrl: parsed.baseUrl ?? null,
    mode: null,
    testedAt: new Date().toISOString(),
    testLatencyMs: outcome.latencyMs,
  });

  return json({
    status: "ok",
    saved: true,
    model: outcome.model,
    latencyMs: outcome.latencyMs,
    last4: parsed.key.length === 0 ? null : lastFour(parsed.key),
  });
}
