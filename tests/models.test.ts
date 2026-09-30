import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFakeChatModel } from "@/lib/models/fake";
import { chatModelFrom, resolveChatModel } from "@/lib/models/providers";
import {
  CHAT_PROVIDER_NAMES,
  DEFAULT_CHAT_MODELS,
  chatModelName,
  type ChatProviderName,
} from "@/lib/models/types";

const keyOf: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  groq: "GROQ_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

// The official pages the review cites, read on the date of the change (2026-09-29), plus the page of the local
// server and, for the deterministic provider, this repository. See `docs/answering.md` section 8.
const checkedOn = "2026-09-29";
const officialHosts = [
  "https://developers.openai.com/",
  "https://platform.openai.com/",
  "https://platform.claude.com/",
  "https://docs.anthropic.com/",
  "https://ai.google.dev/",
  "https://api-docs.deepseek.com/",
  "https://console.groq.com/",
  "https://openrouter.ai/",
  "https://ollama.com/",
  "https://lmstudio.ai/",
];
const repositorySource = "lib/models/fake.ts";

const servedOn = (): Record<ChatProviderName, string> => ({
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
  gemini: "gemini-3.8-flash",
  deepseek: "deepseek-flash",
  groq: "openai/gpt-oss-120b",
  openrouter: "openai/gpt-4o-mini",
  ollama: "llama3.1",
  lmstudio: "local-model",
  fake: "fake",
});

type DefaultRow = { provider: string; model: string; source: string; checked: string };

function documentationDefaults(): DefaultRow[] {
  const documentation = readFileSync(resolve(import.meta.dirname, "../docs/answering.md"), "utf8");
  const rows: DefaultRow[] = [];

  for (const line of documentation.split("\n")) {
    const cells = line.startsWith("|")
      ? line
          .slice(1, -1)
          .split("|")
          .map((cell) => cell.trim().replaceAll("`", ""))
      : [];

    if (cells.length < 6) {
      continue;
    }

    const provider = cells[0] ?? "";

    if ((CHAT_PROVIDER_NAMES as readonly string[]).includes(provider) === false) {
      continue;
    }

    rows.push({
      provider,
      model: cells[2] ?? "",
      source: cells[4] ?? "",
      checked: cells[5] ?? "",
    });
  }

  return rows;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the chat provider is chosen by variables", () => {
  it("names the nine providers of the contract", () => {
    expect([...CHAT_PROVIDER_NAMES]).toEqual([
      "openai",
      "anthropic",
      "gemini",
      "deepseek",
      "groq",
      "openrouter",
      "ollama",
      "lmstudio",
      "fake",
    ]);

    for (const provider of CHAT_PROVIDER_NAMES) {
      expect(DEFAULT_CHAT_MODELS[provider], provider).toMatch(/\S/);
    }
  });

  it("fails without the key of every provider that needs one, and names the variable", () => {
    for (const [provider, variable] of Object.entries(keyOf)) {
      expect(() => resolveChatModel({ CHAT_PROVIDER: provider }), provider).toThrow(
        new RegExp(variable),
      );
    }
  });

  it("never puts a value of the environment in the message", () => {
    const environment = {
      CHAT_PROVIDER: "openai",
      OPENAI_API_KEY: "",
      ANTHROPIC_API_KEY: "sk-ant-value-that-must-not-travel",
    };

    expect(() => resolveChatModel(environment)).toThrow(/OPENAI_API_KEY/);

    try {
      resolveChatModel(environment);
    } catch (error) {
      expect(String(error)).not.toContain("sk-ant-value-that-must-not-travel");
    }
  });

  it("refuses an empty or unknown provider with the list of names", () => {
    expect(() => resolveChatModel({})).toThrow(/openai, anthropic, gemini, deepseek/);
    expect(() => resolveChatModel({ CHAT_PROVIDER: "chatgpt" })).toThrow(
      /openai, anthropic, gemini, deepseek/,
    );
  });

  // Decision 23 of the third amendment: no silent fake. The constructor builds the test double only when the provider
  // is literally `fake`; any other name outside the catalogue throws instead of answering with the double, whatever a
  // row of the store says (the Major M-8 of `katalis-dev/tasks/revision-community-13c.md`).
  it("refuses to build a model for a name outside the catalogue", () => {
    const nameOfARow: string = "unknown-provider";

    expect(() =>
      chatModelFrom({
        provider: nameOfARow as ChatProviderName,
        model: "modelo-de-prueba",
        key: "llave-de-prueba-000000000000",
        baseUrl: "",
      }),
    ).toThrow(/not one Cited knows/);
  });

  it("builds the fake provider with no key", () => {
    const model = resolveChatModel({ CHAT_PROVIDER: "fake" });

    expect(model).toBeDefined();
    expect(chatModelName({ CHAT_PROVIDER: "fake" })).toBe(DEFAULT_CHAT_MODELS.fake);
    expect(chatModelName({ CHAT_PROVIDER: "fake", CHAT_MODEL: "modelo-propio" })).toBe(
      "modelo-propio",
    );
  });

  it("uses the model of CHAT_MODEL for every provider", () => {
    for (const provider of CHAT_PROVIDER_NAMES) {
      expect(chatModelName({ CHAT_PROVIDER: provider, CHAT_MODEL: "mi-modelo" }), provider).toBe(
        "mi-modelo",
      );
    }
  });

  it("constructs every provider without a network call", () => {
    const offline = vi.fn(() => {
      throw new Error("a test tried to reach the network");
    });

    vi.stubGlobal("fetch", offline);

    const environment: Record<string, string> = {
      OLLAMA_BASE_URL: "http://127.0.0.1:11434",
      LMSTUDIO_BASE_URL: "http://127.0.0.1:1234/v1",
    };

    for (const [provider, variable] of Object.entries(keyOf)) {
      environment[variable] = "clave-de-prueba-sin-valor-real";
      environment["CHAT_PROVIDER"] = provider;

      expect(resolveChatModel(environment), provider).toBeDefined();
    }

    environment["CHAT_PROVIDER"] = "ollama";
    expect(resolveChatModel(environment)).toBeDefined();
    environment["CHAT_PROVIDER"] = "lmstudio";
    expect(resolveChatModel(environment)).toBeDefined();
    environment["CHAT_PROVIDER"] = "fake";
    expect(resolveChatModel(environment)).toBeDefined();
    expect(offline).not.toHaveBeenCalled();
  });

  it("builds the deterministic model of the tests with no key and no network", () => {
    const offline = vi.fn(() => {
      throw new Error("a test tried to reach the network");
    });

    vi.stubGlobal("fetch", offline);

    expect(createFakeChatModel()).toBeDefined();
    expect(offline).not.toHaveBeenCalled();
  });
});

describe("the defaults of the chat providers are current", () => {
  it("names the model its provider still served on the date of the change", () => {
    expect(DEFAULT_CHAT_MODELS).toEqual(servedOn());
    expect(DEFAULT_CHAT_MODELS.deepseek).toBe("deepseek-flash");
  });

  it("records every default in the documentation with its official source and the date", () => {
    const rows = documentationDefaults();

    expect(rows.map((row) => row.provider)).toEqual([...CHAT_PROVIDER_NAMES]);

    for (const row of rows) {
      const provider = row.provider as ChatProviderName;

      expect(row.model, provider).toBe(DEFAULT_CHAT_MODELS[provider]);
      expect(row.checked, provider).toBe(checkedOn);
      expect(
        officialHosts.some((host) => row.source.startsWith(host)) || row.source === repositorySource,
        `${provider}: ${row.source}`,
      ).toBe(true);
    }
  });
});
