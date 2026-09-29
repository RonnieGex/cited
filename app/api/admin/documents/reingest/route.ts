import { documentSummaries, reingestDocument } from "../../../../../lib/admin/documents.ts";
import { guardRequest } from "../../../../../lib/admin/guard.ts";
import { bodyOf, guardResponse, json } from "../../../../../lib/admin/respond.ts";
import { embeddingsFrom } from "../../../../../lib/embeddings/providers.ts";
import { sanitizeOutbound } from "../../../../../lib/guards/outbound.ts";
import { embeddingsSignature, resolveEmbeddings } from "../../../../../lib/settings/providers.ts";
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
  const resolution = await resolveEmbeddings({ environment: process.env, store });
  let document;

  try {
    document = await reingestDocument(
      store,
      embeddingsFrom(resolution),
      embeddingsSignature(resolution),
      name.trim(),
    );
  } catch (error) {
    return json(
      {
        status: "invalid",
        error: sanitizeOutbound(
          error instanceof Error ? error.message : "the document could not be re-ingested",
        ),
      },
      400,
    );
  }

  if (document === null) {
    return json({ status: "missing", error: `${name.trim()} is not in the store` }, 404);
  }

  return json({ status: "ok", document, documents: await documentSummaries(store) });
}
