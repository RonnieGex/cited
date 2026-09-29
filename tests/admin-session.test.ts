// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
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
