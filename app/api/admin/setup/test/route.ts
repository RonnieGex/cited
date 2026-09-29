import { guardRequest } from "../../../../../lib/admin/guard.ts";
import { testChatProvider, testEmbeddingsProvider } from "../../../../../lib/admin/providers.ts";
import { bodyOf, guardResponse, json } from "../../../../../lib/admin/respond.ts";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const body = await bodyOf(request);
  const target = body?.["target"];

  if (target !== "chat" && target !== "embeddings") {
    return json(
      { status: "invalid", error: 'the body must be {"target": "chat" | "embeddings"}' },
      400,
    );
  }

  const check =
    target === "chat"
      ? await testChatProvider(process.env)
      : await testEmbeddingsProvider(process.env);

  return json(check);
}
