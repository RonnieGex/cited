import { guardRequest } from "../../../../../lib/admin/guard.ts";
import { guardResponse, json } from "../../../../../lib/admin/respond.ts";
import { embeddingsFrom } from "../../../../../lib/embeddings/providers.ts";
import { sanitizeOutbound } from "../../../../../lib/guards/outbound.ts";
import { reindexStore } from "../../../../../lib/settings/indexing.ts";
import { embeddingsSignature, resolveEmbeddings } from "../../../../../lib/settings/providers.ts";
import { sharedStore } from "../../../../../lib/store/instance.ts";

export const runtime = "nodejs";

// The requirement "Embeddings come from a configured provider" of `specs/knowledge-search/spec.md`: the page says how
// many passages need re-indexing and this route re-indexes them now. The message of this page names no variable: the
// owner reads it in the panel, which speaks the words of the business and never the words of the server.
function panelProblem(mode: string, keyState: string): string {
  if (mode === "none") {
    return "Choose meaning search or search by words in the panel before re-indexing.";
  }

  return keyState === "unreadable"
    ? "The key of the search provider cannot be read: connect it again."
    : "The search provider is not ready: connect it again.";
}

export async function POST(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const store = await sharedStore(process.env);
  const resolution = await resolveEmbeddings({ environment: process.env, store });
  let embeddings;

  try {
    embeddings = embeddingsFrom(resolution);
  } catch {
    return json({ status: "invalid", error: panelProblem(resolution.mode, resolution.keyState) }, 400);
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
