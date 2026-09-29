import { isIP } from "node:net";
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
//   address of the cloud, unless the server set `ALLOW_LOCAL_PROVIDERS=1`;
// - the caller is told to follow no redirect.
//
// The resolver is a parameter so the suite proves the rule without touching the DNS of the machine and without ever
// opening a connection to a private network: `tests/provider-address.test.ts` passes a controlled double.

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

function isPrivateV4(address: string): boolean {
  const parts = address.split(".").map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => Number.isInteger(part) === false)) {
    return true;
  }

  const [first = 0, second = 0] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    first >= 224
  );
}

// IPv6 as Node reports it: `::1`, `fe80::/10`, `fc00::/7`, multicast, the documentation range and the IPv4-mapped
// form, which is the one a name can hide a loopback in (`::ffff:127.0.0.1`).
function isPrivateV6(address: string): boolean {
  const lower = address.toLowerCase();
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(lower);

  if (mapped !== null) {
    return isPrivateV4(mapped[1] as string);
  }

  const value = lower.split("%")[0] ?? lower;

  if (value === "::" || value === "::1" || value.startsWith("2001:db8")) {
    return true;
  }

  if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("ff")) {
    return true;
  }

  // `fe80` to `febf` is the link-local range, written as the three first hexadecimal digits.
  return /^fe[89ab]/.test(value);
}

function isInternal(address: string): boolean {
  const family = isIP(address);

  if (family === 4) {
    return isPrivateV4(address);
  }

  return family === 6 ? isPrivateV6(address) : true;
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
