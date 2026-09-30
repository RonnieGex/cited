// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { GET as setupFlags, PUT as setupFlagsWrite } from "@/app/api/admin/setup/flags/route";
import { PUT as tryVerify } from "@/app/api/admin/try/verify/route";
import { GET as documents, POST as documentsUpload } from "@/app/api/admin/documents/route";
import { POST as documentsDelete } from "@/app/api/admin/documents/delete/route";
import { POST as sample, DELETE as sampleUndo } from "@/app/api/admin/samples/route";
import { sessionToken } from "@/lib/admin/session";
import { readBusiness } from "@/lib/settings/business";
import { openStore } from "@/lib/store";
import { closeSharedStores } from "@/lib/store/instance";
import { ADMIN_SECRET, cleanup, configured, environmentOf, pngBytes, sessionHeader } from "./admin-helpers";

// Decision 2 of `openspec/changes/guided-setup-and-knowledge/design.md`: the two flags the owner sets are read and
// written through routes of the panel, behind the session of the panel and the origin of a mutation. Decision 4: the
// sample business is one request and it is undone by removing the documents it added.

const roots: string[] = [];
let token = "";
let storePath = "";

afterEach(async () => {
  // The store of a route is shared and stays open; on Windows an open file cannot be removed, so the store is closed
  // before the folder goes. A folder the system still holds is left where it is: the temporary folder of a store is not
  // what a case proves, and the readers of `tests/admin-helpers.ts` are the ones that insist.
  await closeSharedStores();

  for (const root of roots) {
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {
      // Left where it is: it is a folder of the temporary directory of the machine.
    }
  }

  roots.length = 0;
});

afterAll(cleanup);

async function signedEnvironment(overrides: Record<string, string | undefined> = {}): Promise<string> {
  const root = mkdtempSync(join(tmpdir(), "cited-setup-routes-"));
  const path = join(root, "store.sqlite");

  roots.push(root);

  const environment = await environmentOf({ ...configured(), DATABASE_URL: path, ...overrides });

  // The token is signed with the secret of the environment that `environmentOf()` just set, which is the one the
  // routes read: `sessionToken()` takes the secret and the moment, and nothing else.
  expect(environment["ADMIN_SESSION_SECRET"]).toBe(ADMIN_SECRET);
  token = sessionToken(ADMIN_SECRET, new Date());
  storePath = path;

  return path;
}
function request(path: string, body: unknown, method = "POST"): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json", origin: "http://localhost", ...sessionHeader(token) },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
}

function verify(right: boolean): Promise<Response> {
  return tryVerify(request("/api/admin/try/verify", { right }, "PUT"));
}

function uploadRequest(files: Array<{ name: string; text: string }>): Request {
  const form = new FormData();

  for (const file of files) {
    form.append("document", new File([file.text], file.name, { type: "text/markdown" }));
  }

  return new Request("http://localhost/api/admin/documents", {
    method: "POST",
    headers: { origin: "http://localhost", ...sessionHeader(token) },
    body: form,
  });
}

function listed(): Request {
  return new Request("http://localhost/api/admin/documents", { headers: sessionHeader(token) });
}

describe("the flags of the guided setup", () => {
  it("answers the state of every flag", async () => {
    await signedEnvironment();

    const response = await setupFlags(request("/api/admin/setup/flags", {}, "GET"));
    const body = (await response.json()) as { status: string; flags: Record<string, boolean> };

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.flags).toEqual({
      started: false,
      try_verified: false,
      try_attention: false,
      published: false,
      skipped: false,
    });
  });

  it("sets the flag the owner pressed and keeps it", async () => {
    await signedEnvironment();

    const written = await setupFlagsWrite(request("/api/admin/setup/flags", { flag: "started", value: true }));

    expect(written.status).toBe(200);

    const read = await setupFlags(request("/api/admin/setup/flags", {}, "GET"));
    const body = (await read.json()) as { flags: Record<string, boolean> };

    expect(body.flags["started"]).toBe(true);
    expect(body.flags["skipped"]).toBe(false);
  });

  it("refuses a flag that is not one of the named ones", async () => {
    await signedEnvironment();

    const response = await setupFlagsWrite(request("/api/admin/setup/flags", { flag: "whatever", value: true }));

    expect(response.status).toBe(400);
  });

  it("needs the session of the panel", async () => {
    await signedEnvironment();

    const response = await setupFlags(
      new Request("http://localhost/api/admin/setup/flags", { headers: { origin: "http://localhost" } }),
    );

    expect(response.status).toBe(401);
  });

  it("needs the origin of the panel to write", async () => {
    await signedEnvironment();

    const response = await setupFlagsWrite(
      new Request("http://localhost/api/admin/setup/flags", {
        method: "PUT",
        headers: { "content-type": "application/json", ...sessionHeader(token) },
        body: JSON.stringify({ flag: "started", value: true }),
      }),
    );

    expect(response.status).toBe(403);
  });
});

