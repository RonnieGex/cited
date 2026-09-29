import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { createFakeChatModel } from "./fake.ts";
import type { ChatEnvironment, ChatProviderName } from "./types.ts";
import { CHAT_PROVIDER_KEYS, chatModelName, selectedChatProvider } from "./types.ts";

const defaultOpenRouterUrl = "https://openrouter.ai/api/v1";
const defaultOllamaUrl = "http://localhost:11434/v1";
const defaultLmStudioUrl = "http://localhost:1234/v1";

function required(
  environment: ChatEnvironment,
  name: string,
  provider: ChatProviderName,
): string {
  const value = environment[name]?.trim() ?? "";

  if (value.length === 0) {
    throw new Error(
      `The ${provider} chat provider needs ${name}. Fill it in the environment of the server; an empty value is an absent value.`,
    );
  }

  return value;
}

function baseUrl(environment: ChatEnvironment, name: string, fallback: string): string {
  return (environment[name]?.trim() ?? "").replace(/\/+$/, "") || fallback;
}

function withKeys(
  environment: ChatEnvironment,
  provider: ChatProviderName,
): Record<string, string> {
  const keys: Record<string, string> = {};

  for (const variable of CHAT_PROVIDER_KEYS[provider]) {
    keys[variable] = required(environment, variable, provider);
  }

  return keys;
}

export function resolveChatModel(environment: ChatEnvironment = process.env): LanguageModel {
  const provider = selectedChatProvider(environment);
  const model = chatModelName(environment);

  if (provider === "fake") {
    return createFakeChatModel();
  }

  const keys = withKeys(environment, provider);

  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey: keys["OPENAI_API_KEY"] })(model);
    case "anthropic":
      return createAnthropic({ apiKey: keys["ANTHROPIC_API_KEY"] })(model);
    case "gemini":
      return createGoogleGenerativeAI({ apiKey: keys["GEMINI_API_KEY"] })(model);
    case "deepseek":
      return createDeepSeek({ apiKey: keys["DEEPSEEK_API_KEY"] })(model);
    case "groq":
      return createGroq({ apiKey: keys["GROQ_API_KEY"] })(model);
    case "openrouter":
      return createOpenAICompatible({
        name: "openrouter",
        baseURL: defaultOpenRouterUrl,
        apiKey: keys["OPENROUTER_API_KEY"],
      })(model);
    case "ollama":
      return createOpenAICompatible({
        name: "ollama",
        baseURL: baseUrl(environment, "OLLAMA_BASE_URL", defaultOllamaUrl),
      })(model);
    case "lmstudio":
      return createOpenAICompatible({
        name: "lmstudio",
        baseURL: baseUrl(environment, "LMSTUDIO_BASE_URL", defaultLmStudioUrl),
      })(model);
    default:
      return createFakeChatModel();
  }
}
