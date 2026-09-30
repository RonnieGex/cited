import { guardRequest } from "../../../../lib/admin/guard.ts";
import { guardResponse, json } from "../../../../lib/admin/respond.ts";
import { ingestOne, uploadedFile, type UploadedFile } from "../../../../lib/admin/documents.ts";
import { SAMPLE_DOCUMENTS, SAMPLE_NAME } from "../../../../lib/admin/samples.ts";
import { embeddingsFrom } from "../../../../lib/embeddings/providers.ts";
import { embeddingsSignature, panelEmbeddingsProblem, resolveEmbeddings } from "../../../../lib/settings/providers.ts";
import { sharedStore } from "../../../../lib/store/instance.ts";
import { readBusiness, saveBusiness } from "../../../../lib/settings/business.ts";

export const runtime = "nodejs";

// Decision 4 of `openspec/changes/guided-setup-and-knowledge/design.md`: "Try it with a sample business" ingests the
// corpus of `samples/` and fills an empty business name with Café La Horquilla, both undoable by removing the
// documents it added. The names it returns are exactly the ones that undo it.

export async function POST(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const store = await sharedStore(process.env);
  const resolution = await resolveEmbeddings({ environment: process.env, store });
  const problem = panelEmbeddingsProblem(resolution);

  if (problem !== null) {
    return json({ status: "invalid", error: problem }, 400);
  }

  const embeddings = embeddingsFrom(resolution);
  const signature = embeddingsSignature(resolution);
  const results: UploadedFile[] = [];
  const documents: string[] = [];

  for (const sample of SAMPLE_DOCUMENTS) {
    const read = await ingestOne(store, embeddings, sample.name, sample.bytes, signature);
    const file = uploadedFile(read);

    results.push(file);

    if (file.state === "ready") {
      documents.push(file.name);
    }
  }

  // The name is filled only when the business has none: an owner who already wrote theirs never sees it replaced by
  // the name of the sample (decision 4).
  const business = await readBusiness();
  const named = (business?.name.trim() ?? "").length > 0;

  if (named === false) {
    await saveBusiness({
      name: SAMPLE_NAME,
      primaryColor: business?.primaryColor ?? null,
      tone: business?.tone ?? "",
      language: business?.language ?? "en",
      forbiddenTopics: business?.forbiddenTopics ?? [],
      welcome: business?.welcome ?? { en: "", es: "" },
    });
  }

  return json({ status: "ok", name: SAMPLE_NAME, named: named === false, documents, results });
}
