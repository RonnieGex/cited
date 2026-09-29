import { guardRequest } from "../../../../../lib/admin/guard.ts";
import { guardResponse, json } from "../../../../../lib/admin/respond.ts";
import { embeddingsFrom } from "../../../../../lib/embeddings/providers.ts";
import { sanitizeOutbound } from "../../../../../lib/guards/outbound.ts";
import { reindexStore } from "../../../../../lib/settings/indexing.ts";
import {
  embeddingsSignature,
  panelEmbeddingsProblem,
  resolveEmbeddings,
} from "../../../../../lib/settings/providers.ts";
import { sharedStore } from "../../../../../lib/store/instance.ts";

export const runtime = "nodejs";

// The requirement "Embeddings come from a configured provider" of `specs/knowledge-search/spec.md`: the page says how
// many passages need re-indexing and this route re-indexes them now. The message of this page names no variable: the
// owner reads it in the panel, which speaks the words of the business and never the words of the server
// (`lib/settings/providers.ts`, `panelEmbeddingsProblem()`).
export async function POST(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const store = await sharedStore(process.env);
  const resolution = await resolveEmbeddings({ environment: process.env, store });
  const problem = panelEmbeddingsProblem(resolution);
  let embeddings;

  if (problem !== null) {
    return json({ status: "invalid", error: problem }, 400);
  }

  try {
    embeddings = embeddingsFrom(resolution);
  } catch {
    return json({ status: "invalid", error: panelEmbeddingsProblem(resolution) }, 400);
  }

  try {
    const report = await reindexStore(store, embeddings, embeddingsSignature(resolution));

    return json({ status: "ok", ...report });
  } catch (error) {
    return json(
      {
        status: "invalid",
        error: sanitizeOutbound(
          error instanceof Error ? error.message : "the documents could not be re-indexed",
        ),
      },
      400,
    );
  }
}
