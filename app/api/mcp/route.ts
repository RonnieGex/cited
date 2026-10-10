/**
 * `POST /api/mcp`, the stateless Streamable HTTP endpoint of Cited. It is off without `CITED_MCP_TOKEN` (404), it
 * requires the bearer of the installation (401 with `WWW-Authenticate`), it refuses an `Origin` that is not the host of
 * the request (403) and it answers one JSON object per request, `202` without a body per notification and `405` to
 * `GET` and `DELETE`. The JSON-RPC subset itself lives in `lib/mcp/server.ts`.
 */

import { bearerOf, mcpToken, originAllowed, tokenMatches } from "../../../lib/mcp/auth.ts";
import { BodyLimitError, readMcpBody } from "../../../lib/mcp/body.ts";
import { INVALID_REQUEST, PARSE_ERROR, type JsonRpcResponse, failure, isSupportedVersion } from "../../../lib/mcp/protocol.ts";
import { handleMessage } from "../../../lib/mcp/server.ts";

export const runtime = "nodejs";

const NO_STORE = { "cache-control": "no-store" };

function json(body: JsonRpcResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...NO_STORE },
  });
}

function plain(body: string, status: number, headers: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", ...NO_STORE, ...headers },
  });
}

// Without the token the endpoint does not exist: an empty 404 reveals nothing, not even that MCP is a feature of this
// installation (decision 2 of `design.md`).
function off(): Response {
  return new Response(null, { status: 404, headers: NO_STORE });
}

// The three guards of the transport, in the order of decision 3: off, origin, bearer. The token comes back when the
// request may continue.
function guard(request: Request): Response | string {
  const token = mcpToken(process.env);

  if (token.length === 0) {
    return off();
  }

  if (originAllowed(request) === false) {
    return plain("forbidden\n", 403);
  }

  if (tokenMatches(bearerOf(request.headers.get("authorization")), token) === false) {
    return plain("unauthorized\n", 401, { "www-authenticate": "Bearer" });
  }

  return token;
}

function isInitialize(body: unknown): boolean {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return false;
  }

  const message = body as Record<string, unknown>;
  const id = message["id"];
  const params = message["params"];

  return message["jsonrpc"] === "2.0" && message["method"] === "initialize"
    && Object.hasOwn(message, "id")
    && (typeof id === "string" || (typeof id === "number" && Number.isFinite(id) && Number.isInteger(id)))
    && typeof params === "object" && params !== null && !Array.isArray(params)
    && typeof (params as Record<string, unknown>)["protocolVersion"] === "string"
    && ((params as Record<string, unknown>)["protocolVersion"] as string).length > 0;
}

export async function POST(request: Request): Promise<Response> {
  const guarded = guard(request);

  if (guarded instanceof Response) {
    return guarded;
  }

  let body: unknown;

  try {
    body = await readMcpBody(request);
  } catch (error) {
    if (error instanceof BodyLimitError) {
      return plain(`${error.message}\n`, error.status);
    }

    return json(failure(null, PARSE_ERROR, "the body is not valid JSON"), 400);
  }

  // The header belongs to the requests that follow initialization (MCP transport, "Protocol Version Header"): an
  // `initialize` is negotiated by its body, so a client that seeds a newer header still receives our latest version.
  const version = request.headers.get("mcp-protocol-version")?.trim() ?? "";

  if (version.length > 0 && isSupportedVersion(version) === false && isInitialize(body) === false) {
    return json(failure(null, INVALID_REQUEST, `the protocol version ${version} is not supported`), 400);
  }

  const outcome = await handleMessage(body, { environment: process.env, token: guarded });

  if (outcome.kind === "accepted") {
    return new Response(null, { status: 202, headers: NO_STORE });
  }

  return json(outcome.body, 200);
}

export async function GET(request: Request): Promise<Response> {
  const guarded = guard(request);

  return guarded instanceof Response ? guarded : plain("method not allowed\n", 405, { allow: "POST" });
}

export async function DELETE(request: Request): Promise<Response> {
  const guarded = guard(request);

  return guarded instanceof Response ? guarded : plain("method not allowed\n", 405, { allow: "POST" });
}
