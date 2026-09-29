import { LOGO_CACHE_CONTROL } from "../../../../lib/admin/logo.ts";
import { json } from "../../../../lib/admin/respond.ts";
import { readBusinessLogo } from "../../../../lib/settings/business.ts";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const logo = await readBusinessLogo(process.env);

  if (logo === null) {
    return json({ status: "missing", error: "the business has no logo yet" }, 404);
  }

  return new Response(new Uint8Array(logo.bytes), {
    status: 200,
    headers: {
      "content-type": logo.mime,
      "cache-control": LOGO_CACHE_CONTROL,
    },
  });
}
