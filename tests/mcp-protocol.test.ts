// @vitest-environment node
// The protocol of the MCP endpoint and the guards of its transport, without a store and without a network: the
// negotiation of the version, the JSON-RPC subset, the schema of the two tools, the per-token counter and the origin
// of a request.

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import manifest from "../package.json";
import { VARIABLE_NAME } from "@/lib/guards/outbound";
import { bearerOf } from "@/lib/guards/bearer";
import { mcpToken, originAllowed, tokenMatches } from "@/lib/mcp/auth";
import {
  DEFAULT_MCP_RATE_LIMIT_PER_HOUR,
  countMcpCall,
  resetMcpCalls,
  resolveMcpLimits,
} from "@/lib/mcp/limits";
import {
  INVALID_PARAMS,
  INVALID_REQUEST,
  LATEST_PROTOCOL_VERSION,
  METHOD_NOT_FOUND,
  SERVER_NAME,
  SERVER_VERSION,
  type JsonRpcResponse,
  isSupportedVersion,
  negotiateVersion,
} from "@/lib/mcp/protocol";
import { handleMessage, type McpContext, type McpOutcome } from "@/lib/mcp/server";
import { MCP_TOOLS, TOOL_ASK, TOOL_SEARCH } from "@/lib/mcp/tools";

const TOKEN = "token-de-prueba";

function bodyOf(outcome: McpOutcome): JsonRpcResponse {
  if (outcome.kind !== "response") {
    throw new Error("the message was accepted as a notification and no response was written");
  }

  return outcome.body;
}

async function ask(
  message: unknown,
  overrides: { token?: string; now?: Date } = {},
): Promise<JsonRpcResponse> {
  const context: McpContext = {
    environment: process.env,
    token: overrides.token ?? TOKEN,
    ...(overrides.now === undefined ? {} : { now: overrides.now }),
  };

  return bodyOf(await handleMessage(message, context));
}

function request(method: string, params?: unknown, id: number | string = 1): Record<string, unknown> {
  return {
    jsonrpc: "2.0",
    id,
    method,
    ...(params === undefined ? {} : { params }),
  };
}

function resultOf(body: JsonRpcResponse): Record<string, unknown> {
  if ("error" in body) {
    throw new Error(`the request failed with ${body.error.code}: ${body.error.message}`);
  }

  return body.result;
}

function errorOf(body: JsonRpcResponse): { code: number; message: string } {
  if ("error" in body === false) {
    throw new Error("the request answered a result and no error");
  }

  return body.error;
}

function call(name: string, args: Record<string, unknown> = {}): Record<string, unknown> {
  return request("tools/call", { name, arguments: args }, 7);
}

function post(headers: Record<string, string> = {}): Request {
  return new Request("http://127.0.0.1:3230/api/mcp", { method: "POST", headers });
}

afterAll(() => {
  resetMcpCalls();
});

beforeEach(() => {
  resetMcpCalls();
});

describe("the protocol version", () => {
  it("negotiates the version the client asks for when it is supported", () => {
    expect(negotiateVersion("2025-06-18")).toBe("2025-06-18");
    expect(negotiateVersion("2025-03-26")).toBe("2025-03-26");
  });

  it("answers the latest version it supports to anything else", () => {
    expect(negotiateVersion("1999-01-01")).toBe(LATEST_PROTOCOL_VERSION);
    expect(negotiateVersion(undefined)).toBe(LATEST_PROTOCOL_VERSION);
    expect(negotiateVersion(3)).toBe(LATEST_PROTOCOL_VERSION);
  });

  it("supports exactly the two versions of the contract", () => {
    expect(isSupportedVersion("2025-06-18")).toBe(true);
    expect(isSupportedVersion("2025-03-26")).toBe(true);
    expect(isSupportedVersion("2024-11-05")).toBe(false);
  });
});

