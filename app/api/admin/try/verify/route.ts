import { guardRequest } from "../../../../../lib/admin/guard.ts";
import { bodyOf, guardResponse, json } from "../../../../../lib/admin/respond.ts";
import { readSetupFlags, writeSetupFlag } from "../../../../../lib/admin/setup-flags.ts";
import { sharedStore } from "../../../../../lib/store/instance.ts";

export const runtime = "nodejs";

// Decision 6 of `openspec/changes/guided-setup-and-knowledge/design.md`: "This answer is right" verifies the third
// step. The two answers are one flag each and they never contradict each other: marking an answer right clears the
// attention of a wrong one and the other way round, so the state of the step is always the last thing the owner said.

export async function PUT(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const body = await bodyOf(request);
  const right = body?.["right"];

  if (typeof right !== "boolean") {
    return json({ status: "invalid", error: "the body must be {right: boolean}" }, 400);
  }

  const store = await sharedStore(process.env);

  await writeSetupFlag(store, right ? "try_verified" : "try_attention", true);
  await writeSetupFlag(store, right ? "try_attention" : "try_verified", false);

  return json({ status: "ok", flags: await readSetupFlags(store) });
}
