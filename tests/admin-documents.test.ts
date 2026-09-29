// @vitest-environment node
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { POST as conversationsDelete } from "@/app/api/admin/conversations/delete/route";
import { GET as conversations } from "@/app/api/admin/conversations/route";
import { POST as documentsDelete } from "@/app/api/admin/documents/delete/route";
import { POST as documentsReingest } from "@/app/api/admin/documents/reingest/route";
import { GET as documents, POST as documentsUpload } from "@/app/api/admin/documents/route";
import { REFUSALS } from "@/lib/answer/prompt";
import { SESSION_COOKIE, sessionToken } from "@/lib/admin/session";
import { hashIp } from "@/lib/guards/ip";
import { dayOf, hourWindowStart } from "@/lib/guards/window";
import { sharedStore } from "@/lib/store/instance";
import {
  ADMIN_SECRET,
  cleanup,
  configured,
  documentForm,
  environmentOf,
  jsonRequest,
  renamedTextBytes,
  setEnvironment,
} from "./admin-helpers";

const repositoryRoot = resolve(import.meta.dirname, "..");
const sample = readFileSync(join(repositoryRoot, "samples", "cafe-la-horquilla.md"), "utf8");

afterAll(cleanup);

function token(): Record<string, string> {
  return { cookie: `${SESSION_COOKIE}=${sessionToken(ADMIN_SECRET, new Date())}` };
}

function action(path: string, body: unknown): Request {
  return jsonRequest(`http://localhost${path}`, body, "POST", token());
}

function upload(name: string, text: string): Request {
  return new Request("http://localhost/api/admin/documents", {
    method: "POST",
    headers: { ...token(), origin: "http://localhost" },
    body: documentForm(name, text),
  });
}

type Listed = {
  documents: Array<{ name: string; type: string; pages: number | null; passages: number }>;
};

describe("the documents of the panel", () => {
  it("uploads a Markdown file of the corpus, lists it with its passages and deletes it", async () => {
    await environmentOf({ ...configured(), CHAT_PROVIDER: "fake", EMBEDDINGS_PROVIDER: "fake" });

    const uploaded = await documentsUpload(upload("cafe-la-horquilla.md", sample));
    const report = (await uploaded.json()) as {
      report: { ingested: Array<{ name: string; passages: number }>; failed: unknown[] };
      documents: Listed["documents"];
    };

    expect(uploaded.status).toBe(200);
    expect(report.report.failed).toEqual([]);
    expect(report.report.ingested[0]?.name).toBe("cafe-la-horquilla.md");

    const passages = report.report.ingested[0]?.passages ?? 0;

    expect(passages).toBeGreaterThanOrEqual(1);
    expect(report.documents.find((one) => one.name === "cafe-la-horquilla.md")?.passages).toBe(
      passages,
    );

    const listed = await documents(new Request("http://localhost/api/admin/documents", { headers: token() }));
    const body = (await listed.json()) as Listed;
    const entry = body.documents.find((one) => one.name === "cafe-la-horquilla.md");

    expect(listed.status).toBe(200);
    expect(entry?.type).toBe("md");
    expect(entry?.passages).toBe(passages);

    const removed = await documentsDelete(action("/api/admin/documents/delete", { name: "cafe-la-horquilla.md" }));
    const after = (await removed.json()) as Listed;

    expect(removed.status).toBe(200);
    expect(after.documents).toEqual([]);

    const store = await sharedStore();

    expect(await store.countDocuments()).toBe(0);
    expect(await store.countPassages()).toBe(0);
    expect(await store.countIndexed()).toBe(0);
  });

  it("refuses a type the ingestion does not accept and a file with no readable text", async () => {
    await environmentOf({ ...configured(), CHAT_PROVIDER: "fake", EMBEDDINGS_PROVIDER: "fake" });

    const renamed = new Request("http://localhost/api/admin/documents", {
      method: "POST",
      headers: { ...token(), origin: "http://localhost" },
      body: documentForm("dibujo.png", new TextDecoder().decode(renamedTextBytes())),
    });
    const picture = await documentsUpload(renamed);
    const empty = await documentsUpload(upload("vacio.md", "   \n\n  "));
    const store = await sharedStore();

    expect(picture.status).toBe(400);
    expect(await picture.text()).not.toContain("claims to be a PNG image");
    expect(empty.status).toBe(400);
    expect(await store.countDocuments()).toBe(0);
  });

  it("re-ingests a document through the same store path", async () => {
    await environmentOf({ ...configured(), CHAT_PROVIDER: "fake", EMBEDDINGS_PROVIDER: "fake" });

    await documentsUpload(upload("cafe-la-horquilla.md", sample));

    const store = await sharedStore();
    const before = await store.findDocument("cafe-la-horquilla.md");
    const passages = await store.countPassages({ name: "cafe-la-horquilla.md" });
    const again = await documentsReingest(
      action("/api/admin/documents/reingest", { name: "cafe-la-horquilla.md" }),
    );
    const body = (await again.json()) as { document: { name: string; passages: number } };
    const after = await store.findDocument("cafe-la-horquilla.md");

    expect(again.status).toBe(200);
    expect(body.document.passages).toBe(passages);
    expect(after?.sha256).toBe(before?.sha256);
    expect(after?.type).toBe("md");
    expect(await store.countPassages({ name: "cafe-la-horquilla.md" })).toBe(passages);

    const missing = await documentsReingest(action("/api/admin/documents/reingest", { name: "no-existe.md" }));

    expect(missing.status).toBe(404);
  });

  it("keeps the ingestion of the command line as the only path", async () => {
    setEnvironment({ ...configured(), CHAT_PROVIDER: "fake", EMBEDDINGS_PROVIDER: "fake" });

    const source = readFileSync(join(repositoryRoot, "lib", "ingest", "index.ts"), "utf8");
    const route = readFileSync(
      join(repositoryRoot, "app", "api", "admin", "documents", "route.ts"),
      "utf8",
    );

    expect(source).toContain("export async function ingestPaths");
    expect(route).toContain("ingestPaths");
    expect(route).not.toContain("chunkText(");
  });
});

