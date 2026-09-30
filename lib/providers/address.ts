import { BlockList, isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { providerEntry, type CatalogueKind } from "./catalog.ts";

// Requirement "A provider address cannot reach private networks" of `specs/provider-settings/spec.md`, and the Major
// M-1 of `katalis-dev/tasks/revision-community-12.md`: `baseUrl` arrives in the JSON of the browser, so without a
// rule the process of Cited becomes a way of scanning the network it runs in and of sending a customer key to an
// endpoint nobody authorised.
//
// The rules of this module, in order:
// - an address is accepted only for the providers that need one: Ollama, LM Studio and a custom OpenAI-compatible
//   endpoint; a cloud provider uses the fixed official host of the catalogue, which is what the requirement asks;
// - the scheme is `https`, and `http` only to a local host when the server sets `ALLOW_LOCAL_PROVIDERS=1`;
// - the host is resolved here, and no answer may be loopback, link-local, private, carrier-grade NAT or the metadata
//   address of the cloud, unless the server set `ALLOW_LOCAL_PROVIDERS=1`; every notation is classified — the tables
//   are `node:net` `BlockList` subnets and an address that carries an IPv4 inside (mapped, NAT64, 6to4) is judged by
//   that IPv4, which is the Major M-1 of `katalis-dev/tasks/revision-community-12b.md`;
// - the caller is told to follow no redirect.
//
// The resolver is a parameter so the suite proves the rule without touching the DNS of the machine and without ever
// opening a connection to a private network: `tests/provider-address.test.ts` passes a controlled double. This module
// answers with the addresses it classified, which is what `lib/providers/pinned.ts` connects to (requirement "The
// address that was validated is the address that is connected to").

export const ALLOW_LOCAL_PROVIDERS_VARIABLE = "ALLOW_LOCAL_PROVIDERS";
export const ADDRESS_NOT_ALLOWED = "address_not_allowed";

export type AddressReason = typeof ADDRESS_NOT_ALLOWED;

export type AddressAnswer = { address: string; family: number };
export type AddressResolver = (host: string) => Promise<AddressAnswer[]>;

export type ProviderAddressInput = {
  baseUrl: string;
  provider: string;
  kind: CatalogueKind;
  environment?: Record<string, string | undefined>;
  resolve?: AddressResolver;
};

export type ProviderAddressResult =
  | { ok: true; url: string; host: string; addresses: string[]; redirect: "manual" }
  | { ok: false; reason: AddressReason };

// The providers whose address the owner may point somewhere of their own. The cloud providers of the catalogue keep
// the host they publish, which is what whoever installs writes in `OPENAI_BASE_URL` and the like when they put a
// gateway in front: that address is the one the catalogue reads and it is not a value the browser sends.
const OWN_ADDRESS = ["ollama", "lmstudio", "openai-compatible", "custom"];

// `localhost` alone is a name and not a literal address, so `isIP()` cannot judge it: the resolver does, and every
// answer it gives goes through the same table.
const LOCAL_NAMES = ["localhost", "localhost.localdomain", "ip6-localhost"];

// Where each cloud provider of the catalogue answers: the fixed official host of the provider, plus the address
// whoever installs wrote in `OPENAI_BASE_URL` and its siblings (a gateway, a proxy). Both come from the server — the
// second one from the environment, never from the body of a request — so a value the browser sends is accepted only
// when it names one of them.
const OFFICIAL_HOSTS: Record<string, string[]> = {
  openai: ["api.openai.com"],
  anthropic: ["api.anthropic.com"],
  gemini: ["generativelanguage.googleapis.com"],
  deepseek: ["api.deepseek.com"],
  groq: ["api.groq.com"],
  openrouter: ["openrouter.ai"],
};

function allowsLocal(environment: Record<string, string | undefined>): boolean {
  return (environment[ALLOW_LOCAL_PROVIDERS_VARIABLE]?.trim() ?? "") === "1";
}

// The ranges that never answer as a provider of the owner, in the order of the requirement: this network, RFC 1918,
// carrier-grade NAT, loopback, link-local (where the metadata service of the cloud lives), the protocol assignments,
// benchmarking, multicast and the reserved range. They are subnets of `node:net` `BlockList`, which parses and
// compares the numbers: the Major M-1 of `katalis-dev/tasks/revision-community-12b.md` was a table of hand-written
// comparisons that only knew one spelling of an address.
const privateV4 = new BlockList();

for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  privateV4.addSubnet(network, prefix, "ipv4");
}

