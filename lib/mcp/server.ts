/**
 * One JSON-RPC message in, one response or an accepted notification out. The endpoint is stateless, so nothing of a
 * request survives it: the five methods are answered here, every `tools/call` consumes the quota of its token
 * (`MCP_RATE_LIMIT_PER_HOUR`) and every failure is a JSON-RPC error or a tool result with `isError`, never a throw.
 */

import { publicMessage } from "../guards/outbound.ts";
import { hourWindowStart } from "../guards/window.ts";
import type { ChatEnvironment } from "../models/types.ts";
import { countMcpCall, resolveMcpLimits } from "./limits.ts";
import {
  INVALID_PARAMS,
  INVALID_REQUEST,
  JSON_RPC_VERSION,
  METHOD_NOT_FOUND,
  SERVER_NAME,
  SERVER_VERSION,
  type JsonRpcId,
  type JsonRpcResponse,
  failure,
  negotiateVersion,
  success,
} from "./protocol.ts";
import { MCP_TOOLS, callTool, toolError } from "./tools.ts";

export type McpContext = {
  environment?: ChatEnvironment;
  /** The bearer the transport already validated. It is never stored and never leaves a response. */
  token: string;
  now?: Date;
};

export type McpOutcome = { kind: "response"; body: JsonRpcResponse } | { kind: "accepted" };

const INSTRUCTIONS = [
  "Cited answers only from the documents of this installation, and it always says where an answer came from.",
  "Call cited_search to read the passages that match a query and cite them by their number, like [1].",
  "Call cited_ask for a written answer with its citations.",
  "When the documents do not hold the answer, Cited refuses instead of inventing it: pass that refusal to the user.",
].join(" ");

function response(body: JsonRpcResponse): McpOutcome {
  return { kind: "response", body };
}

function idOf(message: Record<string, unknown>): JsonRpcId {
  const id = message["id"];

  return typeof id === "string" || typeof id === "number" ? id : null;
}

function objectOf(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && Array.isArray(value) === false
    ? (value as Record<string, unknown>)
    : null;
}

function initialize(id: JsonRpcId, params: unknown): JsonRpcResponse {
  const requested = objectOf(params)?.["protocolVersion"];

  if (typeof requested !== "string" || requested.length === 0) {
    return failure(id, INVALID_PARAMS, "initialize needs a protocolVersion string");
  }

  return success(id, {
    protocolVersion: negotiateVersion(requested),
    capabilities: { tools: {} },
    serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
    instructions: INSTRUCTIONS,
  });
}

async function callMethod(
  id: JsonRpcId,
  params: unknown,
  context: McpContext,
): Promise<JsonRpcResponse> {
  const record = objectOf(params);

  if (record === null) {
    return failure(id, INVALID_PARAMS, "tools/call needs the name of a tool and its arguments");
  }

  const name = record["name"];

  if (typeof name !== "string" || name.length === 0) {
    return failure(id, INVALID_PARAMS, "tools/call needs the name of a tool");
  }

  if (MCP_TOOLS.some((tool) => tool.name === name) === false) {
    return failure(id, INVALID_PARAMS, `Unknown tool: ${name}`);
  }

  const environment = context.environment ?? process.env;
  const limits = resolveMcpLimits(environment);
  const calls = countMcpCall(context.token, hourWindowStart(context.now ?? new Date()));

  if (calls > limits.rateLimitPerHour) {
    const message =
      publicMessage(
        `more than MCP_RATE_LIMIT_PER_HOUR (${limits.rateLimitPerHour}) tool calls with this token in an hour`,
      ) || "too many tool calls with this token in an hour";

    return success(id, toolError(message) as unknown as Record<string, unknown>);
  }

  const outcome = await callTool(name, record["arguments"], {
    environment,
    ...(context.now === undefined ? {} : { now: context.now }),
  });

  return outcome.kind === "invalid"
    ? failure(id, INVALID_PARAMS, outcome.message)
    : success(id, outcome.result as unknown as Record<string, unknown>);
}

export async function handleMessage(message: unknown, context: McpContext): Promise<McpOutcome> {
  const record = objectOf(message);

  if (record === null) {
    return response(failure(null, INVALID_REQUEST, "the message is not a JSON-RPC request"));
  }

  const id = idOf(record);
  const method = record["method"];

  if (record["jsonrpc"] !== JSON_RPC_VERSION || typeof method !== "string" || method.length === 0) {
    return response(failure(id, INVALID_REQUEST, "the message is not a JSON-RPC request"));
  }

  // A notification has no id and expects no answer, whatever its method (Transports, "Sending Messages to the Server").
  if (record["id"] === undefined) {
    return { kind: "accepted" };
  }

  switch (method) {
    case "initialize":
      return response(initialize(id, record["params"]));
    case "ping":
      return response(success(id, {}));
    case "tools/list":
      return response(success(id, { tools: MCP_TOOLS as unknown as Record<string, unknown>[] }));
    case "tools/call":
      return response(await callMethod(id, record["params"], context));
    default:
      return response(failure(id, METHOD_NOT_FOUND, `the method ${method} is not implemented`));
  }
}
