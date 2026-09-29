import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "cited_admin";
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
export const ADMIN_PASSWORD_MIN_LENGTH = 16;

export type AdminEnvironment = Record<string, string | undefined>;

export type AdminConfig = {
  password: string;
  secret: string;
  missing: string[];
  shortPassword: boolean;
};

const requiredVariables = ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"];

function read(environment: AdminEnvironment, name: string): string {
  return environment[name]?.trim() ?? "";
}

export function adminConfig(environment: AdminEnvironment): AdminConfig {
  const password = read(environment, "ADMIN_PASSWORD");
  const secret = read(environment, "ADMIN_SESSION_SECRET");

  return {
    password,
    secret,
    missing: requiredVariables.filter((name) => read(environment, name).length === 0),
    shortPassword: password.length > 0 && password.length < ADMIN_PASSWORD_MIN_LENGTH,
  };
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function passwordMatches(expected: string, given: string): boolean {
  if (expected.length === 0) {
    return false;
  }

  return timingSafeEqual(digest(given), digest(expected));
}

function signature(secret: string, expiry: string): string {
  return createHmac("sha256", secret).update(expiry, "utf8").digest("hex");
}

export function sessionToken(secret: string, now: Date): string {
  const expiry = String(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

  return `${expiry}.${signature(secret, expiry)}`;
}

export function verifySession(secret: string, token: string | undefined, now: Date): boolean {
  if (secret.length === 0 || token === undefined || token.length === 0) {
    return false;
  }

  const separator = token.indexOf(".");

  if (separator <= 0 || separator === token.length - 1) {
    return false;
  }

  const expiry = token.slice(0, separator);
  const given = token.slice(separator + 1);

  if (/^\d+$/.test(expiry) === false) {
    return false;
  }

  if (timingSafeEqual(digest(given), digest(signature(secret, expiry))) === false) {
    return false;
  }

  return Number(expiry) > now.getTime();
}

function attributes(secure: boolean, maxAge: number): string {
  const parts = [
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAge}`,
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function sessionCookie(token: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${token}; ${attributes(secure, SESSION_MAX_AGE_SECONDS)}`;
}

export function clearedSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; ${attributes(secure, 0)}`;
}

export function cookieFrom(header: string | null, name: string): string | undefined {
  if (header === null) {
    return undefined;
  }

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");

    if (separator === -1) {
      continue;
    }

    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }

  return undefined;
}

const localHosts = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function isSecureHost(host: string): boolean {
  const name = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : (host.split(":")[0] ?? "");

  return localHosts.has(name.toLowerCase()) === false;
}
