import { askQuestion } from "../../../lib/answer/ask.ts";
import type { AskOutcome } from "../../../lib/answer/types.ts";
import { embeddingsFrom } from "../../../lib/embeddings/providers.ts";
import { clientIp } from "../../../lib/guards/ip.ts";
import { publicMessage } from "../../../lib/guards/outbound.ts";
import { chatModelFrom } from "../../../lib/models/providers.ts";
import {
  chatProblem,
  embeddingsConfigured,
  resolveChat,
  resolveEmbeddings,
} from "../../../lib/settings/providers.ts";
import { sharedStore } from "../../../lib/store/instance.ts";

export const runtime = "nodejs";

// The sentences of the public route. Requirement "No provider error reaches the browser" of
// `specs/provider-settings/spec.md`: neither the text of an error of a provider or of its SDK nor the name of a
// variable of the environment leaves this route. The browser of the visitor reads one of these, and whoever installs
// reads the diagnostic in the command line (`npm run ask`), which does name the variable
// (`proposal.md`, amended after `revision-community-12`).
const NO_ANSWER = "the AI could not answer right now";
const NOT_CONNECTED =
  "the AI is not connected yet: the owner connects it in the panel, or whoever installs Cited sets it on the server";

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

// Every sentence of this route goes through here: what a visitor may read carries no shape of a key and no name of a
// variable of the environment, whichever branch wrote it — the limits of `askQuestion()` name their variables in the
// messages of the command line, and this route is not the command line.
function failed(
  outcome: Extract<AskOutcome, { status: "invalid" | "rate_limited" | "unavailable" }>,
): Response {
  const message = publicMessage(outcome.message);

  if (outcome.status === "invalid") {
    return answer({ status: "invalid", error: message || "the question cannot be asked" }, 400);
  }

  if (outcome.status === "rate_limited") {
    return answer({ status: "rate_limited", error: message || "too many questions in an hour" }, 429, {
      "retry-after": String(outcome.retryAfterSeconds),
    });
  }

  return answer(
    { status: "unavailable", error: message || "the AI could not answer right now" },
    503,
  );
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
    // The provider of the answers and the embeddings of the search come from the resolver: the environment of the
    // server first, the panel after it. The diagnostic of `chatProblem()` names what is missing for whoever installs
    // and is read by the command line (`scripts/ask.ts`); this route answers its own closed sentence and never the
    // name of a variable of the environment.
    const store = await sharedStore(process.env);
    const chat = await resolveChat({ environment: process.env, store });

    if (chat.provider === null || chatProblem(chat) !== null) {
      return answer({ status: "unavailable", error: NOT_CONNECTED }, 503);
    }

    const resolved = await resolveEmbeddings({ environment: process.env, store });

    if (embeddingsConfigured(resolved) === false) {
      return answer({ status: "unavailable", error: NOT_CONNECTED }, 503);
    }

    const embeddings = embeddingsFrom(resolved);
    const model = chatModelFrom({
      provider: chat.provider,
      model: chat.model,
      key: chat.key,
      baseUrl: chat.baseUrl,
      // The address the owner saved in the panel is pinned: the connection goes to the address the guard classified
      // in this request and never to a second resolution of the name (task 11.2).
      ...(chat.fetch === undefined ? {} : { fetch: chat.fetch }),
    });

    try {
      outcome = await askQuestion({
        question: parsed.question,
        sessionId: parsed.sessionId,
        store,
        embeddings,
        model,
        environment: process.env,
        ip: clientIp(request, process.env),
      });
    } catch {
      // The pipeline talks to the provider, and the text of an error of a provider or of its SDK is exactly what the
      // requirement keeps out of the browser: the Blocker B-1 of `revision-community-12.md` was this message, with the
      // saved key inside when the provider echoed it. The public route answers its own sentence and the provider is
      // not quoted, not even redacted.
      return answer({ status: "unavailable", error: NO_ANSWER }, 503);
    }
  } catch {
    // Anything else that fails while reading the store or the resolver is a problem of the installation, not of the
    // visitor: the sentence of the route, never the text of the exception.
    return answer({ status: "unavailable", error: NOT_CONNECTED }, 503);
  }

  if (outcome.status === "answered" || outcome.status === "refused") {
    return answer(outcome, 200);
  }

  return failed(outcome);
}
