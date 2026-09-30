// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  MAX_SOURCES,
  SOURCES_TOOL,
  sourceLabel,
  sourcePath,
  sourceSection,
  sourcesAnswer,
  validateSources,
  type VoiceSource,
} from "@/components/voice/sources";

// The scenarios of the client tool `mostrar_fuentes` of `openspec/changes/elevenlabs-voice-agent/specs/voice-agent/spec.md`:
// the chips are named by section and a citation the agent invented can never become a link to somebody else's page.
// The validator is a port of `components/voice/sources.ts` of Construye, adapted to the relative URLs this server
// returns (the playbook records that the agent passes a webhook tool's URLs through unchanged).

const origin = "https://cited.example";

function source(titulo: string, url: string): VoiceSource {
  return { titulo, url };
}

describe("the sources of the agent", () => {
  it("keeps a citation of this site and resolves it against the origin of the page", () => {
    const result = validateSources({ fuentes: [source("Precios", "/#cita-2")] }, origin);

    expect(result.fuentes).toEqual([{ titulo: "Precios", url: `${origin}/#cita-2` }]);
    expect(result.descartadas).toBe(0);
  });

  it("accepts a bare list as the payload of the tool", () => {
    const result = validateSources([source("Precios", "/")], origin);

    expect(result.fuentes).toHaveLength(1);
  });

  it("answers nothing for a payload that is not a list of sources", () => {
    for (const payload of [null, 7, "Precios", {}, { fuentes: "Precios" }, { fuentes: [7] }]) {
      const result = validateSources(payload, origin);

      expect(result.fuentes, JSON.stringify(payload)).toEqual([]);
    }
  });

  it("drops a citation of somebody else's page", () => {
    const result = validateSources(
      {
        fuentes: [
          source("Ajeno", "https://otro.example/#cita-1"),
          source("Protocolo relativo", "//otro.example/#cita-1"),
          source("Sin esquema utilizable", "javascript:alert(1)"),
          source("Correo", "mailto:hola@otro.example"),
          source("Propio", "/#cita-9"),
        ],
      },
      origin,
    );

    expect(result.fuentes.map((entry) => entry.titulo)).toEqual(["Propio"]);
    expect(result.descartadas).toBe(4);
  });

  it("drops a title that is empty and a title longer than the ceiling", () => {
    const result = validateSources(
      { fuentes: [source("   ", "/#cita-1"), source("a".repeat(121), "/#cita-2")] },
      origin,
    );

    expect(result.fuentes).toEqual([]);
    expect(result.descartadas).toBe(2);
  });

  it("keeps one chip per URL and never more than the ceiling", () => {
    const many = Array.from({ length: MAX_SOURCES + 3 }, (_, index) =>
      source(`Documento ${index}`, `/#cita-${index}`),
    );
    const repeated = validateSources({ fuentes: [source("Precios", "/#cita-1"), source("Precios otra vez", "/#cita-1")] }, origin);
    const capped = validateSources({ fuentes: many }, origin);

    expect(repeated.fuentes).toHaveLength(1);
    expect(repeated.descartadas).toBe(1);
    expect(capped.fuentes).toHaveLength(MAX_SOURCES);
    expect(capped.descartadas).toBe(3);
  });

  it("names the tool the prompt asks the agent to call", () => {
    expect(SOURCES_TOOL).toBe("mostrar_fuentes");
  });

  it("tells the agent how many citations were shown and how many were dropped", () => {
    const result = validateSources({ fuentes: [source("Precios", "/#cita-1")] }, origin);

    expect(sourcesAnswer(result)).toContain("1");
    expect(sourcesAnswer({ fuentes: [], descartadas: 2 })).toContain("2");
  });
});

describe("the label of a chip", () => {
  it("is the document and the section the agent reported", () => {
    expect(sourceLabel(source("cafe-la-horquilla.md · Precios", "/#cita-1"))).toBe(
      "cafe-la-horquilla.md · Precios",
    );
  });

  it("is named by the section of the URL when the title carries none", () => {
    expect(sourceLabel(source("cafe-la-horquilla.md", "/#la-regla-de-las-dos-bolsas"))).toBe(
      "cafe-la-horquilla.md · La regla de las dos bolsas",
    );
  });

  it("reads the section of an anchor as a person would say it", () => {
    expect(sourceSection(`${origin}/#la-regla-de-las-dos-bolsas`)).toBe("La regla de las dos bolsas");
    expect(sourceSection(`${origin}/#%C2%BFcu%C3%A1nto-guardar%3F`)).toBe("¿Cuánto guardar?");
  });

  it("treats the anchor of a citation and an empty anchor as no section at all", () => {
    expect(sourceSection(`${origin}/#cita-2`)).toBeNull();
    expect(sourceSection(`${origin}/`)).toBeNull();
    expect(sourceSection("no es una url")).toBeNull();
  });

  it("keeps the beginning of a long label and closes it with an ellipsis at a word boundary", () => {
    const long = `${"palabra ".repeat(20)}final`;
    const label = sourceLabel(source(long, "/#cita-1"));

    expect(label.length).toBeLessThanOrEqual(80);
    expect(label.endsWith("…")).toBe(true);
    expect(label).not.toContain("  ");
  });

  it("sends the chip to the path, the query and the anchor of the validated URL", () => {
    expect(sourcePath(`${origin}/#cita-3`)).toBe("/#cita-3");
    expect(sourcePath(`${origin}/embed?lang=es#cita-3`)).toBe("/embed?lang=es#cita-3");
  });
});
