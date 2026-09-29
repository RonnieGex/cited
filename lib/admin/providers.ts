import { generateText } from "ai";
import { resolveEmbeddingsProvider } from "../embeddings/providers.ts";
import { resolveChatModel } from "../models/providers.ts";
import type { AdminEnvironment } from "./session.ts";

export type ProviderTarget = "chat" | "embeddings";

export type ProviderCheck = {
  status: "ok" | "error";
  target: ProviderTarget;
  detail: string;
};

const keyPattern = /sk-[A-Za-z0-9_-]{6,}/g;
const bearerPattern = /Bearer\s+[A-Za-z0-9._-]{6,}/gi;

export function redact(text: string, environment: AdminEnvironment): string {
  let clean = text;

  for (const value of Object.values(environment)) {
    const trimmed = value?.trim() ?? "";

    if (trimmed.length >= 6) {
      clean = clean.replaceAll(trimmed, "[redacted]");
    }
  }

  return clean.replaceAll(keyPattern, "[redacted]").replaceAll(bearerPattern, "Bearer [redacted]");
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "the provider is not configured";
}

export async function testChatProvider(
  environment: AdminEnvironment,
): Promise<ProviderCheck> {
  try {
    const model = resolveChatModel(environment);
    const answered = await generateText({
      model,
      messages: [{ role: "user", content: "ping" }],
      maxOutputTokens: 8,
    });
    const text = answered.text.trim();

    return {
      status: "ok",
      target: "chat",
      detail: `the model answered ${text.length === 0 ? "with an empty message" : text.slice(0, 120)}`,
    };
  } catch (error) {
    return { status: "error", target: "chat", detail: redact(messageOf(error), environment) };
  }
}

export async function testEmbeddingsProvider(
  environment: AdminEnvironment,
): Promise<ProviderCheck> {
  try {
    const provider = resolveEmbeddingsProvider(environment);
    const vector = await provider.embedQuery("ping");

    if (vector.length === 0) {
      return {
        status: "error",
        target: "embeddings",
        detail: "the provider answered without a vector",
      };
    }

    return {
      status: "ok",
      target: "embeddings",
      detail: `the provider answered a vector of ${vector.length} numbers`,
    };
  } catch (error) {
    return { status: "error", target: "embeddings", detail: redact(messageOf(error), environment) };
  }
}
