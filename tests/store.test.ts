import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openStore, type Store } from "@/lib/store";
import type { PassageInput } from "@/lib/store/types";

const roots: string[] = [];
let store: Store;
let databasePath: string;

function workspace(): string {
  const root = mkdtempSync(join(tmpdir(), "katalis-store-"));

  roots.push(root);

  return root;
}

async function removeLater(root: string): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

      return;
    } catch {
      await new Promise((wake) => setTimeout(wake, 200));
    }
  }
}

function passages(text: string): PassageInput[] {
  const embedding = new Array<number>(64).fill(0.125);

  return [
    { position: 0, heading: "Horario", text, embedding },
    { position: 1, heading: "Precios", text: "El espresso cuesta 35 pesos.", embedding },
  ];
}

beforeAll(async () => {
  databasePath = join(workspace(), "store.sqlite");
  store = await openStore(databasePath);
});

afterAll(async () => {
  store.close();

  for (const root of roots) {
    await removeLater(root);
  }
});

describe("the schema", () => {
  it("creates the tables of the design", async () => {
    const client = createClient({ url: pathToFileURL(databasePath).href });
    const names = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );

    client.close();

    const created = names.rows.map((row) => String(row.name));

    expect(created).toContain("documents");
    expect(created).toContain("passages");
    expect(created).toContain("passages_fts");
  });

  it("declares an F32_BLOB column on the passages table", async () => {
    const client = createClient({ url: pathToFileURL(databasePath).href });
    const columns = await client.execute("SELECT name, type FROM pragma_table_info('passages')");

    client.close();

    const embedding = columns.rows.find((row) => String(row.name) === "embedding");

    expect(String(embedding?.type ?? "")).toMatch(/F32_BLOB/);
  });

  it("is safe to open twice", async () => {
    const again = await openStore(databasePath);

    await expect(again.countDocuments()).resolves.toBe(await store.countDocuments());
    again.close();
  });
});

describe("documents and passages", () => {
  it("stores a document by name and replaces it instead of duplicating it", async () => {
    await store.replaceDocument(
      { name: "horario.md", sha256: "a".repeat(64), type: "md", pages: null },
      passages("Martes a viernes de 8:00 a 19:00."),
    );

    const before = await store.countPassages({ name: "horario.md" });

    await store.replaceDocument(
      { name: "horario.md", sha256: "b".repeat(64), type: "md", pages: null },
      passages("Martes a viernes de 8:00 a 19:00."),
    );

    const after = await store.countPassages({ name: "horario.md" });

    expect(before).toBe(2);
    expect(after).toBe(2);
    await expect(store.listDocuments()).resolves.toHaveLength(1);
    await expect(store.findDocument("horario.md")).resolves.toMatchObject({
      sha256: "b".repeat(64),
    });
  });

  it("keeps the keyword index in step with the passages after a replacement", async () => {
    const embedding = new Array<number>(64).fill(0.125);

    await store.replaceDocument(
      { name: "notas.md", sha256: "c".repeat(64), type: "txt", pages: null },
      [{ position: 0, heading: null, text: "Aceptamos efectivo y tarjeta.", embedding }],
    );

    const before = await store.countIndexed();

    await store.replaceDocument(
      { name: "notas.md", sha256: "d".repeat(64), type: "txt", pages: null },
      [{ position: 0, heading: null, text: "Aceptamos efectivo y tarjeta.", embedding }],
    );

    expect(await store.countIndexed()).toBe(before);
    expect(await store.countIndexed()).toBe(await store.countPassages());
  });

  it("deletes the passages and the index rows of a document", async () => {
    await store.replaceDocument(
      { name: "borrar.md", sha256: "e".repeat(64), type: "md", pages: null },
      passages("Este documento se va a borrar."),
    );

    await expect(store.countPassages({ name: "borrar.md" })).resolves.toBe(2);

    await store.deleteDocument("borrar.md");

    await expect(store.countPassages({ name: "borrar.md" })).resolves.toBe(0);
    await expect(store.findDocument("borrar.md")).resolves.toBeNull();
    expect(await store.countIndexed()).toBe(await store.countPassages());
  });
});

describe("the file of the store", () => {
  it("lives in a single file that the tests delete", () => {
    expect(statSync(databasePath).isFile()).toBe(true);
  });

  it("leaves no store behind in the repository", () => {
    const repositoryRoot = join(import.meta.dirname, "..");

    for (const candidate of ["store.sqlite", "data/store.sqlite", "katalis.sqlite"]) {
      expect(existsSync(join(repositoryRoot, candidate))).toBe(false);
    }
  });
});
