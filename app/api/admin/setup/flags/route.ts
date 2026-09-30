import { guardRequest } from "../../../../../lib/admin/guard.ts";
import { bodyOf, guardResponse, json } from "../../../../../lib/admin/respond.ts";
import { isSetupFlag, readSetupFlags, writeSetupFlag } from "../../../../../lib/admin/setup-flags.ts";
import { sharedStore } from "../../../../../lib/store/instance.ts";

export const runtime = "nodejs";

// Decision 2 of `openspec/changes/guided-setup-and-knowledge/design.md`: the two flags the owner sets — the right
// answer of step 3 and Publish of step 4, beside the two the lane uses to start and to skip — are read and written
// here, behind the session of the panel and the origin of a mutation. The words of the owner never name a flag: the
// codes of this route are the names the module of the flags already keeps.

export async function GET(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const store = await sharedStore(process.env);

  return json({ status: "ok", flags: await readSetupFlags(store) });
}

export async function PUT(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const body = await bodyOf(request);
  const flag = body?.["flag"];
  const value = body?.["value"];

  if (isSetupFlag(flag) === false || typeof value !== "boolean") {
    return json(
      { status: "invalid", error: "the body must be {flag: one of the flags of the setup, value: boolean}" },
      400,
    );
  }

  const store = await sharedStore(process.env);

  return json({ status: "ok", flags: await writeSetupFlag(store, flag, value) });
}
