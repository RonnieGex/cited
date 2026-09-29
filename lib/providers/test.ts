import { providerAddress, ADDRESS_NOT_ALLOWED, type AddressResolver } from "./address.ts";
import { providerEntry } from "./catalog.ts";
import { pinnedFetch } from "./pinned.ts";
import { DEFAULT_CHAT_MODELS } from "../models/types.ts";

// Decision 4 of `openspec/changes/provider-keys-in-panel/design.md`: one minimal call to the provider the owner chose,
// with a ten-second timeout, and one word for what happened. The raw answer of the provider never travels to the
// browser and no key is ever written in a log line. Every provider is called here through the pinned transport of
// `lib/providers/pinned.ts`, which speaks the same shape the test doubles of the suite speak.
//
// The requirement "A provider address cannot reach private networks" is applied before the call, in
// `lib/providers/address.ts`, and the call itself follows no redirect: a provider that answers 302 to an address of
// the internal network would otherwise take the key there.

export const TEST_TIMEOUT_MS = 10_000;
export const TEST_TIMEOUT_VARIABLE = "PROVIDER_TEST_TIMEOUT_MS";

export type TestReason =
  | "rejected_key"
  | "no_credit"
  | "rate_limited"
  | "model_not_found"
  | "unreachable"
  | "timeout"
  | typeof ADDRESS_NOT_ALLOWED;

export type ProviderTestInput = {
  kind: "chat" | "embeddings";
  provider: string;
  key?: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
  /** The resolver of the guard, for the suite: a test classifies a controlled answer and never the DNS of the machine. */
  resolve?: AddressResolver;
};

export type ProviderTestOutcome =
  | { ok: true; model: string; latencyMs: number }
  | { ok: false; reason: TestReason };

class ProviderTestError extends Error {
  readonly reason: TestReason;

  constructor(reason: TestReason) {
    super(reason);
    this.reason = reason;
  }
}

export function testTimeoutMs(environment: Record<string, string | undefined> = process.env): number {
  const declared = Number(environment[TEST_TIMEOUT_VARIABLE] ?? "");

  return Number.isInteger(declared) && declared > 0 ? declared : TEST_TIMEOUT_MS;
}

function timeoutReason(error: unknown): TestReason {
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return "timeout";
    }

    if (error.cause !== undefined && error.cause !== error) {
      return timeoutReason(error.cause);
    }
  }

  return "unreachable";
}

// The status of an HTTP answer in the closed list of the requirement, in the words of the owner: a key the provider
// refused, an account without credit, a rate limit, a model that does not exist, an address that does not answer.
export function reasonOfStatus(status: number, body: string): TestReason {
  if (status === 401 || status === 403) {
    return "rejected_key";
  }

  if (status === 402) {
    return "no_credit";
  }

  if (status === 404) {
    return "model_not_found";
  }

  // Gemini answers 400 with `API_KEY_INVALID` for a key it refuses, and Anthropic answers 400 for a malformed one.
  if (status === 400 && /api[\s_-]?key|invalid[\s\S]{0,40}key|key[\s\S]{0,40}invalid/i.test(body)) {
    return "rejected_key";
  }

  if (status === 429) {
    return /quota|credit|insufficient|billing/i.test(body) ? "no_credit" : "rate_limited";
  }

  return "unreachable";
}

type Call = {
  url: string;
  headers: Record<string, string>;
  body: unknown;
};

function baseUrlFor(input: ProviderTestInput): string {
  const declared = input.baseUrl?.trim() ?? "";

  if (declared.length > 0) {
    return declared.replace(/\/+$/, "");
  }

  const entry = providerEntry(input.provider, input.kind);

  if (entry === null) {
    throw new ProviderTestError("unreachable");
  }

  const url = input.kind === "chat" ? entry.baseUrl : entry.embeddingsBaseUrl;

  if (url.trim().length === 0) {
    throw new ProviderTestError("unreachable");
  }

  return url.replace(/\/+$/, "");
}

function modelFor(input: ProviderTestInput): string {
  const declared = input.model?.trim() ?? "";

  if (declared.length > 0) {
    return declared;
  }

  const entry = providerEntry(input.provider, input.kind);
  const fallback =
    input.kind === "chat"
      ? (entry?.chatModel ?? DEFAULT_CHAT_MODELS.fake)
      : (entry?.embeddingsModel ?? "");

  return fallback;
}

