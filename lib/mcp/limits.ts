/**
 * The limit of the MCP endpoint: `MCP_RATE_LIMIT_PER_HOUR` (120 by default) tool calls per token in the current hour.
 * The window lives in the memory of the process, keyed by the SHA-256 of the token, because the `rate_limits` table of
 * the store is the bucket of an address and the contract asks for a limit per token (decision 5 of `design.md`).
 */

import { createHash } from "node:crypto";
import type { ChatEnvironment } from "../models/types.ts";

export const DEFAULT_MCP_RATE_LIMIT_PER_HOUR = 120;

export type McpLimits = { rateLimitPerHour: number };

export function resolveMcpLimits(environment: ChatEnvironment = process.env): McpLimits {
  const declared = Number(environment["MCP_RATE_LIMIT_PER_HOUR"]?.trim() ?? "");

  return {
    rateLimitPerHour:
      Number.isInteger(declared) && declared > 0 ? declared : DEFAULT_MCP_RATE_LIMIT_PER_HOUR,
  };
}

type Window = { windowStart: string; count: number };

const windows = new Map<string, Window>();

function keyOf(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function countMcpCall(token: string, windowStart: string): number {
  const key = keyOf(token);
  const current = windows.get(key);

  if (current === undefined || current.windowStart !== windowStart) {
    for (const [other, window] of windows) {
      if (window.windowStart !== windowStart) {
        windows.delete(other);
      }
    }

    windows.set(key, { windowStart, count: 1 });

    return 1;
  }

  current.count += 1;

  return current.count;
}

export function resetMcpCalls(): void {
  windows.clear();
}
