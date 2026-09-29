import { reserveProviderTest } from "../../../../../lib/admin/provider-panel.ts";
import { PROVIDER_BODY_ERROR, parseTestBody } from "../../../../../lib/admin/provider-request.ts";
import { guardRequest } from "../../../../../lib/admin/guard.ts";
import { bodyOf, guardResponse, json } from "../../../../../lib/admin/respond.ts";
import { testProvider, testTimeoutMs, withClosedReason } from "../../../../../lib/providers/test.ts";
import { sharedStore } from "../../../../../lib/store/instance.ts";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const parsed = parseTestBody(await bodyOf(request));

  if (parsed === null) {
    return json({ status: "invalid", error: PROVIDER_BODY_ERROR }, 400);
  }

  const store = await sharedStore(process.env);
  const slot = await reserveProviderTest(store);

  if (slot.allowed === false) {
    return json(
      { status: "rate_limited", ok: false, reason: "rate_limited", error: "too many tests in an hour" },
      429,
      { "retry-after": String(slot.retryAfterSeconds) },
    );
  }

  const outcome = await withClosedReason(() =>
    testProvider({ ...parsed, timeoutMs: testTimeoutMs(process.env) }),
  );

  return json({ status: "ok", ...outcome });
}
