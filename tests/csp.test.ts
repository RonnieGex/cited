import { describe, expect, it } from "vitest";
import {
  allowedOrigins,
  contentSecurityPolicy,
  frameAncestors,
  nonceOf,
  policyFor,
} from "@/lib/headers/csp";

// Design decision 5 of `openspec/changes/public-page-and-widget/design.md`: `/embed` sends
// `Content-Security-Policy: frame-ancestors 'self' <ALLOWED_ORIGINS>`; `/` sends `frame-ancestors 'self'`; both send a
// CSP without inline scripts other than Next's nonce.

const policyOf = (input: {
  nonce: string;
  pathname: string;
  allowed?: string;
  development?: boolean;
}): string =>
  contentSecurityPolicy({
    nonce: input.nonce,
    ancestors: frameAncestors(input.pathname, allowedOrigins(input.allowed)),
    development: input.development ?? false,
  });

describe("the origins the widget accepts", () => {
  it("takes the list of the environment and nothing else", () => {
    expect(allowedOrigins(undefined)).toEqual([]);
    expect(allowedOrigins("")).toEqual([]);
    expect(allowedOrigins("   ")).toEqual([]);
    expect(allowedOrigins("https://shop.example")).toEqual(["https://shop.example"]);
    expect(allowedOrigins(" https://shop.example , http://127.0.0.1:3210 ")).toEqual([
      "https://shop.example",
      "http://127.0.0.1:3210",
    ]);
  });

  it("drops what is not an origin", () => {
    expect(allowedOrigins("*")).toEqual([]);
    expect(allowedOrigins("shop.example")).toEqual([]);
    expect(allowedOrigins("ftp://shop.example")).toEqual([]);
    expect(allowedOrigins("javascript:alert(1)")).toEqual([]);
    expect(allowedOrigins("https://shop.example, , not a url, *")).toEqual([
      "https://shop.example",
    ]);
  });

  it("keeps the origin of a full url and repeats nothing", () => {
    expect(allowedOrigins("https://shop.example/checkout?a=1")).toEqual(["https://shop.example"]);
    expect(allowedOrigins("https://shop.example,https://shop.example")).toEqual([
      "https://shop.example",
    ]);
  });
});

describe("frame-ancestors", () => {
  it("keeps the public page on itself", () => {
    expect(frameAncestors("/", ["https://shop.example"])).toEqual(["'self'"]);
    expect(frameAncestors("/kit", ["https://shop.example"])).toEqual(["'self'"]);
  });

  it("adds the allowed origins to the chat that is embedded", () => {
    expect(frameAncestors("/embed", ["https://shop.example"])).toEqual([
      "'self'",
      "https://shop.example",
    ]);
    expect(frameAncestors("/embed", [])).toEqual(["'self'"]);
    expect(frameAncestors("/embed", ["https://a.example", "https://b.example"])).toEqual([
      "'self'",
      "https://a.example",
      "https://b.example",
    ]);
  });
});

describe("the policy of the page", () => {
  it("carries the nonce for the scripts of Next and no inline script", () => {
    const policy = policyOf({ nonce: "abc123", pathname: "/" });

    expect(policy).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(policy).not.toContain("script-src 'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("frame-ancestors 'self'");
    expect(policy).not.toContain("https://shop.example");
  });

  it("lists the allowed origins of the embed and nothing else", () => {
    const policy = policyOf({
      nonce: "abc123",
      pathname: "/embed",
      allowed: "https://shop.example, https://other.example",
    });

    expect(policy).toContain("frame-ancestors 'self' https://shop.example https://other.example");
    expect(policy).not.toContain("https://evil.example");
    expect(policy).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
  });

  it("allows the eval of the development build only", () => {
    expect(policyOf({ nonce: "n", pathname: "/", development: true })).toContain(
      "script-src 'self' 'nonce-n' 'strict-dynamic' 'unsafe-eval'",
    );
    expect(policyOf({ nonce: "n", pathname: "/", development: false })).not.toContain(
      "'unsafe-eval'",
    );
  });

  // Amended by the change `elevenlabs-voice-agent` and trimmed by its task 10.4: the browser asks this server for the
  // signed URL and opens the WebSocket session of ElevenLabs with it, so `connect-src` names that socket and nothing
  // else of the provider — the HTTPS endpoint of the API belongs to the routes of the server, which are the only ones
  // that hold the key. The processors and the resampler of the session are files of this origin, and the session hands
  // the SDK their paths, so `worker-src` is `'self'` and no `blob:` module is requested; there is no `media-src`
  // either, because the answer plays through the `MediaStream` the SDK assigns to the `srcObject` of an audio element,
  // which is not a fetch. `script-src` is not touched: the nonce with `strict-dynamic` stays as it was, and it needs no
  // third-party host.
  it("names the endpoints of the voice session, and only them", () => {
    const policy = policyOf({ nonce: "abc123", pathname: "/" });
    const directive = (name: string): string | undefined =>
      new RegExp(`${name} ([^;]+)`).exec(policy)?.[1];

    expect(directive("connect-src")).toBe("'self' wss://api.elevenlabs.io");
    expect(directive("worker-src")).toBe("'self'");
    expect(directive("media-src")).toBeUndefined();
    expect(directive("script-src")).toBe("'self' 'nonce-abc123' 'strict-dynamic'");
    expect(policy).not.toContain("jsdelivr");
    expect(policy.match(/https?:\/\/[^\s;]+/g) ?? []).toEqual([]);
    expect(policy.match(/wss?:\/\/[^\s;]+/g) ?? []).toEqual(["wss://api.elevenlabs.io"]);
  });

  it("hands Next a nonce it can read, base64 and different every time", () => {
    const one = nonceOf();
    const other = nonceOf();

    expect(one).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(one.length).toBeGreaterThanOrEqual(20);
    expect(other).not.toBe(one);
  });

  it("takes the allowed origins of the environment, which is where the code reads them", () => {
    const embed = policyFor({
      pathname: "/embed",
      environment: { ALLOWED_ORIGINS: "https://shop.example" },
      development: false,
      nonce: "n",
    });
    const home = policyFor({
      pathname: "/",
      environment: { ALLOWED_ORIGINS: "https://shop.example" },
      development: false,
      nonce: "n",
    });

    expect(embed).toContain("frame-ancestors 'self' https://shop.example");
    expect(home).toContain("frame-ancestors 'self'");
    expect(home).not.toContain("https://shop.example");
    expect(policyFor({ pathname: "/embed", environment: {}, development: false, nonce: "n" })).toContain(
      "frame-ancestors 'self'",
    );
  });
});
