import { createHash, randomBytes } from "node:crypto";
import type { ChatEnvironment } from "../models/types.ts";

export const DIRECT_BUCKET = "direct";
export const UNKNOWN_BUCKET = "unknown";

const processSalt = randomBytes(32).toString("hex");

export function hashIp(ip: string, salt?: string): string {
  const used = salt === undefined || salt.trim().length === 0 ? processSalt : salt;

  return createHash("sha256").update(`${used}:${ip}`).digest("hex");
}

function trustsProxy(environment: ChatEnvironment): boolean {
  const declared = environment["TRUST_PROXY"]?.trim().toLowerCase() ?? "";

  return declared === "1" || declared === "true";
}

function lastValue(request: Request, name: string): string | null {
  const header = request.headers.get(name);

  if (header === null) {
    return null;
  }

  const values = header
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const last = values.at(-1) ?? "";

  return last.length > 0 ? last : null;
}

export function clientIp(request: Request, environment: ChatEnvironment = process.env): string {
  if (trustsProxy(environment)) {
    return (
      lastValue(request, "x-forwarded-for") ??
      lastValue(request, "x-real-ip") ??
      UNKNOWN_BUCKET
    );
  }

  return DIRECT_BUCKET;
}