describe("the flag of a right answer", () => {
  it("marks the third step verified and clears the attention of a wrong one", async () => {
    await signedEnvironment();

    const before = await openStore(storePath);

    await before.replaceDocument(
      { name: "cafe.md", sha256: "e".repeat(64), type: "md", pages: null },
      [{ position: 1, heading: "Horario", text: "Abrimos.", embedding: [] }],
    );
    before.close();

    const wrong = await verify(false);

    expect(wrong.status).toBe(200);

    const afterWrong = await openStore(storePath);

    expect(await afterWrong.readSetupFlag("try_attention")).toBe(true);
    expect(await afterWrong.readSetupFlag("try_verified")).toBe(false);
    afterWrong.close();

    const right = await verify(true);

    expect(right.status).toBe(200);

    const afterRight = await openStore(storePath);

    expect(await afterRight.readSetupFlag("try_verified")).toBe(true);
    expect(await afterRight.readSetupFlag("try_attention")).toBe(false);
    afterRight.close();
  });
});

describe("an upload of several files", () => {
  it("answers one result per file and ingests the ones that can be read", async () => {
    await signedEnvironment({ EMBEDDINGS_PROVIDER: "fake" });

    const response = await documentsUpload(
      uploadRequest([
        { name: "precios.md", text: "# Precios\n\nEspresso: 35 pesos.\n" },
        { name: "vacio.md", text: "   \n" },
        { name: "horario.md", text: "# Horario\n\nAbrimos de martes a domingo.\n" },
      ]),
    );
    const body = (await response.json()) as {
      status: string;
      results: Array<{ name: string; state: string; passages: number; failure: string | null }>;
    };

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.results.map((result) => result.name)).toEqual(["precios.md", "vacio.md", "horario.md"]);

    const failed = body.results.filter((result) => result.state === "failed");

    expect(failed).toHaveLength(1);
    expect(failed[0]?.failure).not.toBeNull();
    expect(body.results.filter((result) => result.state === "ready")).toHaveLength(2);
  });

  it("ingests every file of a clean upload", async () => {
    await signedEnvironment({ EMBEDDINGS_PROVIDER: "fake" });

    const response = await documentsUpload(uploadRequest([{ name: "uno.md", text: "# Uno\n\nUn pasaje.\n" }]));
    const body = (await response.json()) as { results: Array<{ state: string }> };

    expect(body.results[0]?.state).toBe("ready");
  });

  it("keeps reading one file of an upload when another one fails", async () => {
    await signedEnvironment({ EMBEDDINGS_PROVIDER: "fake" });

    const form = new FormData();

    form.append(
      "document",
      new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])], "dibujo.png", { type: "image/png" }),
    );
    form.append("document", new File(["# Horario\n\nAbrimos.\n"], "horario.md", { type: "text/markdown" }));

    const response = await documentsUpload(
      new Request("http://localhost/api/admin/documents", {
        method: "POST",
        headers: { origin: "http://localhost", ...sessionHeader(token) },
        body: form,
      }),
    );
    const body = (await response.json()) as { results: Array<{ name: string; state: string }> };

    expect(response.status).toBe(200);
    expect(body.results.map((result) => result.state)).toEqual(["failed", "ready"]);
  });

  // Decision 15 of the amendment: a file is what its bytes say, and a name with a parent folder is reduced to its base
  // name before it is stored or shown (the Major M-2 of `revision-community-13.md`).
  it("refuses a PNG renamed to a text extension while the file after it is read", async () => {
    await signedEnvironment({ EMBEDDINGS_PROVIDER: "fake" });

    const form = new FormData();

    form.append("document", new File([new Uint8Array(pngBytes())], "dibujo.txt", { type: "text/plain" }));
    form.append(
      "document",
      new File(["# Horario\n\nAbrimos de martes a domingo.\n"], "horario.md", { type: "text/markdown" }),
    );

    const response = await documentsUpload(
      new Request("http://localhost/api/admin/documents", {
        method: "POST",
        headers: { origin: "http://localhost", ...sessionHeader(token) },
        body: form,
      }),
    );
    const body = (await response.json()) as {
      results: Array<{ name: string; state: string; failure: string | null }>;
      documents: Array<{ name: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.results.map((result) => result.state)).toEqual(["failed", "ready"]);
    expect(body.results[0]?.name).toBe("dibujo.txt");
    expect(body.results[0]?.failure).toMatch(/not an accepted type/i);
    expect(body.documents.map((document) => document.name)).toEqual(["horario.md"]);
  });

  it("reduces a name with a parent folder to its base name", async () => {
    await signedEnvironment({ EMBEDDINGS_PROVIDER: "fake" });

    const form = new FormData();

    form.append(
      "document",
      new File(["# Notas\n\nAbrimos de martes a domingo.\n"], "../notas.txt", { type: "text/markdown" }),
    );

    const response = await documentsUpload(
      new Request("http://localhost/api/admin/documents", {
        method: "POST",
        headers: { origin: "http://localhost", ...sessionHeader(token) },
        body: form,
      }),
    );
    const body = (await response.json()) as {
      results: Array<{ name: string; state: string }>;
      documents: Array<{ name: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.results.map((result) => result.name)).toEqual(["notas.txt"]);
    expect(body.documents.map((document) => document.name)).toEqual(["notas.txt"]);
  });

  it("still answers the list of documents of the panel", async () => {
    await signedEnvironment({ EMBEDDINGS_PROVIDER: "fake" });

    await documentsUpload(uploadRequest([{ name: "uno.md", text: "# Uno\n\nUn pasaje.\n" }]));

    const response = await documents(listed());
    const body = (await response.json()) as { documents: Array<{ name: string; passages: number }> };

    expect(response.status).toBe(200);
    expect(body.documents.map((document) => document.name)).toEqual(["uno.md"]);
    expect(body.documents[0]?.passages).toBe(1);
  });

  it("needs the session of the panel", async () => {
    await signedEnvironment({ EMBEDDINGS_PROVIDER: "fake" });

    const form = new FormData();

    form.append("document", new File(["# Uno\n\nUn pasaje.\n"], "uno.md", { type: "text/markdown" }));

    const response = await documentsUpload(
      new Request("http://localhost/api/admin/documents", {
        method: "POST",
        headers: { origin: "http://localhost" },
        body: form,
      }),
    );

    expect(response.status).toBe(401);
  });
});

