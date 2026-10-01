// Requirement "The guided setup has one Spanish name" of the delta `admin-panel` (decision 8 of `design.md`): the
// Spanish string of the guided setup is "configuración guiada", and no file of the interface, the library or the
// documentation says "alta guiada" or "de la alta".

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_STRINGS } from "@/lib/i18n/admin";

const repositoryRoot = resolve(import.meta.dirname, "..");
const spanish = ADMIN_STRINGS.es;

describe("one Spanish name for the guided setup", () => {
  it("says configuración guiada and never alta guiada", () => {
    const file = readFileSync(resolve(repositoryRoot, "lib/i18n/admin.ts"), "utf8");

    expect(file).not.toContain("alta guiada");
    expect(file).not.toContain("de la alta");
    expect(file).not.toContain("la alta ");
    expect(spanish.setupOpen).toBe("Abrir la configuración guiada");
    expect(spanish.setupReopen).toBe("Abrir la configuración guiada otra vez");
    expect(spanish.setupSkippedNote).toBe("La configuración guiada está oculta. Puedes abrirla otra vez cuando quieras.");
    expect(spanish.setupStepsTitle).toBe("Tu configuración guiada");
  });

  it("follows the Spanish documentation of the repository", () => {
    const files = ["README.es.md", "docs/owner-guide.md"];

    for (const path of files) {
      const text = readFileSync(resolve(repositoryRoot, path), "utf8");

      expect(text, path).not.toContain("alta guiada");
      expect(text, path).not.toContain("de la alta");
    }
  });

  it("keeps the English strings untouched", () => {
    expect(ADMIN_STRINGS.en.setupOpen).toBe("Open the setup");
    expect(ADMIN_STRINGS.en.setupStepsTitle).toBe("Your setup");
  });
});