// The same for IPv6: the unspecified address, loopback, unique local, link-local, multicast, the documentation range,
// Teredo — a tunnel that carries an address nobody classified — and the IPv4-translated range of SIIT.
const privateV6 = new BlockList();

for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001:db8::", 32],
  ["2001::", 32],
  ["::ffff:0:0:0", 96],
] as const) {
  privateV6.addSubnet(network, prefix, "ipv6");
}

// The eight groups of an IPv6 literal, whatever its notation: a compressed `::`, upper case, a zone and a trailing
// dotted quad all end in the same numbers. `null` is a literal `node:net` would not accept either.
function groupsOf(address: string): number[] | null {
  const value = (address.split("%")[0] ?? address).toLowerCase();
  const compressed = value.includes("::");
  const [headText = "", tailText = ""] = compressed ? value.split("::") : [value, ""];

  function expand(text: string): number[] | null {
    if (text.length === 0) {
      return [];
    }

    const parts = text.split(":");
    const last = parts[parts.length - 1] ?? "";

    if (last.includes(".")) {
      const quad = last.split(".").map((part) => Number(part));

      if (quad.length !== 4 || quad.some((part) => Number.isInteger(part) === false || part < 0 || part > 255)) {
        return null;
      }

      const [a = 0, b = 0, c = 0, d = 0] = quad;

      parts.splice(parts.length - 1, 1, ((a << 8) | b).toString(16), ((c << 8) | d).toString(16));
    }

    if (parts.some((part) => /^[0-9a-f]{1,4}$/.test(part) === false)) {
      return null;
    }

    return parts.map((part) => Number.parseInt(part, 16));
  }

  const head = expand(headText);

  if (head === null) {
    return null;
  }

  if (compressed === false) {
    return head.length === 8 ? head : null;
  }

  const tail = expand(tailText);

  if (tail === null) {
    return null;
  }

  const zeros = 8 - head.length - tail.length;

  return zeros < 1 ? null : [...head, ...new Array<number>(zeros).fill(0), ...tail];
}

function dotted(high: number, low: number): string {
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
}

// The 32 bits of IPv4 an IPv6 literal carries inside, if it carries any: the mapped form `::ffff:0:0/96` — which is
// how a name or a literal reaches the loopback of the server —, the deprecated compatible form `::/96`, NAT64
// (`64:ff9b::/96` and its local-use sibling `64:ff9b:1::/48`) and 6to4 (`2002::/16`). `new URL()` canonicalises the
// dotted mapping into hexadecimal (`http://[::ffff:127.0.0.1]:11434` arrives as `::ffff:7f00:1`), so the guard reads
// the number and never the spelling: that was the whole of the Major M-1.
function embeddedIpv4(address: string): string | null {
  const groups = groupsOf(address);

  if (groups === null) {
    return null;
  }

  const [first = 0, second = 0, third = 0, fourth = 0, fifth = 0, sixth = 0, high = 0, low = 0] = groups;

  if (first === 0 && second === 0 && third === 0 && fourth === 0 && fifth === 0 && (sixth === 0 || sixth === 0xffff)) {
    return dotted(high, low);
  }

  if (first === 0x64 && second === 0xff9b && (third === 0 || third === 1) && fourth === 0 && fifth === 0 && sixth === 0) {
    return dotted(high, low);
  }

  return first === 0x2002 ? dotted(second, third) : null;
}

