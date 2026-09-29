import { documentSummaries } from "../../../../../lib/admin/documents.ts";
import { guardRequest } from "../../../../../lib/admin/guard.ts";
import { bodyOf, guardResponse, json } from "../../../../../lib/admin/respond.ts";
import { sharedStore } from "../../../../../lib/store/instance.ts";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const body = await bodyOf(request);
  const name = body?.["name"];

  if (typeof name !== "string" || name.trim().length === 0) {
    return json({ status: "invalid", error: 'the body must be {"name": string}' }, 400);
  }

  const store = await sharedStore(process.env);

  await store.deleteDocument(name.trim());

  return json({ status: "ok", documents: await documentSummaries(store) });
}
