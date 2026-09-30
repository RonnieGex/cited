import { createServer, type Server } from "node:http";

// The deterministic provider of the browser suites: it answers the Chat Completions API, which is the one the
// OpenAI-compatible entries of the catalogue speak, and the list of an embeddings call, and it refuses every key but
// the one of the suite. There is a real HTTP round trip and no test reaches a real provider.
//
// The specs of the keys, of the guided setup and of the Spanish walk serve it one at a time on port 3216, the port
// decision 17 of `guided-setup-and-knowledge` fixes for it and `playwright.config.ts` keeps free for them with a single
// worker.

export const PROVIDER_DOUBLE_PORT = 3216;
export const PROVIDER_DOUBLE_KEY = "sk-buena-0000000000007788";

function providerDoubleServer(): Server {
  return createServer((request, response) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const authorization = request.headers.authorization ?? "";
      const body = Buffer.concat(chunks).toString("utf8");

      response.setHeader("content-type", "application/json");

      if (authorization !== `Bearer ${PROVIDER_DOUBLE_KEY}`) {
        response.writeHead(401);
        response.end(
          JSON.stringify({
            error: { message: "Incorrect API key provided", type: "invalid_request_error", code: "invalid_api_key" },
          }),
        );

        return;
      }

      // The system prompt of the answer asks for the citation marks; the double answers a question about the prices of
      // the sample business with the first passage it was handed. The shape of the answer is the one the SDK expects
      // for the kind of request: a chat completion with its choices, or the list of an embeddings call.
      const embedding = body.includes("\"input\"");

      response.writeHead(200);
      response.end(
        embedding
          ? JSON.stringify({
              object: "list",
              model: "text-embedding-3-small",
              data: [{ object: "embedding", index: 0, embedding: Array.from({ length: 8 }, () => 0.1) }],
            })
          : JSON.stringify({
              object: "chat.completion",
              id: "chatcmpl-doble",
              created: 1_700_000_000,
              model: "gpt-4o-mini",
              choices: [
                {
                  index: 0,
                  message: { role: "assistant", content: "La afinación de bicicleta cuesta 380 pesos [1]." },
                  finish_reason: "stop",
                },
              ],
            }),
      );
    });
  });
}

export function providerDouble(): Server {
  return providerDoubleServer();
}

export async function listenOnDoublePort(server: Server): Promise<void> {
  await new Promise<void>((ready) => {
    server.listen(PROVIDER_DOUBLE_PORT, "127.0.0.1", ready);
  });
}

export async function closeDouble(server: Server): Promise<void> {
  await new Promise<void>((done) => {
    server.closeAllConnections();
    server.close(() => {
      done();
    });
  });
}
