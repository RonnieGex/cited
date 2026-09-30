import { describe, expect, it } from "vitest";
import { uploadResult, type UploadOutcome, type UploadResult } from "@/lib/admin/upload-result";
import { SAMPLE_DOCUMENTS, SAMPLE_NAME } from "@/lib/admin/samples";
import { documentSections } from "@/lib/admin/document-sections";
import type { StoredPassage } from "@/lib/store/types";

// Decision 3 of `openspec/changes/guided-setup-and-knowledge/design.md`: every file of an upload says what happened
// to it in words, and a failure says what to do about it. Decision 4: the sample business is one click and it is
// undone by removing the documents it added. Decision 5: a document page groups its passages under their headings.

function outcomeOf(failure: string, name = "notas.txt"): UploadOutcome {
  return { name, passages: 0, failure };
}

/** The failure of a result, with the union narrowed, so the words of a failure can be read. */
function failed(answer: UploadResult): Extract<UploadResult, { state: "failed" }> {
  if (answer.state !== "failed") {
    throw new Error("the file was expected to fail");
  }

  return answer;
}

describe("the result of one file of an upload", () => {
  it("says ready with the number of passages it produced", () => {
    expect(uploadResult({ name: "precios.md", passages: 4, failure: null })).toEqual({
      state: "ready",
      name: "precios.md",
      passages: 4,
    });
  });

  it("says a PDF with no text layer looks like a scan and that scans are not supported yet", () => {
    const answer = failed(uploadResult(outcomeOf("the file has no readable text", "escaneo.pdf")));

    expect(answer.state).toBe("failed");
    expect(answer.title.en).toContain("scan");
    expect(answer.title.es).toContain("escane");
    expect(answer.advice.en.length).toBeGreaterThan(0);
    expect(answer.advice.es.length).toBeGreaterThan(0);
  });

  it("says a file over the size limit is too large and what the limit is", () => {
    const answer = failed(uploadResult(outcomeOf("notas.txt crosses the size limit: 9 bytes is above the maximum of 5.")));

    expect(answer.state).toBe("failed");
    expect(answer.title.en.toLowerCase()).toContain("large");
    expect(answer.title.es.toLowerCase()).toContain("grande");
  });

  it("says a type that is not supported is not supported", () => {
    const answer = failed(
      uploadResult(outcomeOf("logo.svg is not an accepted type: the content is not PDF, DOCX, Markdown or plain text.")),
    );

    expect(answer.state).toBe("failed");
    expect(answer.title.en.toLowerCase()).toContain("not a type");
    expect(answer.title.es.toLowerCase()).toContain("tipo");
  });

  it("says a text file with nothing in it has no text", () => {
    const answer = failed(uploadResult(outcomeOf("the file has no readable text", "vacio.txt")));

    expect(answer.state).toBe("failed");
    expect(answer.title.en.toLowerCase()).toContain("no text");
    expect(answer.title.es.toLowerCase()).toContain("sin texto");
  });

  it("says the AI is not connected when that is what failed", () => {
    const answer = failed(
      uploadResult(outcomeOf("the embeddings provider saved in the panel has no key: connect it again")),
    );

    expect(answer.state).toBe("failed");
    expect(answer.title.en.toLowerCase()).toContain("search");
    expect(answer.title.es.toLowerCase()).toContain("búsqueda");
  });

  it("never prints what the server wrote", () => {
    const answer = failed(uploadResult(outcomeOf("Error: connect ECONNREFUSED 127.0.0.1:11434")));

    expect(JSON.stringify(answer)).not.toContain("ECONNREFUSED");
    expect(JSON.stringify(answer)).not.toContain("127.0.0.1");
  });

  it("carries every sentence in both languages", () => {
    const answers = [
      uploadResult({ name: "a.md", passages: 1, failure: null }),
      uploadResult(outcomeOf("the file has no readable text", "escaneo.pdf")),
      uploadResult(outcomeOf("a.txt crosses the size limit: 9 bytes is above the maximum of 5.")),
      uploadResult(outcomeOf("a.svg is not an accepted type: the content is not PDF, DOCX, Markdown or plain text.")),
      uploadResult(outcomeOf("the file has no readable text")),
      uploadResult(outcomeOf("the embeddings provider saved in the panel has no key: connect it again")),
    ];

    for (const answer of answers) {
      // A file that was read says its number of passages; a failure says what happened and what to do, in both
      // languages (decision 3).
      if (answer.state === "ready") {
        expect(answer.passages).toBe(1);

        continue;
      }

      expect(answer.title.en.length).toBeGreaterThan(0);
      expect(answer.title.es.length).toBeGreaterThan(0);
      expect(answer.advice.en.length).toBeGreaterThan(0);
      expect(answer.advice.es.length).toBeGreaterThan(0);
    }
  });
});

