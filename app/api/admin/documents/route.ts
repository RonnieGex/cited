import { documentSummaries, ingestUpload } from "../../../../lib/admin/documents.ts";
import { guardRequest } from "../../../../lib/admin/guard.ts";
import { guardResponse, json } from "../../../../lib/admin/respond.ts";
import { embeddingsFrom } from "../../../../lib/embeddings/providers.ts";
import { sanitizeOutbound } from "../../../../lib/guards/outbound.ts";
import { embeddingsSignature, resolveEmbeddings } from "../../../../lib/settings/providers.ts";
import { sharedStore } from "../../../../lib/store/instance.ts";

export const runtime = "nodejs";

function messageOf(error: unknown): string {
  return sanitizeOutbound(error instanceof Error ? error.message : "the document could not be read");
}

export async function GET(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const store = await sharedStore(process.env);

  return json({ status: "ok", documents: await documentSummaries(store) });
}

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
  const file = form.get("document");

  if (file === null || typeof file === "string") {
    return json({ status: "invalid", error: "the form must carry a document file" }, 400);
  }

  const store = await sharedStore(process.env);
  const resolution = await resolveEmbeddings({ environment: process.env, store });
  let report;

  try {
    report = await ingestUpload(
      store,
      embeddingsFrom(resolution),
      file.name,
      new Uint8Array(await file.arrayBuffer()),
      embeddingsSignature(resolution),
    );
  } catch (error) {
    return json({ status: "invalid", error: messageOf(error) }, 400);
  }

  if (report.ingested.length === 0) {
    return json(
      {
        status: "invalid",
        error: sanitizeOutbound(report.failed[0]?.reason ?? "the file carried no readable text"),
      },
      400,
    );
  }

  return json({
    status: "ok",
    report,
    documents: await documentSummaries(store),
  });
}