describe("the JSON-RPC subset of the endpoint", () => {
  it("answers the initialization with its capabilities and its own name", async () => {
    const body = await ask(request("initialize", { protocolVersion: "2025-06-18" }));
    const result = resultOf(body);

    expect(body.id).toBe(1);
    expect(body.jsonrpc).toBe("2.0");
    expect(result["protocolVersion"]).toBe("2025-06-18");
    expect((result["serverInfo"] as Record<string, unknown>)["name"]).toBe(SERVER_NAME);
    expect((result["capabilities"] as Record<string, unknown>)["tools"]).toBeDefined();
  });

  it("keeps the version of the server in step with package.json", () => {
    expect(SERVER_VERSION).toBe(manifest.version);
  });

  it("accepts the initialized notification without a body", async () => {
    const outcome = await handleMessage(
      { jsonrpc: "2.0", method: "notifications/initialized" },
      { environment: process.env, token: TOKEN },
    );

    expect(outcome.kind).toBe("accepted");
  });

  it("answers a ping and refuses a method it does not implement", async () => {
    expect(resultOf(await ask(request("ping")))).toEqual({});
    expect(errorOf(await ask(request("resources/list"))).code).toBe(METHOD_NOT_FOUND);
    expect(errorOf(await ask(request("prompts/list"))).code).toBe(METHOD_NOT_FOUND);
  });

  it("refuses a message that is not a JSON-RPC request", async () => {
    for (const message of ["hello", null, 42, [], { jsonrpc: "1.0", id: 1, method: "ping" }, { jsonrpc: "2.0", id: 1 }]) {
      expect(errorOf(await ask(message)).code, JSON.stringify(message)).toBe(INVALID_REQUEST);
    }
  });

  it("refuses an initialization without a protocol version", async () => {
    expect(errorOf(await ask(request("initialize", {}))).code).toBe(INVALID_PARAMS);
    expect(errorOf(await ask(request("initialize", { protocolVersion: 3 }))).code).toBe(INVALID_PARAMS);
  });
});

describe("the two tools of the server", () => {
  it("lists exactly cited_search and cited_ask", async () => {
    const result = resultOf(await ask(request("tools/list")));
    const tools = result["tools"] as Array<Record<string, unknown>>;

    expect(tools.map((tool) => tool["name"])).toEqual([TOOL_SEARCH, TOOL_ASK]);
    expect(MCP_TOOLS.map((tool) => tool.name)).toEqual([TOOL_SEARCH, TOOL_ASK]);
  });

  it("declares the schemas and the read-only annotations of every tool", async () => {
    for (const tool of MCP_TOOLS) {
      expect(tool.description.length, tool.name).toBeGreaterThan(20);
      expect(tool.inputSchema.type, tool.name).toBe("object");
      expect(tool.outputSchema.type, tool.name).toBe("object");
      expect(tool.inputSchema.additionalProperties, tool.name).toBe(false);
      expect(tool.annotations.readOnlyHint, tool.name).toBe(true);
      expect(tool.annotations.openWorldHint, tool.name).toBe(false);
    }

    const search = MCP_TOOLS.find((tool) => tool.name === TOOL_SEARCH);
    const askTool = MCP_TOOLS.find((tool) => tool.name === TOOL_ASK);

    expect(search?.inputSchema.required).toEqual(["query"]);
    expect(search?.inputSchema.properties?.["limit"]?.minimum).toBe(1);
    expect(search?.inputSchema.properties?.["limit"]?.maximum).toBe(8);
    expect(search?.inputSchema.properties?.["limit"]?.default).toBe(5);
    expect(askTool?.inputSchema.required).toEqual(["question"]);
    expect(
      search?.outputSchema.properties?.["passages"]?.items?.required,
      "every passage carries its five citation fields",
    ).toEqual(["n", "document", "heading", "position", "excerpt"]);
  });

  it("refuses an argument the schema does not accept", async () => {
    expect(errorOf(await ask(call(TOOL_SEARCH, { query: "precio", limit: 9 }))).code).toBe(INVALID_PARAMS);
    expect(errorOf(await ask(call(TOOL_SEARCH, { query: "precio", limit: 0 }))).code).toBe(INVALID_PARAMS);
    expect(errorOf(await ask(call(TOOL_SEARCH, { query: "precio", limit: 2.5 }))).code).toBe(INVALID_PARAMS);
    expect(errorOf(await ask(call(TOOL_SEARCH, { limit: 3 }))).code).toBe(INVALID_PARAMS);
    expect(errorOf(await ask(call(TOOL_SEARCH, { query: 42 }))).code).toBe(INVALID_PARAMS);
    expect(errorOf(await ask(call(TOOL_SEARCH, { query: "precio", extra: 1 }))).code).toBe(INVALID_PARAMS);
    expect(errorOf(await ask(call(TOOL_ASK, { question: "precio", extra: 1 }))).code).toBe(INVALID_PARAMS);
    expect(errorOf(await ask(call(TOOL_ASK, {}))).code).toBe(INVALID_PARAMS);
  });

  it("refuses a tool the server does not expose", async () => {
    const error = errorOf(await ask(call("cited_delete_everything", { query: "precio" })));

    expect(error.code).toBe(INVALID_PARAMS);
    expect(error.message.toLowerCase()).toContain("unknown tool");
  });

  it("sanitizes the name of an unknown tool", async () => {
    const error = errorOf(await ask(call("EVIL_VARIABLE_NAME", {})));

    expect(VARIABLE_NAME.test(error.message)).toBe(false);
  });
});

