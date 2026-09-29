import { REFUSALS } from "../answer/prompt.ts";
import type { Store } from "../store/index.ts";

export const CONVERSATION_LIMIT = 50;

export type ConversationSummary = {
  sessionId: string;
  turn: number;
  question: string;
  answer: string;
  status: "answered" | "refused";
  citations: number[];
  createdAt: string;
};

const refusalAnswers = new Set(Object.values(REFUSALS));
const citationPattern = /\[(\d+)\]/g;

export async function conversationSummaries(
  store: Store,
  limit: number = CONVERSATION_LIMIT,
): Promise<ConversationSummary[]> {
  const turns = await store.listRecentTurns(limit);

  return turns.map((turn) => ({
    sessionId: turn.sessionId,
    turn: turn.turn,
    question: turn.question,
    answer: turn.answer,
    status: refusalAnswers.has(turn.answer.trim()) ? "refused" : "answered",
    citations: [...turn.answer.matchAll(citationPattern)].map((match) => Number(match[1])),
    createdAt: turn.createdAt,
  }));
}
