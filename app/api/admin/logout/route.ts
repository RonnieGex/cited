import { guardRequest } from "../../../../lib/admin/guard.ts";
import { guardResponse, json } from "../../../../lib/admin/respond.ts";
import { clearedSessionCookie, isSecureHost } from "../../../../lib/admin/session.ts";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  return json({ status: "ok" }, 200, {
    "set-cookie": clearedSessionCookie(isSecureHost(new URL(request.url).host)),
  });
}
