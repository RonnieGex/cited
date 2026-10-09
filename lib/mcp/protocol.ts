/**
 * The JSON-RPC subset of the MCP endpoint: the protocol versions it negotiates, the name and the version it answers,
 * the four error codes of the contract and the two shapes of a response. Every message that leaves the server is
 * written here, which is the one place where the text of an error is sanitized (requirement "Every failure is a
 * JSON-RPC error or a tool error" of the capability `mcp-server`).
 */

import { publicMessage } from "../guards/outbound.ts";

export const JSON_RPC_VERSION = "2.0";

// The revisions of the protocol the endpoint negotiates: the latest first, which is what an unsupported request
// receives (Lifecycle, "Version Negotiation").
export const LATEST_PROTOCOL_VERSION = "2025-06-18";
export const SUPPORTED_PROTOCOL_VERSIONS: readonly string[] = ["2025-06-18", "2025-03-26"];

export const SERVER_NAME = "cited";
export const SERVER_VERSION = "0.1.0";

export const PARSE_ERROR = -32700;
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;

export type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  default?: unknown;
  description?: string;
  additionalProperties?: boolean;
};

export type JsonRpcId = string | number | null;

export type JsonRpcSuccess = { jsonrpc: string; id: JsonRpcId; result: Record<string, unknown> };
export type JsonRpcFailure = { jsonrpc: string; id: JsonRpcId; error: { code: number; message: string } };
export type JsonRpcResponse = JsonRpcSuccess | JsonRpcFailure;

// The sentence of every code when the text the caller wrote carries something that may not leave the server: a name of
// a variable of the environment, a key, or the text of a provider. `publicMessage()` is the same guard `/api/ask` uses.
const FALLBACK: Record<number, string> = {
  [PARSE_ERROR]: "the body is not valid JSON",
  [INVALID_REQUEST]: "the message is not a valid JSON-RPC request",
  [METHOD_NOT_FOUND]: "the method of the request is not implemented",
  [INVALID_PARAMS]: "the parameters of the request are not valid",
};

export function isSupportedVersion(value: string): boolean {
  return SUPPORTED_PROTOCOL_VERSIONS.includes(value);
}

export function negotiateVersion(requested: unknown): string {
  return typeof requested === "string" && isSupportedVersion(requested)
    ? requested
    : LATEST_PROTOCOL_VERSION;
}

export function success(id: JsonRpcId, result: Record<string, unknown>): JsonRpcSuccess {
  return { jsonrpc: JSON_RPC_VERSION, id, result };
}

export function failure(id: JsonRpcId, code: number, message: string): JsonRpcFailure {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id,
    error: { code, message: publicMessage(message) || FALLBACK[code] || "the request failed" },
  };
}
