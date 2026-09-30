import {
  documentSummaries,
  ingestOne,
  readUploadField,
  uploadedFile,
  type UploadField,
  type UploadedFile,
} from "../../../../lib/admin/documents.ts";
import { guardRequest } from "../../../../lib/admin/guard.ts";
import { guardResponse, json } from "../../../../lib/admin/respond.ts";
import { embeddingsFrom } from "../../../../lib/embeddings/providers.ts";
import { panelEmbeddingsProblem, embeddingsSignature, resolveEmbeddings } from "../../../../lib/settings/providers.ts";
import { sharedStore } from "../../../../lib/store/instance.ts";

export const runtime = "nodejs";

// The route of the information lane of the guided setup: the files of one upload, one result per file. The browser may
// send them one request at a time — that is what lets the page say, file by file, which one is uploading, reading and
// splitting, and which one failed while the others keep going (decision 3) — and every request goes through the same
// ingestion the command line runs.
//
// Decision 15 of the amendment: the size of every file is read from what the browser sent, before its bytes are read
// into memory, and a name with a parent folder is reduced to its base name. A file that crosses the limit answers the
// same shape as a file the ingestion refused, so the panel says it in the words of the owner.
//
// The answer carries `results`, one entry per file, and `documents`, the list of the panel after the upload. The
// sentence the ingestion wrote for a failure travels as the reason of that file and the panel classifies it: it names
// folders, limits and providers, and it is never printed as it is.

async function filesOf(form: FormData): Promise<UploadField[]> {
  const files: UploadField[] = [];

  for (const entry of form.getAll("document")) {
    if (entry === null || typeof entry === "string") {
      continue;
    }

    files.push(await readUploadField(entry));
  }

  return files;
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
  const files = await filesOf(form);

  if (files.length === 0) {
    return json({ status: "invalid", error: "the form must carry a document file" }, 400);
  }

  const store = await sharedStore(process.env);
  const resolution = await resolveEmbeddings({ environment: process.env, store });
  const problem = panelEmbeddingsProblem(resolution);

  // The owner reads the words of the panel and never the name of a variable of the server (Major M-3 of
  // `revision-community-12.md`): the diagnostic that names `EMBEDDINGS_API_KEY` belongs to the command line.
  if (problem !== null) {
    return json({ status: "invalid", error: problem }, 400);
  }

  const embeddings = embeddingsFrom(resolution);
  const signature = embeddingsSignature(resolution);
  const results: UploadedFile[] = [];

  for (const file of files) {
    if (file.failure !== null) {
      results.push(uploadedFile({ path: file.name, reason: file.failure }));
      continue;
    }

    results.push(uploadedFile(await ingestOne(store, embeddings, file.name, file.bytes, signature)));
  }

  return json({ status: "ok", results, documents: await documentSummaries(store) });
}
