import { conversationSummaries } from "../../../../lib/admin/conversations.ts";
import { guardRequest } from "../../../../lib/admin/guard.ts";
import { guardResponse, json } from "../../../../lib/admin/respond.ts";
import { sharedStore } from "../../../../lib/store/instance.ts";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const store = await sharedStore(process.env);

  return json({ status: "ok", conversations: await conversationSummaries(store) });
}
