// @vitest-environment node
// The real POST, GET and DELETE of `app/api/mcp/route.ts` with `Request` objects: the token, the origin, the status
// codes of the transport and the two tools over a seeded store. No network and no provider: the store is the sample
// corpus, the chat provider is the deterministic double and the embeddings are its double too.

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { DELETE, GET, POST } from "@/app/api/mcp/route";
import { VARIABLE_NAME } from "@/lib/guards/outbound";
import { resetMcpCalls } from "@/lib/mcp/limits";
import { closeSharedStores } from "@/lib/store/instance";
import {
  cleanupWorkspaces,
  keywordStore,
  restoreEnvironment,
  setEnvironment,
  vectorStore,
} from "./mcp-helpers";

const TOKEN = "token-de-prueba-del-mcp";
const URL_OF_THE_ROUTE = "http://127.0.0.1:3230/api/mcp";
const priceQuestion = "¿Cuánto cuesta una afinación de bicicleta?";
const priceQuery = "afinación de bicicleta";

afterAll(async () => {
  await closeSharedStores();
  await cleanupWorkspaces();
  restoreEnvironment();
});

beforeEach(() => {
  resetMcpCalls();
});

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(URL_OF_THE_ROUTE, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function authorized(extra: Record<string, string> = {}): Record<string, string> {
  return { authorization: `Bearer ${TOKEN}`, ...extra };
}

async function answerOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

function resultOf(body: Record<string, unknown>): Record<string, unknown> {
  if (typeof body["error"] === "object" && body["error"] !== null) {
    throw new Error(`the request failed: ${JSON.stringify(body["error"])}`);
  }

  return body["result"] as Record<string, unknown>;
}

async function initialize(headers: Record<string, string> = {}): Promise<Response> {
  return POST(request({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } }, headers));
}

describe("POST /api/mcp is off until the token exists", () => {
  it("answers 404 with an empty body to a POST, a GET and a DELETE", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path });
    await closeSharedStores();

    const post = await initialize();
    const get = await GET(new Request(URL_OF_THE_ROUTE));
    const remove = await DELETE(new Request(URL_OF_THE_ROUTE, { method: "DELETE" }));

    for (const [name, response] of [["POST", post], ["GET", get], ["DELETE", remove]] as const) {
      expect(response.status, name).toBe(404);
      expect(await response.text(), name).toBe("");
    }
  });
});

describe("POST /api/mcp is behind the bearer of the installation", () => {
  it("answers 401 with WWW-Authenticate when the header is missing or wrong", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: TOKEN });
    await closeSharedStores();

    const missing = await initialize();
    const wrong = await initialize({ authorization: "Bearer otro-token" });
    const other = await initialize({ authorization: "Basic token-de-prueba-del-mcp" });

    for (const [name, response] of [["missing", missing], ["wrong", wrong], ["other", other]] as const) {
      expect(response.status, name).toBe(401);
      expect(response.headers.get("www-authenticate"), name).toBe("Bearer");
      expect(await response.text(), name).not.toContain(TOKEN);
    }
  });

  it("answers 403 to an origin that is not the site's own and serves its own", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: TOKEN });
    await closeSharedStores();

    const foreign = await initialize(authorized({ origin: "https://evil.example" }));
    const own = await initialize(authorized({ origin: "http://127.0.0.1:3230" }));
    const none = await initialize(authorized());

    expect(foreign.status).toBe(403);
    expect(await foreign.text()).not.toContain("cafe-la-horquilla");
    expect(own.status).toBe(200);
    expect(none.status).toBe(200);
  });

  it("never lets the token travel in a body", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: TOKEN });
    await closeSharedStores();

    const responses = [
      await initialize(authorized()),
      await POST(request({ jsonrpc: "2.0", id: 2, method: "tools/list" }, authorized())),
      await POST(request({ jsonrpc: "2.0", id: 3, method: "resources/list" }, authorized())),
      await POST(request("{", authorized())),
      await initialize({ authorization: "Bearer otro" }),
    ];

    for (const response of responses) {
      expect(await response.text()).not.toContain(TOKEN);
    }
  });
});

