/**
 * The server tool of the voice agent: the answer of `answering` with its guards, written as plain text the agent can
 * speak and copy into `mostrar_fuentes`. The id of the ElevenLabs conversation travels as the `sessionId`, so a
 * follow-up inside one call keeps its thread and two calls never share one.
 *
 * The shape of the text is the contract of the prompt: the agent reads the `answer:` line out loud, passes every
 * `title` and `url` to the client tool and never repeats itself after that call returns (the lesson of Construye's
 * real session, design decision 4). The URLs are relative on purpose: the playbook records that an agent hands back
 * exactly what a webhook tool returned, so a relative URL can only ever become a chip of this site.
 */

import type { LanguageModel } from "ai";
import { askQuestion } from "../answer/ask.ts";
import type { Citation } from "../answer/types.ts";
import type { EmbeddingProvider } from "../embeddings/types.ts";
import type { ChatEnvironment } from "../models/types.ts";
import type { Store } from "../store/index.ts";

export type VoiceToolOutcome =
  | { status: "answered"; text: string; citations: Citation[] }
  | { status: "refused"; text: string }
  | { status: "invalid"; message: string }
  | { status: "rate_limited"; retryAfterSeconds: number; message: string }
  | { status: "unavailable"; message: string };

export type VoiceToolInput = {
  question: string;
  conversationId: string;
  store: Store;
  embeddings: EmbeddingProvider;
  model: LanguageModel;
  environment?: ChatEnvironment;
  ip: string;
  now?: Date;
};

/** The path of one citation of the page the visitor is on. The anchor is what the chip of the panel points at. */
export function citationUrl(n: number): string {
  return `/#cita-${n}`;
}

/** The document and the section of a citation, which is what names its chip. */
export function citationTitle(citation: Citation): string {
  const heading = citation.heading?.trim() ?? "";

  return heading.length === 0 ? citation.document : `${citation.document} · ${heading}`;
}

export function voiceText(input: { answer: string; citations: Citation[] }): string {
  const answer = input.answer.trim();

  if (input.citations.length === 0) {
    return `answer: ${answer}\nsources: none\n`;
  }

  const sources = input.citations
    .map((citation) => `${citation.n}. title: ${citationTitle(citation)}\n   url: ${citationUrl(citation.n)}`)
    .join("\n");

  return `answer: ${answer}\nsources:\n${sources}\n`;
}

export async function answerForVoice(input: VoiceToolInput): Promise<VoiceToolOutcome> {
  const outcome = await askQuestion({
    question: input.question,
    sessionId: input.conversationId,
    store: input.store,
    embeddings: input.embeddings,
    model: input.model,
    environment: input.environment,
    ip: input.ip,
    now: input.now,
  });

  if (outcome.status === "answered") {
    return {
      status: "answered",
      text: voiceText({ answer: outcome.answer, citations: outcome.citations }),
      citations: outcome.citations,
    };
  }

  if (outcome.status === "refused") {
    return { status: "refused", text: voiceText({ answer: outcome.answer, citations: [] }) };
  }

  if (outcome.status === "invalid") {
    return { status: "invalid", message: outcome.message };
  }

  if (outcome.status === "rate_limited") {
    return {
      status: "rate_limited",
      retryAfterSeconds: outcome.retryAfterSeconds,
      message: outcome.message,
    };
  }

  return { status: "unavailable", message: outcome.message };
}
