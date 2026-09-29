// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { exampleText, setupGroups } from "@/lib/admin/setup";

const repositoryRoot = resolve(import.meta.dirname, "..");
const template = readFileSync(resolve(repositoryRoot, ".env.example"), "utf8");

describe("the setup page groups the template by purpose", () => {
  it("lists every variable of .env.example once", () => {
    const groups = setupGroups(template, {});
    const names = groups.flatMap((group) => group.variables.map((variable) => variable.name));
    const expected = [...template.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1] ?? "");

    expect(names).toEqual(expected);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain("ADMIN_PASSWORD");
    expect(names).toContain("CHAT_PROVIDER");
    expect(names).toContain("EMBEDDINGS_PROVIDER");
    expect(names).toContain("TURSO_AUTH_TOKEN");
    expect(names).toContain("ALLOWED_ORIGINS");
  });

  it("reads the purpose from the comments of the file", () => {
    const groups = setupGroups(template, {});
    const titles = groups.map((group) => group.title);

    expect(titles).toContain("Required");
    expect(titles).toContain("Model providers");
    expect(titles).toContain("Spending limits and abuse protection");

    const required = groups.find((group) => group.title === "Required");

    expect(required?.variables.map((variable) => variable.name)).toEqual([
      "ADMIN_PASSWORD",
      "ADMIN_SESSION_SECRET",
      "VOICE_TOOL_SECRET",
    ]);
    expect(required?.detail.length ?? 0).toBeGreaterThan(0);

    const providers = groups.find((group) => group.title === "Model providers");

    expect(providers?.variables.map((variable) => variable.name)).toContain("OPENAI_API_KEY");
  });

  it("marks what is set without ever carrying a value", () => {
    const groups = setupGroups(template, {
      ADMIN_PASSWORD: "una-clave-secreta",
      CHAT_PROVIDER: "fake",
      OPENAI_API_KEY: "   ",
    });
    const flat = groups.flatMap((group) => group.variables);
    const configured = flat.filter((variable) => variable.configured).map((variable) => variable.name);

    expect(configured).toEqual(["ADMIN_PASSWORD", "CHAT_PROVIDER"]);
    expect(JSON.stringify(groups)).not.toContain("una-clave-secreta");

    for (const variable of flat) {
      expect(Object.keys(variable).sort()).toEqual(["configured", "name"]);
    }
  });

  it("reads the template of the repository", () => {
    expect(exampleText()).toBe(template);
  });
});
