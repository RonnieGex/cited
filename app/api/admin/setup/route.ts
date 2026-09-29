import { guardRequest } from "../../../../lib/admin/guard.ts";
import { guardResponse, json } from "../../../../lib/admin/respond.ts";
import { exampleText, setupGroups } from "../../../../lib/admin/setup.ts";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  return json({ status: "ok", groups: setupGroups(exampleText(), process.env) });
}