function chatCall(input: ProviderTestInput, model: string): Call {
  const base = baseUrlFor(input);
  const key = input.key?.trim() ?? "";
  const json = { "content-type": "application/json" };

  if (input.provider === "anthropic") {
    return {
      url: `${base}/messages`,
      headers: { ...json, "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: { model, max_tokens: 5, messages: [{ role: "user", content: "ping" }] },
    };
  }

  if (input.provider === "gemini") {
    return {
      url: `${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      headers: json,
      body: { contents: [{ parts: [{ text: "ping" }] }], generationConfig: { maxOutputTokens: 5 } },
    };
  }

  return {
    url: `${base}/chat/completions`,
    headers: key.length === 0 ? json : { ...json, authorization: `Bearer ${key}` },
    body: { model, max_tokens: 5, messages: [{ role: "user", content: "ping" }] },
  };
}

function embeddingsCall(input: ProviderTestInput, model: string): Call {
  const base = baseUrlFor(input);
  const key = input.key?.trim() ?? "";

  if (input.provider === "ollama") {
    return {
      url: `${base}/api/embed`,
      headers: { "content-type": "application/json" },
      body: { model, input: ["ping"] },
    };
  }

  return {
    url: `${base}/embeddings`,
    headers:
      key.length === 0
        ? { "content-type": "application/json" }
        : { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: { model, input: ["ping"] },
  };
}

function textOf(provider: string, answer: Record<string, unknown>): string {
  if (provider === "anthropic") {
    const content = answer["content"] as Array<{ text?: string }> | undefined;

    return content?.[0]?.text?.trim() ?? "";
  }

  if (provider === "gemini") {
    const candidates = answer["candidates"] as
      | Array<{ content?: { parts?: Array<{ text?: string }> } }>
      | undefined;

    return candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  }

  const choices = answer["choices"] as Array<{ message?: { content?: string } }> | undefined;

  return choices?.[0]?.message?.content?.trim() ?? "";
}

function vectorOf(provider: string, answer: Record<string, unknown>): number[] {
  if (provider === "ollama") {
    const embeddings = answer["embeddings"] as number[][] | undefined;

    return embeddings?.[0] ?? [];
  }

  const data = answer["data"] as Array<{ embedding?: number[] }> | undefined;

  return data?.[0]?.embedding ?? [];
}

async function callProvider(
  input: ProviderTestInput,
  call: Call,
  timeoutMs: number,
  send: typeof fetch,
): Promise<void> {
  let response: Response;

  try {
    response = await send(call.url, {
      method: "POST",
      headers: call.headers,
      body: JSON.stringify(call.body),
      signal: AbortSignal.timeout(timeoutMs),
      // Requirement "A provider address cannot reach private networks": a redirect is an address nobody checked, so
      // the answer of the provider stops here and the caller reads it as an address that does not answer.
      redirect: "manual",
    });
  } catch (error) {
    throw new ProviderTestError(timeoutReason(error));
  }

  if (response.status >= 300 && response.status < 400) {
    throw new ProviderTestError("unreachable");
  }

  const body = await response.text();

  if (response.ok === false) {
    throw new ProviderTestError(reasonOfStatus(response.status, body));
  }

  let answer: Record<string, unknown>;

  try {
    answer = JSON.parse(body) as Record<string, unknown>;
  } catch {
    throw new ProviderTestError("unreachable");
  }

  const usable =
    input.kind === "chat" ? textOf(input.provider, answer).length > 0 : vectorOf(input.provider, answer).length > 0;

  if (usable === false) {
    throw new ProviderTestError("unreachable");
  }
}

export async function testProvider(input: ProviderTestInput): Promise<ProviderTestOutcome> {
  if (providerEntry(input.provider, input.kind) === null) {
    return { ok: false, reason: "unreachable" };
  }

  // The rule of the address goes first: nothing is called, and no key is offered, before the address passed it.
  const allowed = await providerAddress({
    baseUrl: baseUrlFor(input),
    provider: input.provider,
    kind: input.kind,
    environment: process.env,
    ...(input.resolve === undefined ? {} : { resolve: input.resolve }),
  });

  if (allowed.ok === false) {
    return { ok: false, reason: ADDRESS_NOT_ALLOWED };
  }

  const model = modelFor(input);
  const started = Date.now();

  try {
    // Requirement "The address that was validated is the address that is connected to": the call opens the socket to
    // one of the addresses the guard classified, in the same resolution, and never to a second answer of the name.
    await callProvider(
      input,
      input.kind === "chat" ? chatCall(input, model) : embeddingsCall(input, model),
      input.timeoutMs ?? TEST_TIMEOUT_MS,
      pinnedFetch(allowed.addresses),
    );
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof ProviderTestError ? error.reason : timeoutReason(error),
    };
  }

  return { ok: true, model, latencyMs: Date.now() - started };
}

// The routes of the panel call this one: whatever `testProvider()` throws, and whatever the resolution of the address
// throws before it, becomes one of the six closed reasons of the requirement "Testing a provider is bounded". The text
// of the exception never reaches the caller (requirement "No provider error reaches the browser").
export async function withClosedReason(
  call: () => Promise<ProviderTestOutcome>,
): Promise<ProviderTestOutcome> {
  try {
    return await call();
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}
