import { providerPanelState } from "../../../../lib/admin/provider-panel.ts";
import { guardRequest } from "../../../../lib/admin/guard.ts";
import { bodyOf, guardResponse, json } from "../../../../lib/admin/respond.ts";
import { sharedStore } from "../../../../lib/store/instance.ts";
import { PROVIDER_KINDS, type ProviderKind } from "../../../../lib/store/types.ts";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const store = await sharedStore(process.env);

  return json({ status: "ok", ...(await providerPanelState(process.env, store)) });
}

export async function DELETE(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const body = await bodyOf(request);
  const kind = body?.["kind"];

  if (typeof kind !== "string" || PROVIDER_KINDS.includes(kind as ProviderKind) === false) {
    return json({ status: "invalid", error: 'the body must be {"kind": "chat" | "embeddings"}' }, 400);
  }

  const store = await sharedStore(process.env);
  const removed = await store.deleteProviderSetting(kind as ProviderKind);

  return json({ status: "ok", removed: removed > 0, ...(await providerPanelState(process.env, store)) });
}
