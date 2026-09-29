import type { Citation } from "../answer/types.ts";

// The browser half of `/api/ask`: the question travels with the `sessionId` of the tab and the answer comes back as one
// of the three states the chat paints. No provider is ever called from here: the endpoint is the only door.

export const ASK_ENDPOINT = "/api/ask";

export type AskResult =
  | { status: "answered"; answer: string; citations: Citation[] }
  | { status: "refused"; answer: string }
  | { status: "failed"; message: string | null };

export type AskInput = {
  question: string;
  sessionId: string;
  fetchImpl?: typeof fetch;
};

function recordOf(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null && Array.isArray(body) === false
    ? (body as Record<string, unknown>)
    : {};
}

function citationsOf(value: unknown): Citation[] | null {
  if (Array.isArray(value) === false) {
    return null;
  }

  return value as Citation[];
}

export async function askCited(input: AskInput): Promise<AskResult> {
  const send = input.fetchImpl ?? fetch;
  let response: Response;

  try {
    response = await send(ASK_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: input.question, sessionId: input.sessionId }),
    });
  } catch {
    return { status: "failed", message: null };
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    return { status: "failed", message: null };
  }

  const record = recordOf(body);

  if (response.ok) {
    const citations = citationsOf(record["citations"]);

    if (
      record["status"] === "answered" &&
      typeof record["answer"] === "string" &&
      citations !== null
    ) {
      return { status: "answered", answer: record["answer"], citations };
    }

    if (record["status"] === "refused" && typeof record["answer"] === "string") {
      return { status: "refused", answer: record["answer"] };
    }

    return { status: "failed", message: null };
  }

  return {
    status: "failed",
    message: typeof record["error"] === "string" ? record["error"] : null,
  };
}
