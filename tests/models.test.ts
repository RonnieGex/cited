import { afterEach, describe, expect, it, vi } from "vitest";
import { createFakeChatModel } from "@/lib/models/fake";
import { resolveChatModel } from "@/lib/models/providers";
import { CHAT_PROVIDER_NAMES, DEFAULT_CHAT_MODELS, chatModelName } from "@/lib/models/types";

const keyOf: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  groq: "GROQ_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

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
