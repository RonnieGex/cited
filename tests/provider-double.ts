import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";

// The local HTTP double of every provider. Requirement "Testing a provider is bounded" of
// `specs/provider-settings/spec.md` and the rules of the change: no test reaches a real provider, so every provider is
// this server, listening on an ephemeral port of `127.0.0.1`, and every request it receives is recorded.

export type DoubleRequest = {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  authorization: string | null;
  body: Record<string, unknown> | null;
};

export type DoubleAnswer = {
  status: number;
  body?: unknown;
  /** Answer nothing at all: the caller has to time out. */
  hang?: boolean;
};

export type ProviderDouble = {
  url: string;
  requests: DoubleRequest[];
  close(): Promise<void>;
};

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];

    request.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

export async function providerDouble(
  handler: (request: DoubleRequest) => DoubleAnswer | Promise<DoubleAnswer>,
): Promise<ProviderDouble> {
  const requests: DoubleRequest[] = [];
  const server = createServer((incoming, outgoing) => {
    void (async () => {
      const raw = await readBody(incoming);
      const authorization = incoming.headers["authorization"];
      const request: DoubleRequest = {
        method: incoming.method ?? "GET",
        path: incoming.url ?? "/",
        headers: incoming.headers,
        authorization: typeof authorization === "string" ? authorization : null,
        body:
          raw.length === 0
            ? null
            : (JSON.parse(raw) as Record<string, unknown>),
      };

      requests.push(request);

      const answer = await handler(request);

      if (answer.hang === true) {
        return;
      }

      outgoing.writeHead(answer.status, { "content-type": "application/json" });
      outgoing.end(JSON.stringify(answer.body ?? {}));
    })().catch(() => {
      outgoing.writeHead(500, { "content-type": "application/json" });
      outgoing.end("{}");
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    close(): Promise<void> {
      return new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => {
          // A double that the test already closed holds nothing to close, and that is not a failure.
          resolve();
        });
      });
    },
  };
}

export function openAiChatAnswer(text = "ok"): unknown {
  return {
    id: "chatcmpl-doble",
    object: "chat.completion",
    created: 1_700_000_000,
    model: "gpt-4o-mini",
    choices: [
      { index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" },
    ],
    usage: { prompt_tokens: 4, completion_tokens: 1, total_tokens: 5 },
  };
}

export function anthropicAnswer(text = "ok"): unknown {
  return {
    id: "msg-doble",
    type: "message",
    role: "assistant",
    model: "claude-haiku-4-5-20251001",
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    usage: { input_tokens: 4, output_tokens: 1 },
  };
}

export function geminiAnswer(text = "ok"): unknown {
  return {
    candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }],
  };
}

export function openAiEmbeddingsAnswer(size = 1536, count = 1): unknown {
  return {
    object: "list",
    data: Array.from({ length: count }, (_unused, index) => ({
      object: "embedding",
      index,
      embedding: new Array<number>(size).fill(0.1),
    })),
  };
}

// How many texts the request carries, so a double answers one vector per text as a real provider does.
export function inputsOf(request: DoubleRequest): number {
  const input = request.body?.["input"];

  return Array.isArray(input) && input.length > 0 ? input.length : 1;
}
