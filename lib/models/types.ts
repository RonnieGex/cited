export type ChatEnvironment = Record<string, string | undefined>;

export const CHAT_PROVIDER_NAMES = [
  "openai",
  "anthropic",
  "gemini",
  "deepseek",
  "groq",
  "openrouter",
  "ollama",
  "lmstudio",
  "fake",
] as const;

export type ChatProviderName = (typeof CHAT_PROVIDER_NAMES)[number];

export const DEFAULT_CHAT_MODELS: Record<ChatProviderName, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
  gemini: "gemini-3.8-flash",
  deepseek: "deepseek-flash",
  groq: "openai/gpt-oss-120b",
  openrouter: "openai/gpt-4o-mini",
  ollama: "llama3.1",
  lmstudio: "local-model",
  fake: "fake",
};

export const CHAT_PROVIDER_KEYS: Record<ChatProviderName, readonly string[]> = {
  openai: ["OPENAI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY"],
  gemini: ["GEMINI_API_KEY"],
  deepseek: ["DEEPSEEK_API_KEY"],
  groq: ["GROQ_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY"],
  ollama: [],
  lmstudio: [],
  fake: [],
};

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = { role: ChatRole; content: string };

export type ChatCall = {
  messages: ChatMessage[];
  maxOutputTokens: number;
  temperature: number;
};

export function selectedChatProvider(environment: ChatEnvironment): ChatProviderName {
  const selected = environment["CHAT_PROVIDER"]?.trim().toLowerCase() ?? "";

  if (CHAT_PROVIDER_NAMES.includes(selected as ChatProviderName) === false) {
    throw new Error(
      `CHAT_PROVIDER must be one of ${CHAT_PROVIDER_NAMES.join(", ")}; received an empty or unknown value.`,
    );
  }

  return selected as ChatProviderName;
}

export function chatModelName(environment: ChatEnvironment): string {
  const provider = selectedChatProvider(environment);
  const declared = environment["CHAT_MODEL"]?.trim() ?? "";

  return declared.length > 0 ? declared : DEFAULT_CHAT_MODELS[provider];
}