describe("the sample business", () => {
  it("ingests the corpus of `samples/` and answers the names it added", async () => {
    await signedEnvironment({ EMBEDDINGS_PROVIDER: "fake" });

    const response = await sample(request("/api/admin/samples", {}));
    const body = (await response.json()) as { status: string; documents: string[]; name: string };

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.name).toBe("Café La Horquilla");
    expect(body.documents).toEqual([
      "cafe-la-horquilla.md",
      "bike-workshop-policies.md",
      "notas-del-negocio.txt",
    ]);

    const panel = (await (await documents(listed())).json()) as {
      documents: Array<{ name: string; passages: number }>;
    };

    expect(panel.documents).toHaveLength(3);
    expect(panel.documents.every((document) => document.passages > 0)).toBe(true);
  });

  it("is undone by removing what it added", async () => {
    await signedEnvironment({ EMBEDDINGS_PROVIDER: "fake" });

    await sample(request("/api/admin/samples", {}));

    const deleted = await documentsDelete(request("/api/admin/documents/delete", { name: "cafe-la-horquilla.md" }));

    expect(deleted.status).toBe(200);

    const panel = (await (await documents(listed())).json()) as { documents: Array<{ name: string }> };

    expect(panel.documents.map((document) => document.name)).not.toContain("cafe-la-horquilla.md");
    expect(panel.documents).toHaveLength(2);
  });

  it("answers the words of the owner and never a name of a variable", async () => {
    await signedEnvironment();

    const response = await sample(request("/api/admin/samples", {}));
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);

    for (const name of ["EMBEDDINGS_PROVIDER", "EMBEDDINGS_API_KEY", "DATABASE_URL", "CHAT_PROVIDER"]) {
      expect(JSON.stringify(body)).not.toContain(name);
    }
  });

  it("needs the session of the panel", async () => {
    await signedEnvironment();

    const response = await sample(
      new Request("http://localhost/api/admin/samples", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: "{}",
      }),
    );

    expect(response.status).toBe(401);
  });
});

// Decision 16 of the amendment: undo leaves nothing of the sample. Removing its documents is not enough while the
// business keeps the name the sample wrote, and a name the owner typed after the sample is kept.
describe("undoing the sample business", () => {
  it("removes the documents it added and clears the name it set", async () => {
    await signedEnvironment({ EMBEDDINGS_PROVIDER: "fake" });

    await sample(request("/api/admin/samples", {}));

    expect((await readBusiness())?.name).toBe("Café La Horquilla");

    const response = await sampleUndo(request("/api/admin/samples", {}, "DELETE"));
    const body = (await response.json()) as {
      status: string;
      name_cleared: boolean;
      documents: unknown[];
    };

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.name_cleared).toBe(true);
    expect(body.documents).toEqual([]);
    expect(((await readBusiness())?.name ?? "").trim()).toBe("");
  });

  it("keeps a name the owner typed after the sample", async () => {
    await signedEnvironment({ EMBEDDINGS_PROVIDER: "fake" });

    await sample(request("/api/admin/samples", {}));

    const store = await openStore(storePath);

    await store.saveBusiness({
      name: "Cafetería del Sur",
      primaryColor: null,
      tone: "",
      language: "en",
      forbiddenTopics: "",
      welcomeEn: "",
      welcomeEs: "",
    });
    store.close();

    const response = await sampleUndo(request("/api/admin/samples", {}, "DELETE"));
    const body = (await response.json()) as { name_cleared: boolean };

    expect(response.status).toBe(200);
    expect(body.name_cleared).toBe(false);
    expect((await readBusiness())?.name).toBe("Cafetería del Sur");
  });

  it("needs the session of the panel", async () => {
    await signedEnvironment({ EMBEDDINGS_PROVIDER: "fake" });

    const response = await sampleUndo(
      new Request("http://localhost/api/admin/samples", {
        method: "DELETE",
        headers: { origin: "http://localhost" },
      }),
    );

    expect(response.status).toBe(401);
  });
});
