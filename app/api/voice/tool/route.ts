/**
 * `POST /api/voice/tool`, the webhook the ElevenLabs agent calls for every question. It requires the Bearer of the
 * installation compared in constant time, answers the question through the pipeline of `answering` with its guards,
 * and returns the answer with its citations as plain text.
 */

import { resolveEmbeddingsProvider } from "../../../../lib/embeddings/providers.ts";
import { clientIp } from "../../../../lib/guards/ip.ts";
import { resolveChatModel } from "../../../../lib/models/providers.ts";
import { sharedStore } from "../../../../lib/store/instance.ts";
import { declared } from "../../../../lib/voice/config.ts";
import { bearerOf, secretMatches } from "../../../../lib/voice/secret.ts";
import { answerForVoice } from "../../../../lib/voice/tool.ts";

export const runtime = "nodejs";

type ToolBody = { question: string; conversationId: string };

function text(body: string, status: number, headers: Record<string, string> = {}): Response {
  return new Response(`${body}\n`, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function parse(body: unknown): ToolBody | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }

  const record = body as Record<string, unknown>;
  const question = record["question"];
  const conversationId = record["conversation_id"];

  if (typeof question !== "string" || typeof conversationId !== "string") {
    return null;
  }

  return { question, conversationId };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "the server is not configured";
}

export async function POST(request: Request): Promise<Response> {
  const secret = declared(process.env, "VOICE_TOOL_SECRET");

  if (secretMatches(bearerOf(request.headers.get("authorization")), secret) === false) {
    return text("unauthorized", 401);
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json") === false) {
    return text("the request must carry a JSON body", 415);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return text("the body is not valid JSON", 400);
  }

  const parsed = parse(body);

  if (parsed === null) {
    return text('the body must be {"question": string, "conversation_id": string}', 400);
  }

  try {
    const embeddings = resolveEmbeddingsProvider(process.env);
    const model = resolveChatModel(process.env);
    const store = await sharedStore(process.env);
    const outcome = await answerForVoice({
      question: parsed.question,
      conversationId: parsed.conversationId,
      store,
      embeddings,
      model,
      environment: process.env,
      ip: clientIp(request, process.env),
    });

    if (outcome.status === "answered" || outcome.status === "refused") {
      return text(outcome.text, 200);
    }

    if (outcome.status === "invalid") {
      return text(outcome.message, 400);
    }

    if (outcome.status === "rate_limited") {
      return text(outcome.message, 429, { "retry-after": String(outcome.retryAfterSeconds) });
    }

    return text(outcome.message, 503);
  } catch (error) {
    return text(messageOf(error), 503);
  }
}
