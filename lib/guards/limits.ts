import type { ChatEnvironment } from "../models/types.ts";

export type Limits = {
  maxQuestionChars: number;
  rateLimitPerIpPerHour: number;
  dailyModelCallLimit: number;
  maxAnswerTokens: number;
  conversationRetentionDays: number;
};

export const DEFAULT_LIMITS: Limits = {
  maxQuestionChars: 1000,
  rateLimitPerIpPerHour: 30,
  dailyModelCallLimit: 500,
  maxAnswerTokens: 600,
  conversationRetentionDays: 30,
};

function positive(environment: ChatEnvironment, name: string, fallback: number): number {
  const declared = Number(environment[name]?.trim() ?? "");

  return Number.isInteger(declared) && declared > 0 ? declared : fallback;
}

export function resolveLimits(environment: ChatEnvironment = process.env): Limits {
  return {
    maxQuestionChars: positive(environment, "MAX_QUESTION_CHARS", DEFAULT_LIMITS.maxQuestionChars),
    rateLimitPerIpPerHour: positive(
      environment,
      "RATE_LIMIT_PER_IP_PER_HOUR",
      DEFAULT_LIMITS.rateLimitPerIpPerHour,
    ),
    dailyModelCallLimit: positive(
      environment,
      "DAILY_MODEL_CALL_LIMIT",
      DEFAULT_LIMITS.dailyModelCallLimit,
    ),
    maxAnswerTokens: positive(environment, "MAX_ANSWER_TOKENS", DEFAULT_LIMITS.maxAnswerTokens),
    conversationRetentionDays: positive(
      environment,
      "CONVERSATION_RETENTION_DAYS",
      DEFAULT_LIMITS.conversationRetentionDays,
    ),
  };
}