describe("the conversations of the panel", () => {
  it("lists the latest questions with their status and citations and deletes them all", async () => {
    await environmentOf({
      ...configured(),
      CHAT_PROVIDER: "fake",
      EMBEDDINGS_PROVIDER: "fake",
    });
    const store = await sharedStore();
    const day = dayOf(new Date());

    await store.appendTurn({
      sessionId: "sesion-a",
      question: "¿Cuánto cuesta una afinación?",
      answer: "Afinación de bicicleta: 380 pesos. [1]",
    });
    await store.appendTurn({
      sessionId: "sesion-a",
      question: "¿Aceptan cheques?",
      answer: REFUSALS.es,
    });
    await store.recordQuestion(hashIp("203.0.113.5", ADMIN_SECRET), new Date().toISOString());
    await store.reserveModelCall(day, 10);

    const listed = await conversations(
      new Request("http://localhost/api/admin/conversations", { headers: token() }),
    );
    const body = (await listed.json()) as {
      conversations: Array<{
        sessionId: string;
        question: string;
        status: string;
        citations: number[];
      }>;
    };

    expect(listed.status).toBe(200);
    expect(body.conversations).toHaveLength(2);
    expect(body.conversations[0]?.question).toBe("¿Aceptan cheques?");
    expect(body.conversations[0]?.status).toBe("refused");
    expect(body.conversations[0]?.citations).toEqual([]);
    expect(body.conversations[1]?.status).toBe("answered");
    expect(body.conversations[1]?.citations).toEqual([1]);

    const deleted = await conversationsDelete(
      action("/api/admin/conversations/delete", { confirm: true }),
    );
    const after = (await deleted.json()) as { deleted: number; conversations: unknown[] };

    expect(deleted.status).toBe(200);
    expect(after.deleted).toBe(2);
    expect(after.conversations).toEqual([]);
    expect(await store.countTurns()).toBe(0);
    expect(await store.modelCallsOn(day)).toBe(1);
    expect(
      await store.questionsInWindow(hashIp("203.0.113.5", ADMIN_SECRET), hourWindowStart(new Date())),
    ).toBe(1);
  });
});
