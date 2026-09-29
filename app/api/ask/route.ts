import { askQuestion } from "../../../lib/answer/ask.ts";
import type { AskOutcome } from "../../../lib/answer/types.ts";
import { resolveEmbeddingsProvider } from "../../../lib/embeddings/providers.ts";
import { clientIp } from "../../../lib/guards/ip.ts";
import { resolveChatModel } from "../../../lib/models/providers.ts";
import { sharedStore } from "../../../lib/store/instance.ts";

export const runtime = "nodejs";

type AskBody = { question: string; sessionId?: string };

function answer(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

function parseBody(body: unknown): AskBody | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }

  const record = body as Record<string, unknown>;
  const question = record["question"];
  const sessionId = record["sessionId"];

  if (typeof question !== "string") {
    return null;
  }

  if (sessionId !== undefined && typeof sessionId !== "string") {
    return null;
  }

  return sessionId === undefined ? { question } : { question, sessionId };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "the server is not configured";
}

function failed(
  outcome: Extract<AskOutcome, { status: "invalid" | "rate_limited" | "unavailable" }>,
): Response {
  if (outcome.status === "invalid") {
    return answer({ status: "invalid", error: outcome.message }, 400);
  }

  if (outcome.status === "rate_limited") {
    return answer({ status: "rate_limited", error: outcome.message }, 429, {
      "retry-after": String(outcome.retryAfterSeconds),
    });
  }

  return answer({ status: "unavailable", error: outcome.message }, 503);
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json") === false) {
    return answer(
      { status: "invalid", error: "the request must carry a JSON body" },
      415,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return answer({ status: "invalid", error: "the body is not valid JSON" }, 400);
  }

  const parsed = parseBody(body);

  if (parsed === null) {
    return answer(
      { status: "invalid", error: 'the body must be {"question": string, "sessionId"?: string}' },
      400,
    );
  }

  let outcome: AskOutcome;

  try {
    const embeddings = resolveEmbeddingsProvider(process.env);
    const model = resolveChatModel(process.env);
    const store = await sharedStore(process.env);

    outcome = await askQuestion({
      question: parsed.question,
      sessionId: parsed.sessionId,
      store,
      embeddings,
      model,
      environment: process.env,
      ip: clientIp(request, process.env),
    });
  } catch (error) {
    return answer({ status: "unavailable", error: messageOf(error) }, 503);
  }

  if (outcome.status === "answered" || outcome.status === "refused") {
    return answer(outcome, 200);
  }

  return failed(outcome);
}