describe("the counter of the token", () => {
  it("takes its limit from MCP_RATE_LIMIT_PER_HOUR, with 120 by default", () => {
    expect(resolveMcpLimits({}).rateLimitPerHour).toBe(DEFAULT_MCP_RATE_LIMIT_PER_HOUR);
    expect(resolveMcpLimits({ MCP_RATE_LIMIT_PER_HOUR: "5" }).rateLimitPerHour).toBe(5);
    expect(resolveMcpLimits({ MCP_RATE_LIMIT_PER_HOUR: "0" }).rateLimitPerHour).toBe(
      DEFAULT_MCP_RATE_LIMIT_PER_HOUR,
    );
    expect(resolveMcpLimits({ MCP_RATE_LIMIT_PER_HOUR: "many" }).rateLimitPerHour).toBe(
      DEFAULT_MCP_RATE_LIMIT_PER_HOUR,
    );
  });

  it("counts one token apart from another and starts again on the next hour", () => {
    expect(countMcpCall("uno", "2026-10-08T10:00:00.000Z")).toBe(1);
    expect(countMcpCall("uno", "2026-10-08T10:00:00.000Z")).toBe(2);
    expect(countMcpCall("dos", "2026-10-08T10:00:00.000Z")).toBe(1);
    expect(countMcpCall("uno", "2026-10-08T11:00:00.000Z")).toBe(1);
  });
});

describe("the guards of the transport", () => {
  it("reads the token of the environment and never invents one", () => {
    expect(mcpToken({})).toBe("");
    expect(mcpToken({ CITED_MCP_TOKEN: "   " })).toBe("");
    expect(mcpToken({ CITED_MCP_TOKEN: "  abc  " })).toBe("abc");
  });

  it("compares the bearer in a way that accepts only the same token", () => {
    expect(tokenMatches("abc", "abc")).toBe(true);
    expect(tokenMatches("abd", "abc")).toBe(false);
    expect(tokenMatches("abc", "abcd")).toBe(false);
    expect(tokenMatches(null, "abc")).toBe(false);
    expect(tokenMatches("", "abc")).toBe(false);
    expect(tokenMatches("abc", "")).toBe(false);
  });

  it("reads a Bearer header and nothing else", () => {
    expect(bearerOf("Bearer abc")).toBe("abc");
    expect(bearerOf("Basic abc")).toBeNull();
    expect(bearerOf(null)).toBeNull();
  });

  it("accepts a request with no origin and the origin of its own host", () => {
    expect(originAllowed(post())).toBe(true);
    expect(originAllowed(post({ origin: "http://127.0.0.1:3230" }))).toBe(true);
  });

  it("refuses an origin that is not the site's own", () => {
    expect(originAllowed(post({ origin: "http://localhost:3230" }))).toBe(false);
    expect(originAllowed(post({ origin: "https://evil.example" }))).toBe(false);
    expect(originAllowed(post({ origin: "http://127.0.0.1:9999" }))).toBe(false);
    expect(originAllowed(post({ origin: "null" }))).toBe(false);
    expect(originAllowed(post({ origin: "not a url" }))).toBe(false);
  });
});
