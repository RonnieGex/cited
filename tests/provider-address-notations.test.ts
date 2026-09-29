// @vitest-environment node
import { describe, expect, it } from "vitest";
import { providerAddress, type AddressResolver } from "@/lib/providers/address";

// Task 11.1 of the contract and the requirement "The address that was validated is the address that is connected to"
// of `specs/provider-settings/spec.md`: "addresses SHALL be classified in every notation, including IPv4 mapped into
// IPv6 in dotted or hexadecimal form, unique local, link-local, NAT64 and 6to4 addresses that embed a private IPv4".
//
// The Major M-1 of `katalis-dev/tasks/revision-community-12b.md` reproduced the evasion with the three literals of the
// first three rows. `new URL()` canonicalises an IPv4 mapped into IPv6 — `http://[::ffff:127.0.0.1]:11434` arrives as
// `::ffff:7f00:1` —, so every case here enters through a real base URL and the guard reads the literal that Node
// actually delivers, never a string a test injected for it.
//
// No test opens a connection: the resolver of a name is the controlled double of this file and every literal is
// classified before anything is called. The documentation address `198.51.100.20` is the public answer of that double.

function resolverOf(addresses: string[]): AddressResolver {
  return () =>
    Promise.resolve(addresses.map((address) => ({ address, family: address.includes(":") ? 6 : 4 })));
}

const documentation = "198.51.100.20";

// The literal of every row is written between brackets, which is how an IPv6 address travels in a URL.
const internalNotations: Array<[string, string]> = [
  ["::ffff:7f00:1", "the loopback of IPv4 mapped into IPv6, hexadecimal form (M-1 of the review)"],
  ["::ffff:127.0.0.1", "the same loopback written with dots; `new URL()` delivers the hexadecimal form"],
  ["::ffff:a00:1", "10.0.0.1 mapped into IPv6, hexadecimal form (M-1 of the review)"],
  ["::ffff:c0a8:101", "192.168.1.1 mapped into IPv6, hexadecimal form"],
  ["64:ff9b::7f00:1", "NAT64 (64:ff9b::/96) that embeds the loopback"],
  ["64:ff9b::a00:1", "NAT64 that embeds 10.0.0.1"],
  ["2002:7f00:1::1", "6to4 (2002::/16) that embeds the loopback"],
  ["2002:a9fe:a9fe::1", "6to4 that embeds the metadata address of the cloud"],
  ["fc00::1", "unique local (fc00::/7)"],
  ["fd00:1234::5", "unique local (fd00::/8)"],
  ["fe80::1", "link-local (fe80::/10)"],
  ["febf::1", "the end of the link-local range"],
  ["::", "the unspecified address"],
  ["::1", "the loopback of IPv6"],
  ["ff02::1", "multicast"],
  ["2001:db8::1", "the documentation range"],
  ["127.0.0.1", "loopback of IPv4"],
  ["127.9.8.7", "the rest of 127.0.0.0/8"],
  ["0.0.0.0", "the address of every interface"],
  ["0.1.2.3", "the rest of 0.0.0.0/8"],
  ["10.1.2.3", "RFC 1918, 10/8"],
  ["100.64.0.1", "carrier-grade NAT, the start of 100.64/10"],
  ["100.127.255.254", "carrier-grade NAT, the end of 100.64/10"],
  ["169.254.1.2", "link-local of IPv4"],
  ["169.254.169.254", "the metadata service of the cloud"],
  ["172.16.0.1", "RFC 1918, the start of 172.16/12"],
  ["172.31.255.254", "RFC 1918, the end of 172.16/12"],
  ["192.168.1.1", "RFC 1918, 192.168/16"],
  ["224.0.0.1", "multicast"],
  ["240.0.0.1", "the reserved range"],
];

// A public address in each notation, so the table proves a rule and not a blanket refusal: the last row is an IPv4
// mapped into IPv6 whose embedded address is public (93.184.216.34) and which has to stay accepted.
const publicNotations: Array<[string, string]> = [
  ["198.51.100.20", "documentation, IPv4"],
  ["104.16.132.229", "Cloudflare, IPv4"],
  ["2606:4700:4700::1111", "Cloudflare, IPv6"],
  ["::ffff:5db8:d822", "93.184.216.34 mapped into IPv6"],
  ["64:ff9b::5db8:d822", "NAT64 that embeds a public address"],
  ["2002:5db8:d822::1", "6to4 that embeds a public address"],
];

describe("the notation of an address does not change its classification", () => {
  it("refuses every internal address without ALLOW_LOCAL_PROVIDERS", async () => {
    for (const [literal, name] of internalNotations) {
      const bracketed = literal.includes(":") ? `[${literal}]` : literal;
      const result = await providerAddress({
        baseUrl: `http://${bracketed}:11434/v1`,
        provider: "ollama",
        kind: "chat",
        environment: {},
        resolve: resolverOf([documentation]),
      });

      expect(result.ok, `${name} (${literal})`).toBe(false);
      expect(result.ok === false && result.reason, `${name} (${literal})`).toBe(
        "address_not_allowed",
      );
    }
  });

  it("accepts every public address of the table", async () => {
    for (const [literal, name] of publicNotations) {
      const bracketed = literal.includes(":") ? `[${literal}]` : literal;
      const result = await providerAddress({
        baseUrl: `https://${bracketed}/v1`,
        provider: "ollama",
        kind: "chat",
        environment: {},
        resolve: resolverOf([documentation]),
      });

      expect(result.ok, `${name} (${literal})`).toBe(true);
    }
  });

  it("accepts the internal addresses of the table when the server allows local providers", async () => {
    for (const [literal, name] of internalNotations) {
      const bracketed = literal.includes(":") ? `[${literal}]` : literal;
      const result = await providerAddress({
        baseUrl: `http://${bracketed}:11434/v1`,
        provider: "ollama",
        kind: "chat",
        environment: { ALLOW_LOCAL_PROVIDERS: "1" },
        resolve: resolverOf([documentation]),
      });

      expect(result.ok, `${name} (${literal})`).toBe(true);
    }
  });

  it("refuses a name whose controlled answer is one of the written forms", async () => {
    for (const [literal, name] of internalNotations) {
      const result = await providerAddress({
        baseUrl: "https://miapi.example/v1",
        provider: "ollama",
        kind: "chat",
        environment: {},
        resolve: resolverOf([literal]),
      });

      expect(result.ok, `${name} (${literal})`).toBe(false);
    }
  });

  it("refuses the internal answer even when another answer of the same name is public", async () => {
    for (const [literal, name] of internalNotations) {
      const result = await providerAddress({
        baseUrl: "https://miapi.example/v1",
        provider: "ollama",
        kind: "chat",
        environment: {},
        resolve: resolverOf([documentation, literal]),
      });

      expect(result.ok, `${name} (${literal})`).toBe(false);
    }
  });
});