function isInternal(address: string): boolean {
  const family = isIP(address);

  if (family === 4) {
    return privateV4.check(address, "ipv4");
  }

  if (family !== 6) {
    return true;
  }

  const embedded = embeddedIpv4(address);

  // An address that carries an IPv4 is judged by that IPv4: `::ffff:5db8:d822` is the public address it names and
  // `::ffff:7f00:1` is the loopback of the server.
  if (embedded !== null) {
    return privateV4.check(embedded, "ipv4");
  }

  try {
    return privateV6.check(address, "ipv6");
  } catch {
    // A literal `BlockList` refuses is a literal nothing should connect to.
    return true;
  }
}

function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

// The address a cloud provider answers on: the fixed official host of the catalogue, or the one whoever installs
// wrote in `OPENAI_BASE_URL` and its siblings when they put a gateway in front. Both come from the server, and both
// are the address the panel itself offers, so a value the browser sends is accepted only when it is one of them.
function officialHosts(input: ProviderAddressInput): string[] {
  const entry = providerEntry(input.provider, input.kind, input.environment ?? {});
  const declared = entry === null ? "" : input.kind === "chat" ? entry.baseUrl : entry.embeddingsBaseUrl;
  const configured = parse(declared);
  const names = [
    ...(OFFICIAL_HOSTS[input.provider] ?? []),
    ...(configured === null ? [] : [configured.hostname.toLowerCase()]),
  ];

  return names.map((name) => name.toLowerCase());
}

async function resolveHost(host: string, resolve: AddressResolver): Promise<string[]> {
  const literal = isIP(host);

  if (literal !== 0) {
    return [host];
  }

  try {
    const answers = await resolve(host);

    return answers.map((answer) => answer.address);
  } catch {
    // A name that does not resolve is a name that cannot be called: the same answer as an address that is not allowed.
    return [];
  }
}

function hostOf(hostname: string): string {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname.toLowerCase();
}

export async function providerAddress(
  input: ProviderAddressInput,
): Promise<ProviderAddressResult> {
  const environment = input.environment ?? {};
  const local = allowsLocal(environment);
  const declared = input.baseUrl?.trim() ?? "";

  if (declared.length === 0) {
    return { ok: false, reason: ADDRESS_NOT_ALLOWED };
  }

  const url = parse(declared);

  // A scheme that is not http or https is never a provider, and an address with credentials inside would put a
  // password of its own in a log line of a proxy.
  if (url === null || (url.protocol !== "https:" && url.protocol !== "http:") || url.username.length > 0 || url.password.length > 0) {
    return { ok: false, reason: ADDRESS_NOT_ALLOWED };
  }

  const host = hostOf(url.hostname);
  const official = officialHosts(input);
  const ownAddress = OWN_ADDRESS.includes(input.provider);

  // A cloud provider uses one of the addresses of the server: a value that names any other host is a value the
  // browser sent, and the key would travel to whoever wrote it.
  if (ownAddress === false && official.includes(host) === false) {
    return { ok: false, reason: ADDRESS_NOT_ALLOWED };
  }

  const resolve = input.resolve ?? ((name: string) => lookup(name, { all: true }));
  const addresses = await resolveHost(host, resolve);

  if (addresses.length === 0) {
    return { ok: false, reason: ADDRESS_NOT_ALLOWED };
  }

  const internalName = LOCAL_NAMES.includes(host) || host.endsWith(".local") || host.endsWith(".internal");
  const internal = internalName || addresses.some((address) => isInternal(address));

  // Plain http only travels to a local host, and only when whoever installs allowed it: everywhere else the key
  // would cross the network in clear.
  if (url.protocol === "http:" && (local === false || internal === false)) {
    return { ok: false, reason: ADDRESS_NOT_ALLOWED };
  }

  if (internal && local === false) {
    return { ok: false, reason: ADDRESS_NOT_ALLOWED };
  }

  return {
    ok: true,
    url: url.toString().replace(/\/+$/, ""),
    host,
    addresses,
    redirect: "manual",
  };
}
