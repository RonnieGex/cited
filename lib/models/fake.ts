import { MockLanguageModelV3 } from "ai/test";
import { detectLanguage } from "../answer/language.ts";
import type { ChatCall, ChatMessage } from "./types.ts";

const minimumTokenLength = 4;
const maximumSentence = 300;
const wordPattern = /[\p{L}\p{N}]+/gu;
const passagePattern =
  /<passage n="(\d+)" document="([^"]*)"(?: heading="([^"]*)")?>([\s\S]*?)<\/passage>/g;

const notes: Record<"es" | "en", string> = {
  es: "Respuesta del proveedor de prueba:",
  en: "Answer from the test provider:",
};

export type FakeCall = ChatCall;

export type FakeOptions = {
  reply?: string;
  onCall?: (call: FakeCall) => void;
};

type PromptMessage = {
  role: string;
  content: string | ReadonlyArray<{ type: string; text?: string }>;
};

type ParsedPassage = { n: number; document: string; heading: string | null; text: string };

function flatten(prompt: ReadonlyArray<PromptMessage>): ChatMessage[] {
  return prompt.map((message) => ({
    role: message.role === "assistant" ? "assistant" : message.role === "system" ? "system" : "user",
    content:
      typeof message.content === "string"
        ? message.content
        : message.content
            .filter((part) => part.type === "text")
            .map((part) => part.text ?? "")
            .join(""),
  }));
}

function tokens(text: string): string[] {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .match(wordPattern) ?? []
  ).filter((token) => token.length >= minimumTokenLength);
}

function passagesOf(message: string): ParsedPassage[] {
  const found: ParsedPassage[] = [];

  for (const match of message.matchAll(passagePattern)) {
    found.push({
      n: Number(match[1]),
      document: match[2] ?? "",
      heading: match[3] ?? null,
      text: (match[4] ?? "").trim(),
    });
  }

  return found;
}

function questionOf(message: string): string {
  const marker = message.lastIndexOf("Question:");

  return marker === -1 ? message : message.slice(marker + "Question:".length).trim();
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length > 0);
}

function answerFrom(messages: ChatMessage[]): string {
  const question = [...messages].reverse().find((message) => message.role === "user");
  const message = question?.content ?? "";
  const passages = passagesOf(message);
  const asked = tokens(questionOf(message));
  let best: { passage: ParsedPassage; score: number } | null = null;

  for (const passage of passages) {
    const words = new Set(tokens(passage.text));
    const score = asked.filter((token) => words.has(token)).length;

    if (best === null || score > best.score) {
      best = { passage, score };
    }
  }

  if (best === null || best.score === 0) {
    return "NO_ANSWER";
  }

  const words = new Set(tokens(best.passage.text));
  const sentence =
    sentences(best.passage.text).find((candidate) =>
      tokens(candidate).some((token) => asked.includes(token) && words.has(token)),
    ) ?? sentences(best.passage.text)[0] ?? best.passage.text;

  return `${notes[detectLanguage(questionOf(message))]} ${sentence.slice(0, maximumSentence)} [${best.passage.n}]`;
}

export function createFakeChatModel(options: FakeOptions = {}) {
  return new MockLanguageModelV3({
    provider: "cited",
    modelId: "fake",
    doGenerate: async (call) => {
      const messages = flatten(call.prompt as ReadonlyArray<PromptMessage>);

      options.onCall?.({
        messages,
        maxOutputTokens: call.maxOutputTokens ?? 0,
        temperature: call.temperature ?? 0,
      });

      return {
        content: [{ type: "text" as const, text: options.reply ?? answerFrom(messages) }],
        finishReason: { unified: "stop" as const, raw: "stop" },
        usage: {
          inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 0, text: 0, reasoning: 0 },
        },
        warnings: [],
      };
    },
  });
}
