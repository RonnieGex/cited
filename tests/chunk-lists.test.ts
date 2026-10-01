// Requirement "A list keeps its lines in its passage" of the delta `knowledge-search` (decisions 2 and 3 of
// `design.md`): the chunker keeps each item of a list on its own line, joined to what comes before it with a line
// break, and every other join stays a space. The DOCX scenario reads the text the parser builds for a Word list, which
// is what the chunker is handed.

import { describe, expect, it } from "vitest";
import { chunkText } from "@/lib/ingest";
import { parseBuffer } from "@/lib/ingest/parse";
import { buildDocx } from "./fixtures/documents";

describe("a list keeps its lines in its passage", () => {
  it("keeps the items of a Markdown list on their own lines", () => {
    const passage = chunkText(
      "# Precios\n\n- Espresso: 35 pesos.\n- Café de olla: 45 pesos.",
    )[0];

    expect(passage?.text).toContain("- Espresso: 35 pesos.\n- Café de olla: 45 pesos.");
  });

  it("keeps the lines of a list after the paragraph that introduces it", () => {
    const passage = chunkText(
      "# Horario\n\nAbrimos toda la semana.\n\n- Lunes: cerrado.\n- Martes: 8:00 a 19:00.",
    )[0];

    expect(passage?.text).toContain("Abrimos toda la semana.\n- Lunes: cerrado.\n- Martes: 8:00 a 19:00.");
  });

  it("keeps the lines of a numbered list and of a list written with asterisks", () => {
    const numbered = chunkText("# Pagos\n\n1. Efectivo.\n2. Tarjeta.")[0];
    const starred = chunkText("# Pagos\n\n* Efectivo.\n* Tarjeta.")[0];

    expect(numbered?.text).toContain("1. Efectivo.\n2. Tarjeta.");
    expect(starred?.text).toContain("* Efectivo.\n* Tarjeta.");
  });

  it("keeps every other join a space", () => {
    const passage = chunkText("# Horario\n\nMartes a viernes: 8:00 a 19:00.\nSábado: 9:00 a 20:00.")[0];

    expect(passage?.text).toBe("Horario Martes a viernes: 8:00 a 19:00. Sábado: 9:00 a 20:00.");
  });

  it("reads a list of a Word document as a list", async () => {
    const parsed = await parseBuffer(
      buildDocx([
        { text: "Aceptamos efectivo." },
        { text: "Aceptamos tarjeta.", list: true },
        { text: "Aceptamos transferencia.", list: true },
      ]),
      "pagos.docx",
    );
    const passage = chunkText(parsed.text)[0];

    expect(parsed.text).toContain("- Aceptamos tarjeta.");
    expect(passage?.text).toContain("Aceptamos efectivo.\n- Aceptamos tarjeta.\n- Aceptamos transferencia.");
  });
});
