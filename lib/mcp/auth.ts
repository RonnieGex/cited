/**
 * The bearer of the MCP endpoint and the origin of the request. The token comes from `CITED_MCP_TOKEN` and is compared
 * in constant time; the `Origin` header, when it arrives, has to name the host the request was sent to, which is the
 * protection against DNS rebinding that the Streamable HTTP transport of MCP asks for. The comparison itself lives in
 * `lib/guards/bearer.ts`, shared with the voice tool.
 */

import { bearerOf, secretMatches } from "../guards/bearer.ts";
import type { ChatEnvironment } from "../models/types.ts";

export { bearerOf };

export function mcpToken(environment: ChatEnvironment = process.env): string {
  return environment["CITED_MCP_TOKEN"]?.trim() ?? "";
}

export function tokenMatches(provided: string | null, expected: string): boolean {
  return secretMatches(provided, expected);
}

export function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin")?.trim() ?? "";

  if (origin.length === 0) {
    return true;
  }

  let declared: URL;

  try {
    declared = new URL(origin);
  } catch {
    return false;
  }

  const host = request.headers.get("host")?.trim() ?? new URL(request.url).host;

  return declared.host === host;
}