describe("the sample business", () => {
  it("is Café La Horquilla and carries the documents it ingests", () => {
    expect(SAMPLE_NAME).toBe("Café La Horquilla");
    expect(SAMPLE_DOCUMENTS.length).toBeGreaterThan(0);

    for (const document of SAMPLE_DOCUMENTS) {
      expect(document.name.endsWith(".md") || document.name.endsWith(".txt")).toBe(true);
      expect(document.bytes.byteLength).toBeGreaterThan(0);
    }
  });

  it("is the corpus of `samples/`, so what the owner sees is what the repository publishes", () => {
    const names = SAMPLE_DOCUMENTS.map((document) => document.name);

    expect(names).toEqual(["cafe-la-horquilla.md", "bike-workshop-policies.md", "notas-del-negocio.txt"]);
  });

  it("is undone by the names it added, and only by those", () => {
    const names = SAMPLE_DOCUMENTS.map((document) => document.name);
    const present = ["acta.docx", ...names];
    const left = present.filter((name) => names.includes(name) === false);

    expect(left).toEqual(["acta.docx"]);
  });
});

describe("the sections of a document", () => {
  const passage = (position: number, heading: string | null, text: string): StoredPassage => ({
    id: position,
    name: "cafe-la-horquilla.md",
    position,
    heading,
    text,
  });

  it("groups the passages under their headings in reading order", () => {
    const sections = documentSections([
      passage(1, "Café La Horquilla", "Somos un café y taller de bicicletas."),
      passage(2, "Horario", "Martes a viernes: 8:00 a 19:00."),
      passage(3, "Horario", "Domingo: 9:00 a 14:00."),
      passage(4, "Precios", "Espresso: 35 pesos."),
    ]);

    expect(sections.map((section) => section.heading)).toEqual(["Café La Horquilla", "Horario", "Precios"]);
    expect(sections[1]?.passages.map((one) => one.position)).toEqual([2, 3]);
  });

  it("keeps the order of the store and never sorts the passages", () => {
    const sections = documentSections([
      passage(3, "Precios", "Espresso: 35 pesos."),
      passage(1, "Café La Horquilla", "Somos un café."),
      passage(2, "Horario", "Abrimos."),
    ]);

    expect(sections.flatMap((section) => section.passages.map((one) => one.position))).toEqual([3, 1, 2]);
  });

  it("puts the passages without a heading in a section of their own, before the titled one", () => {
    const sections = documentSections([
      passage(1, null, "Sin título."),
      passage(2, "Horario", "Abrimos."),
    ]);

    expect(sections.map((section) => section.heading)).toEqual([null, "Horario"]);
    expect(sections[0]?.passages).toHaveLength(1);
  });

  it("does not join two untitled passages into one section", () => {
    const sections = documentSections([
      passage(1, null, "Uno."),
      passage(2, null, "Dos."),
      passage(3, "Horario", "Abrimos."),
    ]);

    expect(sections.map((section) => section.heading)).toEqual([null, null, "Horario"]);
  });

  it("answers with nothing for a document with no passages", () => {
    expect(documentSections([])).toEqual([]);
  });
});
