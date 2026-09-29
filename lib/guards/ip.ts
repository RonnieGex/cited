import { createHash, randomBytes } from "node:crypto";
import type { ChatEnvironment } from "../models/types.ts";

export const DIRECT_BUCKET = "direct";
export const UNKNOWN_BUCKET = "unknown";

const processSalt = randomBytes(32).toString("hex");

export function hashIp(ip: string, salt?: string): string {
  const used = salt === undefined || salt.trim().length === 0 ? processSalt : salt;

  return createHash("sha256").update(`${used}:${ip}`).digest("hex");
}

export function trustedProxies(environment: ChatEnvironment): number {
  const declared = environment["TRUST_PROXY"]?.trim().toLowerCase() ?? "";

  if (declared === "true") {
    return 1;
  }

  const count = Number(declared);

  return Number.isInteger(count) && count > 0 ? count : 0;
}

function valuesOf(request: Request, name: string): string[] {
  const header = request.headers.get(name);

  if (header === null) {
    return [];
  }

  return header
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function clientAddress(
  request: Request,
  environment: ChatEnvironment = process.env,
): string | null {
  const proxies = trustedProxies(environment);

  if (proxies === 0) {
    return null;
  }

  const forwarded = valuesOf(request, "x-forwarded-for");

  if (forwarded.length >= proxies) {
    const address = forwarded.at(-proxies) ?? "";

    return address.length > 0 ? address : null;
  }

  const real = valuesOf(request, "x-real-ip").at(-1) ?? "";

  return real.length > 0 ? real : null;
}

export function clientIp(request: Request, environment: ChatEnvironment = process.env): string {
  const address = clientAddress(request, environment);

  if (address !== null) {
    return address;
  }

  return trustedProxies(environment) > 0 ? UNKNOWN_BUCKET : DIRECT_BUCKET;
}
