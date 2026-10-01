import type { Citation } from "../answer/types.ts";

// The browser half of `/api/ask`: the question travels with the `sessionId` of the tab and the answer comes back as one
// of the three states the chat paints. No provider is ever called from here: the endpoint is the only door.

export const ASK_ENDPOINT = "/api/ask";

/**
 * Why a question got no answer. Decision 21 of `openspec/changes/brand-identity-ui/design.md`: the page says one sentence
 * per kind, in the language of the visitor, and never prints what the server wrote (it names variables of the
 * environment and speaks English on the Spanish page).
 */
export type AskFailureKind = "rate_limited" | "unavailable" | "network";

export type AskResult =
  | { status: "answered"; answer: string; citations: Citation[] }
  | { status: "refused"; answer: string }
  | { status: "failed"; kind: AskFailureKind };

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

  // The lead of a citation is the field of `passage-display-polish`: it arrives as a number, and an answer of an
  // installation whose server is older than this page carries none, which reads as 0 (the whole excerpt is its own).
  return (value as Citation[]).map((citation) => ({
    ...citation,
    lead: typeof citation.lead === "number" && Number.isFinite(citation.lead) ? citation.lead : 0,
  }));
}

const unavailable: AskResult = { status: "failed", kind: "unavailable" };

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
    return { status: "failed", kind: "network" };
  }

  // The status decides the kind and the body of a failure is never read: its words are for the logs of the server.
  if (response.ok === false) {
    return response.status === 429 ? { status: "failed", kind: "rate_limited" } : unavailable;
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    return unavailable;
  }

  const record = recordOf(body);
  const citations = citationsOf(record["citations"]);

  if (record["status"] === "answered" && typeof record["answer"] === "string" && citations !== null) {
    return { status: "answered", answer: record["answer"], citations };
  }

  if (record["status"] === "refused" && typeof record["answer"] === "string") {
    return { status: "refused", answer: record["answer"] };
  }

  return unavailable;
}
