import { generateText, type LanguageModel } from "ai";
import type { EmbeddingProvider } from "../embeddings/types.ts";
import { hashIp } from "../guards/ip.ts";
import { resolveLimits } from "../guards/limits.ts";
import { purgeStore } from "../guards/retention.ts";
import { dayOf, hourWindowStart, retryAfterSeconds } from "../guards/window.ts";
import type { ChatEnvironment } from "../models/types.ts";
import { hybridSearch } from "../search/index.ts";
import type { Store } from "../store/index.ts";
import { readBusiness } from "../settings/business.ts";
import { extractCitations } from "./citations.ts";
import { citationsWithLeadFromStore } from "./lead.ts";
import { NO_ANSWER, buildMessages, refusalMessage } from "./prompt.ts";
import type { Turn } from "./prompt.ts";
import type { AskOutcome } from "./types.ts";

export const ANSWER_TEMPERATURE = 0.2;
export const HISTORY_TURNS = 6;

let lastPurgeAt: number | null = null;

export type AskInput = {
  question: string;
  sessionId?: string | null;
  store: Store;
  /** `null` is keyword mode: the search ranks with FTS5 alone and no embeddings provider is called. */
  embeddings: EmbeddingProvider | null;
  model: LanguageModel;
  environment?: ChatEnvironment;
  ip: string;
  now?: Date;
};

function refused(question: string): AskOutcome {
  return { status: "refused", answer: refusalMessage(question), citations: [] };
}

export async function askQuestion(input: AskInput): Promise<AskOutcome> {
  const environment = input.environment ?? process.env;
  const limits = resolveLimits(environment);
  const now = input.now ?? new Date();
  const question = input.question.trim();
  const sessionId = input.sessionId?.trim() ?? "";

  if (question.length === 0) {
    return { status: "invalid", reason: "question_missing", message: "the question is empty" };
  }

  if (question.length > limits.maxQuestionChars) {
    return {
      status: "invalid",
      reason: "question_too_long",
      message: `the question is longer than MAX_QUESTION_CHARS (${limits.maxQuestionChars} characters)`,
    };
  }

  const purge = await purgeStore(input.store, {
    now,
    retentionDays: limits.conversationRetentionDays,
    lastPurgeAt,
  });

  if (purge.purged) {
    lastPurgeAt = purge.lastPurgeAt;
  }

  const ipHash = hashIp(input.ip, environment["ADMIN_SESSION_SECRET"]);
  const asked = await input.store.recordQuestion(ipHash, hourWindowStart(now));

  if (asked > limits.rateLimitPerIpPerHour) {
    return {
      status: "rate_limited",
      retryAfterSeconds: retryAfterSeconds(now),
      message: `more than RATE_LIMIT_PER_IP_PER_HOUR (${limits.rateLimitPerIpPerHour}) questions from this address in an hour`,
    };
  }

  const hits = await hybridSearch(question, { store: input.store, embeddings: input.embeddings });

  if (hits.length === 0) {
    return refused(question);
  }

  const history: Turn[] =
    sessionId.length === 0
      ? []
      : (await input.store.turnsOf(sessionId, HISTORY_TURNS)).map((turn) => ({
          question: turn.question,
          answer: turn.answer,
        }));

  const day = dayOf(now);
  const reserved = await input.store.reserveModelCall(day, limits.dailyModelCallLimit);

  if (reserved === null) {
    return {
      status: "unavailable",
      reason: "daily_limit",
      message: `the daily limit of model calls (DAILY_MODEL_CALL_LIMIT=${limits.dailyModelCallLimit}) is reached; it resets at 00:00 UTC`,
    };
  }

  const business = await readBusiness(environment);
  const generated = await generateText({
    model: input.model,
    messages: buildMessages({ question, hits, history, business }),
    allowSystemInMessages: true,
    maxOutputTokens: limits.maxAnswerTokens,
    temperature: ANSWER_TEMPERATURE,
  });
  const raw = generated.text.trim();

  if (raw === NO_ANSWER) {
    return refused(question);
  }

  const parsed = extractCitations(raw, hits);

  if (parsed.citations.length === 0) {
    return refused(question);
  }

  const citations = await citationsWithLeadFromStore(input.store, parsed.citations);

  if (sessionId.length > 0) {
    await input.store.appendTurn({ sessionId, question, answer: parsed.answer });
  }

  return { status: "answered", answer: parsed.answer, citations };
}
