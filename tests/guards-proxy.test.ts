// @vitest-environment node
import { describe, expect, it } from "vitest";
import { UNKNOWN_BUCKET, clientAddress, clientIp, trustedProxies } from "@/lib/guards/ip";

function request(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/ask", { method: "POST", headers });
}

describe("the number of trusted proxies", () => {
  it("reads a count out of the value and nothing else", () => {
    expect(trustedProxies({})).toBe(0);
    expect(trustedProxies({ TRUST_PROXY: "" })).toBe(0);
    expect(trustedProxies({ TRUST_PROXY: "0" })).toBe(0);
    expect(trustedProxies({ TRUST_PROXY: "no" })).toBe(0);
    expect(trustedProxies({ TRUST_PROXY: "1.5" })).toBe(0);
    expect(trustedProxies({ TRUST_PROXY: "-2" })).toBe(0);
    expect(trustedProxies({ TRUST_PROXY: "1" })).toBe(1);
    expect(trustedProxies({ TRUST_PROXY: "true" })).toBe(1);
    expect(trustedProxies({ TRUST_PROXY: " 2 " })).toBe(2);
  });
});

describe("the address the chain carries", () => {
  it("answers null when no proxy is trusted or no header arrives", () => {
    const forwarded = request({ "x-forwarded-for": "198.51.100.21, 192.0.2.10" });

    expect(clientAddress(forwarded, {})).toBeNull();
    expect(clientAddress(forwarded, { TRUST_PROXY: "0" })).toBeNull();
    expect(clientAddress(forwarded, { TRUST_PROXY: "no" })).toBeNull();
    expect(clientAddress(request({}), { TRUST_PROXY: "1" })).toBeNull();
    expect(clientAddress(request({}), { TRUST_PROXY: "2" })).toBeNull();
  });

  it("takes the address that many places from the right of x-forwarded-for", () => {
    const forwarded = request({
      "x-forwarded-for": "203.0.113.250, 198.51.100.21, 192.0.2.10",
    });

    expect(clientAddress(forwarded, { TRUST_PROXY: "1" })).toBe("192.0.2.10");
    expect(clientAddress(forwarded, { TRUST_PROXY: "2" })).toBe("198.51.100.21");
    expect(clientAddress(forwarded, { TRUST_PROXY: "3" })).toBe("203.0.113.250");
    expect(clientAddress(forwarded, { TRUST_PROXY: "4" })).toBeNull();
  });

  it("falls back to x-real-ip and then to the single bucket behind a proxy", () => {
    expect(clientAddress(request({ "x-real-ip": "203.0.113.9" }), { TRUST_PROXY: "1" })).toBe(
      "203.0.113.9",
    );
    expect(clientAddress(request({ "x-real-ip": "203.0.113.9" }), { TRUST_PROXY: "2" })).toBe(
      "203.0.113.9",
    );
    expect(clientIp(request({}), { TRUST_PROXY: "1" })).toBe(UNKNOWN_BUCKET);
  });
});
