import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createFakeEmbeddings } from "@/lib/embeddings/fake";
import { ingestFolder } from "@/lib/ingest";
import { openStore, type Store } from "@/lib/store/index";
import { suggestedQuestions } from "@/lib/admin/questions";

// Decision 6 of `openspec/changes/guided-setup-and-knowledge/design.md`: up to four questions built from the headings
// of the documents, with no model call. The store is the only source: the headings are what the ingestion kept.

const roots: string[] = [];
const opened: Store[] = [];

afterEach(() => {
  for (const store of opened) {
    store.close();
  }

  opened.length = 0;

  for (const root of roots) {
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {
      // Left where it is: it is a folder of the temporary directory of the machine.
    }
  }

  roots.length = 0;
});

async function open(path: string): Promise<Store> {
  const store = await openStore(path);

  opened.push(store);

  return store;
}

async function storeWith(sections: Array<[string | null, string]>): Promise<Store> {
  const root = mkdtempSync(join(tmpdir(), "cited-questions-"));

  roots.push(root);

  const store = await open(join(root, "store.sqlite"));

  await store.replaceDocument(
    { name: "cafe-la-horquilla.md", sha256: "c".repeat(64), type: "md", pages: null },
    sections.map(([heading, text], index) => ({
      position: index + 1,
      heading,
      text: text ?? "Un pasaje sin apartado.",
      embedding: [],
    })),
  );

  return store;
}

// The scenario "Suggestions speak the language of the panel" of the delta `owner-setup` (decision 7 of `design.md`):
// with the three sample documents loaded, the panel in Spanish is offered the headings of `cafe-la-horquilla.md` and
// the panel in English the headings of `bike-workshop-policies.md`. The language of a document is `detectLanguage` of
// the text of its first passages, computed here: nothing new is stored.
describe("the suggestions of the sample business", () => {
  it("offers the Spanish headings to the panel in Spanish", async () => {
    const root = mkdtempSync(join(tmpdir(), "cited-questions-samples-"));
    const samples = join(import.meta.dirname, "..", "samples");
    const store = await open(join(root, "store.sqlite"));

    roots.push(root);

    await ingestFolder(samples, {
      store,
      embeddings: createFakeEmbeddings(),
      limits: { maxBytes: 1024 * 1024, maxPages: 10 },
    });

    const questions = await suggestedQuestions(store, "es");

    expect(questions).toHaveLength(4);
    expect(questions.map((question) => /Café La Horquilla|Horario|Precios|Políticas/.test(question))).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect(questions.some((question) => question.includes("bike-workshop-policies"))).toBe(false);
    expect(questions.some((question) => /Bike workshop|Bookings|Storage|Groups|Guarantee/.test(question))).toBe(false);
  });

  it("offers the English headings to the panel in English", async () => {
    const root = mkdtempSync(join(tmpdir(), "cited-questions-samples-en-"));
    const samples = join(import.meta.dirname, "..", "samples");
    const store = await open(join(root, "store.sqlite"));

    roots.push(root);

    await ingestFolder(samples, {
      store,
      embeddings: createFakeEmbeddings(),
      limits: { maxBytes: 1024 * 1024, maxPages: 10 },
    });

    const questions = await suggestedQuestions(store, "en");

    expect(questions).toHaveLength(4);
    expect(questions.some((question) => /Horario|Precios|Políticas/.test(question))).toBe(false);
    expect(questions[0]).toContain("Bike workshop policies at Café La Horquilla");
  });
});

describe("the suggested questions", () => {
  it("builds one question per heading, in the order of the document", async () => {
    const store = await storeWith([
      ["Horario", "Martes a viernes: 8:00 a 19:00."],
      ["Precios", "Espresso: 35 pesos."],
      ["Políticas", "Aceptamos efectivo y tarjeta."],
    ]);
    const questions = await suggestedQuestions(store, "en");

    expect(questions).toHaveLength(3);
    expect(questions[0]).toContain("Horario");
    expect(questions[1]).toContain("Precios");
    expect(questions[2]).toContain("Políticas");
  });

  it("offers four at most", async () => {
    const store = await storeWith([
      ["Uno", "a"],
      ["Dos", "b"],
      ["Tres", "c"],
      ["Cuatro", "d"],
      ["Cinco", "e"],
      ["Seis", "f"],
    ]);

    expect(await suggestedQuestions(store, "en")).toHaveLength(4);
  });

  it("repeats no heading, whichever document it came from", async () => {
    const root = mkdtempSync(join(tmpdir(), "cited-questions-two-"));

    roots.push(root);

    const store = await open(join(root, "store.sqlite"));

    for (const name of ["uno.md", "dos.md"]) {
      await store.replaceDocument(
        { name, sha256: "d".repeat(64), type: "md", pages: null },
        [
          { position: 1, heading: "Horario", text: "Abrimos.", embedding: [] },
          { position: 2, heading: "Precios", text: "Cuesta.", embedding: [] },
        ],
      );
    }

    const questions = await suggestedQuestions(store, "en");

    expect(questions).toHaveLength(2);
    expect(questions.filter((question) => question.includes("Horario"))).toHaveLength(1);
  });

  it("ignores the passages with no heading", async () => {
    const store = await storeWith([
      [null, "Un texto suelto."],
      ["Horario", "Abrimos."],
      [null, "Otro texto suelto."],
    ]);

    const questions = await suggestedQuestions(store, "en");

    expect(questions).toHaveLength(1);
    expect(questions[0]).toContain("Horario");
  });

  it("speaks the language of the panel", async () => {
    const store = await storeWith([["Horario", "Abrimos."]]);

    expect((await suggestedQuestions(store, "en"))[0]).toMatch(/Horario/);
    expect((await suggestedQuestions(store, "es"))[0]).toMatch(/Horario/);
    expect((await suggestedQuestions(store, "es"))[0]).not.toBe((await suggestedQuestions(store, "en"))[0]);
  });

  it("answers with nothing when the store holds no document", async () => {
    const root = mkdtempSync(join(tmpdir(), "cited-questions-empty-"));

    roots.push(root);

    expect(await suggestedQuestions(await open(join(root, "store.sqlite")), "en")).toEqual([]);
  });
});