describe("the transport of the endpoint", () => {
  it("answers one JSON object for a request and 202 with no body for a notification", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: TOKEN });
    await closeSharedStores();

    const response = await initialize(authorized());
    const body = await answerOf(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("content-type")).not.toContain("text/event-stream");
    expect((resultOf(body)["serverInfo"] as Record<string, unknown>)["name"]).toBe("cited");
    expect(resultOf(body)["capabilities"]).toHaveProperty("tools");
    expect(resultOf(body)["protocolVersion"]).toBe("2025-06-18");

    const notification = await POST(
      request({ jsonrpc: "2.0", method: "notifications/initialized" }, authorized()),
    );

    expect(notification.status).toBe(202);
    expect(await notification.text()).toBe("");
  });

  it("answers 400 to a protocol version it does not support", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: TOKEN });
    await closeSharedStores();

    const response = await POST(
      request(
        { jsonrpc: "2.0", id: 1, method: "tools/list" },
        authorized({ "mcp-protocol-version": "2024-11-05" }),
      ),
    );

    expect(response.status).toBe(400);
    expect((await answerOf(response))["error"]).toBeDefined();
  });

  it("accepts the two supported protocol version headers", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: TOKEN });
    await closeSharedStores();

    for (const version of ["2025-06-18", "2025-03-26"]) {
      const response = await POST(
        request({ jsonrpc: "2.0", id: 1, method: "tools/list" }, authorized({ "mcp-protocol-version": version })),
      );

      expect(response.status, version).toBe(200);
    }
  });

  it("negotiates an initialize whose header names a newer version", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: TOKEN });
    await closeSharedStores();

    for (const version of ["2025-11-25", "2024-11-05"]) {
      const response = await POST(
        request(
          {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: { protocolVersion: version, capabilities: {}, clientInfo: { name: "hermes-agent", version: "0" } },
          },
          authorized({ "mcp-protocol-version": version }),
        ),
      );

      expect(response.status, version).toBe(200);
      expect(((await answerOf(response))["result"] as Record<string, unknown>)["protocolVersion"], version).toBe(
        "2025-06-18",
      );
    }
  });

  it("answers 405 to GET and DELETE", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: TOKEN });
    await closeSharedStores();

    const get = await GET(new Request(URL_OF_THE_ROUTE, { headers: authorized() }));
    const remove = await DELETE(new Request(URL_OF_THE_ROUTE, { method: "DELETE", headers: authorized() }));

    expect(get.status).toBe(405);
    expect(remove.status).toBe(405);
  });

  it("answers the four JSON-RPC error codes of the contract", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: TOKEN });
    await closeSharedStores();

    const broken = await POST(request("{", authorized()));
    const notARequest = await POST(request({ jsonrpc: "2.0", id: 1 }, authorized()));
    const unknownMethod = await POST(request({ jsonrpc: "2.0", id: 2, method: "resources/list" }, authorized()));
    const badParams = await POST(
      request(
        { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "cited_search", arguments: { limit: 9 } } },
        authorized(),
      ),
    );

    expect(broken.status).toBe(400);
    expect(((await answerOf(broken))["error"] as Record<string, unknown>)["code"]).toBe(-32700);
    expect(((await answerOf(notARequest))["error"] as Record<string, unknown>)["code"]).toBe(-32600);
    expect(((await answerOf(unknownMethod))["error"] as Record<string, unknown>)["code"]).toBe(-32601);
    expect(((await answerOf(badParams))["error"] as Record<string, unknown>)["code"]).toBe(-32602);
  });
});

describe("the two tools through the route", () => {
  it("lists exactly cited_search and cited_ask, each with its input schema", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: TOKEN });
    await closeSharedStores();

    const response = await POST(request({ jsonrpc: "2.0", id: 1, method: "tools/list" }, authorized()));
    const tools = resultOf(await answerOf(response))["tools"] as Array<Record<string, unknown>>;

    expect(response.status).toBe(200);
    expect(tools.map((tool) => tool["name"])).toEqual(["cited_search", "cited_ask"]);

    for (const tool of tools) {
      expect(tool["inputSchema"], String(tool["name"])).toBeDefined();
      expect(tool["outputSchema"], String(tool["name"])).toBeDefined();
    }
  });

  it("returns the passage of the sample corpus for a search, with no chat provider", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: TOKEN });
    await closeSharedStores();

    const response = await POST(
      request(
        { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "cited_search", arguments: { query: priceQuery } } },
        authorized(),
      ),
    );
    const result = resultOf(await answerOf(response));
    const passages = (result["structuredContent"] as Record<string, unknown>)["passages"] as Array<
      Record<string, unknown>
    >;

    expect(response.status).toBe(200);
    expect(result["isError"]).toBeFalsy();
    expect(passages.length).toBeGreaterThanOrEqual(1);
    expect(passages.map((passage) => passage["document"])).toContain("cafe-la-horquilla.md");
    expect(String(passages[0]?.["excerpt"])).toContain("380 pesos");
  });

  it("answers cited_ask as a tool error, with no variable name, when no provider is connected", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: TOKEN });
    await closeSharedStores();

    const response = await POST(
      request(
        { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "cited_ask", arguments: { question: priceQuestion } } },
        authorized(),
      ),
    );
    const result = resultOf(await answerOf(response));
    const text = JSON.stringify(result);

    expect(response.status).toBe(200);
    expect(result["isError"]).toBe(true);
    expect(VARIABLE_NAME.test(text)).toBe(false);
    expect(text).not.toContain(TOKEN);
    expect(text).not.toMatch(/sk-[a-z0-9]/i);
  });

  it("answers the answer and its citations through the route with the deterministic provider", async () => {
    const path = await vectorStore();

    setEnvironment({
      DATABASE_URL: path,
      CITED_MCP_TOKEN: TOKEN,
      CHAT_PROVIDER: "fake",
      EMBEDDINGS_PROVIDER: "fake",
    });
    await closeSharedStores();

    const response = await POST(
      request(
        { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "cited_ask", arguments: { question: priceQuestion } } },
        authorized(),
      ),
    );
    const result = resultOf(await answerOf(response));
    const content = result["structuredContent"] as Record<string, unknown>;

    expect(result["isError"]).toBeFalsy();
    expect(content["status"]).toBe("answered");
    expect(String(content["answer"])).toContain("[1]");
    expect((content["citations"] as Array<Record<string, unknown>>)[0]?.["document"]).toBe("cafe-la-horquilla.md");
  });

  it("counts the calls of one token and refuses the one over the limit", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: TOKEN, MCP_RATE_LIMIT_PER_HOUR: "2" });
    await closeSharedStores();

    const search = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "cited_search", arguments: { query: priceQuery } },
    };
    const first = resultOf(await answerOf(await POST(request(search, authorized()))));
    const second = resultOf(await answerOf(await POST(request(search, authorized()))));
    const third = resultOf(await answerOf(await POST(request(search, authorized()))));

    expect(first["isError"]).toBeFalsy();
    expect(second["isError"]).toBeFalsy();
    expect(third["isError"]).toBe(true);
    expect(VARIABLE_NAME.test(JSON.stringify(third))).toBe(false);
  });
});
