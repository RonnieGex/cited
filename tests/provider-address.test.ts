// @vitest-environment node
import { describe, expect, it } from "vitest";
import { providerAddress, type AddressResolver } from "@/lib/providers/address";

// Section 10.2 of the contract and the requirement "A provider address cannot reach private networks" of
// `specs/provider-settings/spec.md`: a base URL is accepted only for the providers that need one, the resolved address
// cannot be loopback, link-local, private, carrier-grade NAT or the metadata address unless the server sets
// `ALLOW_LOCAL_PROVIDERS=1`, https is the scheme and a redirect is never followed.
//
// No test opens a connection to a private network and none depends on the DNS of the machine: the resolver is the
// controlled double this file passes in. The address of the metadata service and the private ranges appear here
// because a test that only blocks the ranges it dares to dial would not prove the rule.

// 169.254.169.254 is the metadata address of every cloud and the address the review named; 100.64.0.0/10 is the
// carrier-grade NAT range; 198.51.100.0/24 is documentation and public.
const metadata = ["169", "254", "169", "254"].join(".");
const cgnat = ["100", "64", "0", "7"].join(".");
const documentation = ["198", "51", "100", "20"].join(".");
const cloudflare = ["104", "16", "132", "229"].join(".");

const openaiOfficial = "https://api.openai.com/v1";
const ollamaDefault = "http://localhost:11434/v1";

function resolverOf(addresses: string[]): AddressResolver {
  return () => Promise.resolve(addresses.map((address) => ({ address, family: address.includes(":") ? 6 : 4 })));
}

const internal = [
  ["127.0.0.1", "loopback of IPv4"],
  ["127.1.2.3", "the rest of 127.0.0.0/8"],
  ["0.0.0.0", "the address of every interface"],
  [metadata, "the metadata service"],
  ["10.1.2.3", "RFC 1918, 10/8"],
  ["172.16.9.9", "RFC 1918, 172.16/12"],
  ["192.168.1.50", "RFC 1918, 192.168/16"],
  [cgnat, "carrier-grade NAT, 100.64/10"],
  ["::1", "loopback of IPv6"],
  ["fe80::1", "link-local of IPv6"],
  ["fd00::1", "unique local of IPv6"],
  ["::ffff:127.0.0.1", "loopback of IPv4 written as IPv6"],
];

const publicAddresses = [documentation, cloudflare, "1.1.1.1", "2606:4700:4700::1111"];

