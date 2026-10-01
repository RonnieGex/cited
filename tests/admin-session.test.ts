// @vitest-environment node
import type { BinaryLike } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_PASSWORD_MIN_LENGTH,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  adminConfig,
  clearedSessionCookie,
  cookieFrom,
  isSecureHost,
  passwordMatches,
  sessionCookie,
  sessionToken,
  verifySession,
} from "@/lib/admin/session";

// The scenario "The right and the wrong password" asks for the derivations themselves, so the three functions of
// `node:crypto` that a fast hash would use are counted. The module namespace of a builtin cannot be spied on in place,
// so the module is mocked with its own functions, wrapped.
const calls = vi.hoisted(() => {
  const counted = {
    scryptSync: [] as Array<[string, Buffer, number]>,
    timingSafeEqual: 0,
    createHash: [] as string[],
  };

  return counted;
});

vi.mock("node:crypto", async (original: () => Promise<typeof import("node:crypto")>) => {
  const actual = await original();

  return {
    ...actual,
    scryptSync: (password: BinaryLike, salt: BinaryLike, keylen: number) => {
      calls.scryptSync.push([String(password), salt as Buffer, keylen]);

      return actual.scryptSync(password, salt, keylen);
    },
    timingSafeEqual: (left: NodeJS.ArrayBufferView, right: NodeJS.ArrayBufferView) => {
      calls.timingSafeEqual += 1;

      return actual.timingSafeEqual(left, right);
    },
    createHash: (algorithm: string) => {
      calls.createHash.push(algorithm);

      return actual.createHash(algorithm);
    },
  } satisfies typeof import("node:crypto");
});

const secret = "el-secreto-de-la-sesion";
const now = new Date("2026-09-29T12:00:00.000Z");
const password = "la-clave-del-propietario";

describe("the session of the panel", () => {
  it("names the missing variables and never a value", () => {
    const config = adminConfig({ ADMIN_PASSWORD: "", ADMIN_SESSION_SECRET: "  " });

    expect(config.missing).toEqual(["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"]);
    expect(config.password).toBe("");
    expect(config.secret).toBe("");

    const complete = adminConfig({ ADMIN_PASSWORD: password, ADMIN_SESSION_SECRET: secret });

    expect(complete.missing).toEqual([]);
    expect(complete.password).toBe(password);
    expect(complete.secret).toBe(secret);
  });

  it("flags a password shorter than the sixteen characters of the spec", () => {
    const short = adminConfig({ ADMIN_PASSWORD: "corta".repeat(3), ADMIN_SESSION_SECRET: secret });

    expect(ADMIN_PASSWORD_MIN_LENGTH).toBe(16);
    expect(short.missing).toEqual([]);
    expect(short.shortPassword).toBe(true);

    const exact = adminConfig({
      ADMIN_PASSWORD: "panel".repeat(3) + "1",
      ADMIN_SESSION_SECRET: secret,
    });

    expect("panel".repeat(3) + "1").toHaveLength(16);
    expect(exact.shortPassword).toBe(false);
    expect(adminConfig({ ADMIN_PASSWORD: "", ADMIN_SESSION_SECRET: secret }).shortPassword).toBe(false);
  });

  it("signs expiry and signature and accepts only its own token", () => {
    const token = sessionToken(secret, now);
    const [expiry, signature] = token.split(".");

    expect(SESSION_COOKIE).toBe("cited_admin");
    expect(Number(expiry)).toBe(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
    expect(verifySession(secret, token, now)).toBe(true);
    expect(verifySession(secret, token, new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000))).toBe(
      false,
    );
    expect(verifySession(secret, `${expiry}.${"0".repeat(64)}`, now)).toBe(false);
    expect(verifySession("otro-secreto", token, now)).toBe(false);
    expect(verifySession(secret, undefined, now)).toBe(false);
    expect(verifySession(secret, "sin-punto", now)).toBe(false);
    expect(verifySession(secret, "no-numerico.firma", now)).toBe(false);
    expect(verifySession("", token, now)).toBe(false);
  });

  it("compares the password without leaking its length or its content", () => {
    expect(passwordMatches(password, password)).toBe(true);
    expect(passwordMatches(password, `${password} `)).toBe(false);
    expect(passwordMatches(password, password.slice(0, -1))).toBe(false);
    expect(passwordMatches(password, "")).toBe(false);
    expect(passwordMatches("", "")).toBe(false);
    expect(passwordMatches(password, "x".repeat(4096))).toBe(false);
  });

  // The scenario "The right and the wrong password" of
  // `openspec/changes/codeql-findings/specs/admin-panel/spec.md`: only the password of `ADMIN_PASSWORD` matches, and
  // every comparison goes through scrypt and a constant-time comparison, never through a fast hash.
  it("matches only the password of the panel, through scrypt and a constant-time comparison", () => {
    calls.scryptSync.length = 0;
    calls.createHash.length = 0;
    calls.timingSafeEqual = 0;

    expect(passwordMatches(password, password)).toBe(true);
    expect(passwordMatches(password, `${password} `)).toBe(false);
    expect(passwordMatches(password, password.slice(0, -1))).toBe(false);
    expect(passwordMatches(password, "")).toBe(false);

    // Two derivations per comparison: the given value and the one of the panel.
    expect(calls.scryptSync).toHaveLength(8);
    expect(calls.timingSafeEqual).toBe(4);
    expect(calls.createHash).toEqual([]);

    const first = calls.scryptSync[0];
    const second = calls.scryptSync[1];

    expect(first?.[0]).toBe(password);
    expect(second?.[0]).toBe(password);
    expect(first?.[2]).toBe(32);
    expect(second?.[2]).toBe(32);
    expect(first?.[1]).toHaveLength(16);

    // One salt of the process, drawn once when the module loads: every derivation carries the same one.
    expect(calls.scryptSync.every((call) => call[1] === first?.[1])).toBe(true);

    // An empty panel password still answers `false`, without deriving anything.
    calls.scryptSync.length = 0;

    expect(passwordMatches("", "")).toBe(false);
    expect(calls.scryptSync).toEqual([]);
  });

  it("writes the cookie with httpOnly, sameSite strict and the twelve hours of the design", () => {
    const cookie = sessionCookie("token-de-prueba", true);

    expect(cookie).toContain(`${SESSION_COOKIE}=token-de-prueba`);
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain(`Max-Age=${SESSION_MAX_AGE_SECONDS}`);
    expect(cookie).toContain("Secure");
    expect(sessionCookie("token-de-prueba", false)).not.toContain("Secure");
    expect(clearedSessionCookie(true)).toContain("Max-Age=0");
  });

  it("reads one cookie out of the header and knows what localhost is", () => {
    expect(cookieFrom(`otra=1; ${SESSION_COOKIE}=abc; tercera=2`, SESSION_COOKIE)).toBe("abc");
    expect(cookieFrom("otra=1", SESSION_COOKIE)).toBeUndefined();
    expect(cookieFrom(null, SESSION_COOKIE)).toBeUndefined();

    expect(isSecureHost("localhost")).toBe(false);
    expect(isSecureHost("localhost:3000")).toBe(false);
    expect(isSecureHost("127.0.0.1:3000")).toBe(false);
    expect(isSecureHost("[::1]:3000")).toBe(false);
    expect(isSecureHost("cited.example.com")).toBe(true);
  });
});
