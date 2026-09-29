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

function optionalBaseUrl(environment: ChatEnvironment, name: string): string {
  return (environment[name]?.trim() ?? "").replace(/\/+$/, "");
}

export type ChatCredentials = {
  provider: ChatProviderName;
  model: string;
  key: string;
  baseUrl: string;
};

// The one place that builds a chat model, from credentials that the caller already resolved: the server environment
// through `resolveChat()` (decision 3 of `openspec/changes/provider-keys-in-panel/design.md`) or the values the owner
// pasted in the panel. The pipeline never reads a provider variable on its own.
export function chatModelFrom(credentials: ChatCredentials): LanguageModel {
  const { provider, model, key, baseUrl: url } = credentials;

  if (provider === "fake") {
    return createFakeChatModel();
  }

  const withUrl = (fallback: string): string => (url.length > 0 ? url : fallback);

  switch (provider) {
    case "openai":
      return createOpenAI(url.length > 0 ? { apiKey: key, baseURL: url } : { apiKey: key })(model);
    case "anthropic":
      return createAnthropic(url.length > 0 ? { apiKey: key, baseURL: url } : { apiKey: key })(
        model,
      );
    case "gemini":
      return createGoogleGenerativeAI(
        url.length > 0 ? { apiKey: key, baseURL: url } : { apiKey: key },
      )(model);
    case "deepseek":
      return createDeepSeek(url.length > 0 ? { apiKey: key, baseURL: url } : { apiKey: key })(
        model,
      );
    case "groq":
      return createGroq(url.length > 0 ? { apiKey: key, baseURL: url } : { apiKey: key })(model);
    case "openrouter":
      return createOpenAICompatible({
        name: "openrouter",
        baseURL: withUrl(defaultOpenRouterUrl),
        apiKey: key,
      })(model);
    case "ollama":
      return createOpenAICompatible({
        name: "ollama",
        baseURL: withUrl(defaultOllamaUrl),
      })(model);
    case "lmstudio":
      return createOpenAICompatible({
        name: "lmstudio",
        baseURL: withUrl(defaultLmStudioUrl),
      })(model);
    default:
      return createFakeChatModel();
  }
}

export type ServerChat = {
  provider: ChatProviderName;
  model: string;
  key: string;
  baseUrl: string;
  missing: string[];
};

// The chat provider the server environment names, with the variables it names and leaves empty instead of throwing:
// the resolver needs to report them and the panel needs to show them without a value.
export function serverChatCredentials(environment: ChatEnvironment = process.env): ServerChat {
  const provider = selectedChatProvider(environment);
  const names = CHAT_PROVIDER_KEYS[provider];
  const first = names[0];
  const key = first === undefined ? "" : (environment[first]?.trim() ?? "");
  const declared = optionalBaseUrl(environment, `${provider.toUpperCase()}_BASE_URL`);

  return {
    provider,
    model: chatModelName(environment),
    key,
    baseUrl:
      declared.length > 0
        ? declared
        : provider === "ollama"
          ? baseUrl(environment, "OLLAMA_BASE_URL", defaultOllamaUrl)
          : provider === "lmstudio"
            ? baseUrl(environment, "LMSTUDIO_BASE_URL", defaultLmStudioUrl)
            : "",
    missing: names.filter((name) => (environment[name]?.trim() ?? "").length === 0),
  };
}

export function resolveChatModel(environment: ChatEnvironment = process.env): LanguageModel {
  const credentials = serverChatCredentials(environment);

  for (const name of credentials.missing) {
    required(environment, name, credentials.provider);
  }

  return chatModelFrom(credentials);
}