describe("the rules of a provider address", () => {
  it("refuses every internal address when the server does not allow local providers", async () => {
    for (const [address, name] of internal) {
      const result = await providerAddress({
        baseUrl: `http://${address}:11434/v1`,
        provider: "ollama",
        kind: "chat",
        environment: {},
        resolve: resolverOf([address as string]),
      });

      expect(result.ok, `${name as string} (${address as string})`).toBe(false);
      expect(result.ok === false && result.reason).toBe("address_not_allowed");
    }
  });

  it("refuses a name that resolves to an internal address, whichever the name is", async () => {
    for (const address of ["127.0.0.1", "10.0.0.5", metadata]) {
      const result = await providerAddress({
        baseUrl: "https://miapi.example/v1",
        provider: "ollama",
        kind: "chat",
        environment: {},
        resolve: resolverOf([address]),
      });

      expect(result.ok, address).toBe(false);
    }
  });

  it("refuses the internal address when one of several answers is internal", async () => {
    const result = await providerAddress({
      baseUrl: "https://miapi.example/v1",
      provider: "ollama",
      kind: "chat",
      environment: {},
      resolve: resolverOf([documentation, "10.0.0.5"]),
    });

    expect(result.ok).toBe(false);
  });

  it("accepts a public address over https", async () => {
    for (const address of publicAddresses) {
      const result = await providerAddress({
        baseUrl: "https://miapi.example/v1",
        provider: "ollama",
        kind: "chat",
        environment: {},
        resolve: resolverOf([address]),
      });

      expect(result.ok, address).toBe(true);
      expect(result.ok === true && result.url).toBe("https://miapi.example/v1");
    }
  });

  it("refuses plain http to a public address", async () => {
    const result = await providerAddress({
      baseUrl: "http://miapi.example/v1",
      provider: "ollama",
      kind: "chat",
      environment: {},
      resolve: resolverOf([documentation]),
    });

    expect(result.ok).toBe(false);
  });

  it("accepts a local address when the server sets ALLOW_LOCAL_PROVIDERS=1", async () => {
    for (const address of ["127.0.0.1", "10.0.0.5", "::1"]) {
      // An IPv6 address travels in brackets inside a URL.
      const host = address.includes(":") ? `[${address}]` : address;
      const result = await providerAddress({
        baseUrl: `http://${host}:11434/v1`,
        provider: "ollama",
        kind: "chat",
        environment: { ALLOW_LOCAL_PROVIDERS: "1" },
        resolve: resolverOf([address]),
      });

      expect(result.ok, address).toBe(true);
    }
  });

  it("keeps https as the scheme of a public address even with local providers allowed", async () => {
    const plain = await providerAddress({
      baseUrl: "http://miapi.example/v1",
      provider: "ollama",
      kind: "chat",
      environment: { ALLOW_LOCAL_PROVIDERS: "1" },
      resolve: resolverOf([documentation]),
    });
    const secure = await providerAddress({
      baseUrl: "https://miapi.example/v1",
      provider: "ollama",
      kind: "chat",
      environment: { ALLOW_LOCAL_PROVIDERS: "1" },
      resolve: resolverOf([documentation]),
    });

    expect(plain.ok).toBe(false);
    expect(secure.ok).toBe(true);
  });

  it("keeps the fixed official host of a cloud provider", async () => {
    const official = await providerAddress({
      baseUrl: openaiOfficial,
      provider: "openai",
      kind: "chat",
      environment: {},
      resolve: resolverOf([cloudflare]),
    });
    const elsewhere = await providerAddress({
      baseUrl: "https://mio.example/v1",
      provider: "openai",
      kind: "chat",
      environment: {},
      resolve: resolverOf([cloudflare]),
    });

    expect(official.ok).toBe(true);
    expect(elsewhere.ok).toBe(false);
    expect(elsewhere.ok === false && elsewhere.reason).toBe("address_not_allowed");
  });

  it("accepts the default local address of Ollama when the server allows local providers", async () => {
    const allowed = await providerAddress({
      baseUrl: ollamaDefault,
      provider: "ollama",
      kind: "chat",
      environment: { ALLOW_LOCAL_PROVIDERS: "1" },
      resolve: resolverOf(["127.0.0.1"]),
    });
    const refused = await providerAddress({
      baseUrl: ollamaDefault,
      provider: "ollama",
      kind: "chat",
      environment: {},
      resolve: resolverOf(["127.0.0.1"]),
    });

    expect(allowed.ok).toBe(true);
    expect(refused.ok).toBe(false);
  });

  it("refuses a scheme that is not http or https and an address that is not an address", async () => {
    for (const baseUrl of [
      "file:///etc/passwd",
      "ftp://miapi.example/v1",
      "gopher://miapi.example",
      "not a url",
      "",
      "https://",
    ]) {
      const result = await providerAddress({
        baseUrl,
        provider: "ollama",
        kind: "chat",
        environment: { ALLOW_LOCAL_PROVIDERS: "1" },
        resolve: resolverOf([documentation]),
      });

      expect(result.ok, baseUrl).toBe(false);
    }
  });

  it("refuses credentials inside the address", async () => {
    const result = await providerAddress({
      baseUrl: "https://usuario:clave@miapi.example/v1",
      provider: "ollama",
      kind: "chat",
      environment: {},
      resolve: resolverOf([documentation]),
    });

    expect(result.ok).toBe(false);
  });

  it("calls the resolver once per host and tells the caller to follow no redirect", async () => {
    let asked = 0;
    const result = await providerAddress({
      baseUrl: "https://miapi.example/v1/",
      provider: "ollama",
      kind: "chat",
      environment: {},
      resolve: (host) => {
        asked += 1;

        return Promise.resolve([{ address: documentation, family: 4 }]).then((answers) => {
          expect(host).toBe("miapi.example");

          return answers;
        });
      },
    });

    expect(result.ok).toBe(true);
    expect(asked).toBe(1);
    expect(result.ok === true && result.url).toBe("https://miapi.example/v1");
    expect(result.ok === true && result.redirect).toBe("manual");
  });

  it("refuses a host that does not resolve at all", async () => {
    const result = await providerAddress({
      baseUrl: "https://no-existe.example/v1",
      provider: "ollama",
      kind: "chat",
      environment: {},
      resolve: () => Promise.reject(new Error("ENOTFOUND")),
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe("address_not_allowed");
  });
});
