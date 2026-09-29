import { guardRequest } from "../../../../../lib/admin/guard.ts";
import { detectLogoMime, logoProblem } from "../../../../../lib/admin/logo.ts";
import { guardResponse, json } from "../../../../../lib/admin/respond.ts";
import { readBusiness, saveBusinessLogo } from "../../../../../lib/settings/business.ts";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("multipart/form-data") === false) {
    return json({ status: "invalid", error: "the request must carry a multipart form" }, 415);
  }

  const form = await request.formData();
  const file = form.get("logo");

  if (file === null || typeof file === "string") {
    return json({ status: "invalid", error: "the form must carry a logo file" }, 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const problem = logoProblem(bytes, file.name);

  if (problem !== null) {
    return json({ status: "invalid", error: problem }, 400);
  }

  await saveBusinessLogo(detectLogoMime(bytes) ?? "application/octet-stream", bytes, process.env);

  return json({ status: "ok", business: await readBusiness(process.env) });
}
