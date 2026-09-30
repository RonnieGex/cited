import type { EmbeddingProviderName } from "../embeddings/types.ts";
import { DEFAULT_EMBEDDING_DIMENSIONS, EMBEDDING_PROVIDER_NAMES } from "../embeddings/types.ts";
import { chatModelName, CHAT_PROVIDER_NAMES, type ChatEnvironment, type ChatProviderName } from "../models/types.ts";
import { serverChatCredentials } from "../models/providers.ts";
import { openSecret } from "../secrets/index.ts";
import { providerEntry } from "../providers/catalog.ts";
import { providerFetch } from "../providers/pinned.ts";
import type { AddressResolver } from "../providers/address.ts";
import { sharedStore } from "../store/instance.ts";
import type { Store } from "../store/index.ts";

// Decision 3 of `openspec/changes/provider-keys-in-panel/design.md`: one resolver for the answers and for the
// ingestion. A value set in the environment of the server wins (today's variables keep working unchanged), the value
// saved in the panel comes next and "none" is a state of its own. The key is opened here, in the server process, and
// the caller never sends it anywhere but to the provider.

export type ProviderSource = "server" | "panel" | "none";
export type KeyState = "set" | "missing" | "unreadable";
export type EmbeddingsMode = "vectors" | "keyword" | "none";
export type EmbeddingsProviderId = EmbeddingProviderName | "gemini";

export const DEFAULT_EMBEDDING_MODELS: Record<string, string> = {
  openai: "text-embedding-3-small",
  gemini: "gemini-embedding-001",
  ollama: "nomic-embed-text",
  fake: "fake",
};

export const DEFAULT_EMBEDDING_DIMENSIONS_BY_ID: Record<string, number> = {
  openai: DEFAULT_EMBEDDING_DIMENSIONS.openai,
  gemini: 768,
  ollama: DEFAULT_EMBEDDING_DIMENSIONS.ollama,
  fake: DEFAULT_EMBEDDING_DIMENSIONS.fake,
};

export type ChatResolution = {
  source: ProviderSource;
  provider: ChatProviderName | null;
  /**
   * The name a row of the panel or the environment gave and the catalogue does not know: it is a problem of the
   * configuration and never a provider, so no model is built from it (decision 23 of the third amendment, the Major
   * M-8 of `katalis-dev/tasks/revision-community-13c.md`).
   */
  unknownProvider: string | null;
  model: string;
  key: string;
  baseUrl: string;
  keyState: KeyState;
  missing: string[];
  /** The transport of an address the owner wrote: it validates and pins every connection (task 11.2). */
  fetch?: typeof fetch;
};

export type EmbeddingsResolution = {
  source: ProviderSource;
  mode: EmbeddingsMode;
  provider: EmbeddingsProviderId | null;
  model: string;
  key: string;
  baseUrl: string;
  dimensions: number;
  keyState: KeyState;
  missing: string[];
  /** The transport of an address the owner wrote: it validates and pins every connection (task 11.2). */
  fetch?: typeof fetch;
};

export type ResolveOptions = {
  environment?: ChatEnvironment;
  store?: Store;
  /** The resolver of the address guard, for the suite: a test classifies a controlled answer. */
  resolve?: AddressResolver;
};

function none(): ChatResolution {
  return {
    source: "none",
    provider: null,
    unknownProvider: null,
    model: "",
    key: "",
    baseUrl: "",
    keyState: "missing",
    missing: [],
  };
}

// A name the catalogue does not know, from a row of the panel or from the environment of the server: the resolution
// carries no provider and `chatProblem()` says what happened. The answers path refuses what this returns, so the test
// double never writes an answer for a configuration the panel shows as ready (decision 23 of the third amendment).
function unknownProvider(source: ProviderSource, name: string): ChatResolution {
  return {
    source,
    provider: null,
    unknownProvider: name,
    model: "",
    key: "",
    baseUrl: "",
    keyState: "missing",
    missing: [],
  };
}

function storeOf(options: ResolveOptions, environment: ChatEnvironment): Promise<Store> {
  return options.store === undefined ? sharedStore(environment) : Promise.resolve(options.store);
}

function localProvider(provider: string): boolean {
  return provider === "ollama" || provider === "lmstudio";
}

// The transport of an address the owner wrote in the panel. A row without an address keeps the global `fetch`: the
// address of the catalogue comes from the server — whoever installs wrote it or the catalogue publishes it — and it is
// not a value the browser sent. An address of the panel is validated again on every request, because the name the
// guard accepted when it was saved can answer something else today (the Major M-2 of
// `katalis-dev/tasks/revision-community-12b.md`), and the connection is opened to the address that validation
// classified and to no other one.
function transportOf(
  declared: string | null | undefined,
  provider: string,
  kind: "chat" | "embeddings",
  environment: ChatEnvironment,
  resolve: AddressResolver | undefined,
): typeof fetch | undefined {
  const address = declared?.trim() ?? "";

  return address.length === 0
    ? undefined
    : providerFetch({
        baseUrl: address,
        provider,
        kind,
        environment,
        ...(resolve === undefined ? {} : { resolve }),
      });
}

export async function resolveChat(options: ResolveOptions = {}): Promise<ChatResolution> {
  const environment = options.environment ?? process.env;
  const declared = environment["CHAT_PROVIDER"]?.trim() ?? "";

  if (declared.length > 0) {
    const selected = declared.toLowerCase();

    // Decision 23 of the third amendment: the same check guards the provider the server environment names. An unknown
    // value is a problem the panel shows and the answers path refuses, not an exception that leaves the page without an
    // answer; `selectedChatProvider()` keeps throwing for whoever builds a model straight from the environment.
    if (CHAT_PROVIDER_NAMES.includes(selected as ChatProviderName) === false) {
      return unknownProvider("server", selected);
    }

    const server = serverChatCredentials(environment);
    const declaredModel = (environment["CHAT_MODEL"]?.trim() ?? "").length > 0;

    return {
      source: "server",
      provider: server.provider,
      unknownProvider: null,
      model: declaredModel ? chatModelName(environment) : server.model,
      key: server.key,
      baseUrl: server.baseUrl,
      keyState: server.missing.length === 0 ? "set" : "missing",
      missing: server.missing,
    };
  }

  const store = await storeOf(options, environment);
  const row = await store.readProviderSetting("chat");

  if (row === null || row.provider.trim().length === 0) {
    return none();
  }

  const name = row.provider.trim();
  const entry = providerEntry(name, "chat", environment);

  // Decision 23 of the third amendment: a row of the panel is trusted only when the catalogue knows its provider. A row
  // that names something else — an import, a hand-edited store, a name the catalogue dropped — resolves with a problem,
  // so step 1 asks for attention and no model is built from it. The catalogue is what the panel offers, so `fake` is
  // not a row the panel can hold: the deterministic double belongs to the environment of whoever installs (the Major
  // M-8 of `katalis-dev/tasks/revision-community-13c.md`).
  if (entry === null) {
    return unknownProvider("panel", name);
  }

  const provider = name as ChatProviderName;
  const local = localProvider(provider);
  const fetch = transportOf(row.baseUrl, provider, "chat", environment, options.resolve);
  const transport = fetch === undefined ? {} : { fetch };

  if (row.keyCiphertext === null || row.keyCiphertext.length === 0) {
    return {
      source: "panel",
      provider,
      unknownProvider: null,
      model: row.model?.trim() || entry?.chatModel || "",
      key: "",
      baseUrl: row.baseUrl?.trim() || entry?.baseUrl || "",
      keyState: local ? "set" : "missing",
      missing: [],
      ...transport,
    };
  }

  const opened = openSecret(row.keyCiphertext, environment);

  return {
    source: "panel",
    provider,
    unknownProvider: null,
    model: row.model?.trim() || entry?.chatModel || "",
    key: opened.ok ? opened.value : "",
    baseUrl: row.baseUrl?.trim() || entry?.baseUrl || "",
    keyState: opened.ok ? "set" : "unreadable",
    missing: [],
    ...transport,
  };
}

function embeddingsNone(): EmbeddingsResolution {
  return {
    source: "none",
    mode: "none",
    provider: null,
    model: "",
    key: "",
    baseUrl: "",
    dimensions: 0,
    keyState: "missing",
    missing: [],
  };
}

export async function resolveEmbeddings(
  options: ResolveOptions = {},
): Promise<EmbeddingsResolution> {
  const environment = options.environment ?? process.env;
  const declared = environment["EMBEDDINGS_PROVIDER"]?.trim().toLowerCase() ?? "";

  if (declared.length > 0) {
    if (EMBEDDING_PROVIDER_NAMES.includes(declared as EmbeddingProviderName) === false) {
      throw new Error(
        `EMBEDDINGS_PROVIDER must be one of ${EMBEDDING_PROVIDER_NAMES.join(", ")}; received an empty or unknown value.`,
      );
    }

    const provider = declared as EmbeddingProviderName;
    const needsKey = provider === "openai";
    const names = needsKey
      ? ["EMBEDDINGS_BASE_URL", "EMBEDDINGS_MODEL", "EMBEDDINGS_API_KEY"]
      : provider === "ollama"
        ? ["EMBEDDINGS_MODEL"]
        : [];
    const missing = names.filter((name) => (environment[name]?.trim() ?? "").length === 0);

    return {
      source: "server",
      mode: "vectors",
      provider,
      model: environment["EMBEDDINGS_MODEL"]?.trim() ?? "",
      key: environment["EMBEDDINGS_API_KEY"]?.trim() ?? "",
      baseUrl: (environment["EMBEDDINGS_BASE_URL"]?.trim() ?? "").replace(/\/+$/, ""),
      dimensions:
        Number(environment["EMBEDDINGS_DIMENSIONS"] ?? "") > 0
          ? Number(environment["EMBEDDINGS_DIMENSIONS"])
          : DEFAULT_EMBEDDING_DIMENSIONS_BY_ID[provider] ?? 0,
      keyState: missing.length === 0 ? "set" : "missing",
      missing,
    };
  }

  const store = await storeOf(options, environment);
  const row = await store.readProviderSetting("embeddings");

  if (row === null) {
    return embeddingsNone();
  }

  if (row.mode?.trim().toLowerCase() === "keyword") {
    return {
      source: "panel",
      mode: "keyword",
      provider: null,
      model: "",
      key: "",
      baseUrl: "",
      dimensions: 0,
      keyState: "set",
      missing: [],
    };
  }

  const provider = row.provider.trim();
  const entry = providerEntry(provider, "embeddings", environment);
  const local = provider === "ollama";
  const fetch = transportOf(row.baseUrl, provider, "embeddings", environment, options.resolve);
  const transport = fetch === undefined ? {} : { fetch };

  if (row.keyCiphertext === null || row.keyCiphertext.length === 0) {
    return {
      source: "panel",
      mode: "vectors",
      provider: (provider as EmbeddingsProviderId) ?? null,
      model: row.model?.trim() || entry?.embeddingsModel || "",
      key: "",
      baseUrl: row.baseUrl?.trim() || entry?.embeddingsBaseUrl || "",
      dimensions: DEFAULT_EMBEDDING_DIMENSIONS_BY_ID[provider] ?? 0,
      keyState: local ? "set" : "missing",
      missing: [],
      ...transport,
    };
  }

  const opened = openSecret(row.keyCiphertext, environment);

  return {
    source: "panel",
    mode: "vectors",
    provider: provider as EmbeddingsProviderId,
    model: row.model?.trim() || entry?.embeddingsModel || "",
    key: opened.ok ? opened.value : "",
    baseUrl: row.baseUrl?.trim() || entry?.embeddingsBaseUrl || "",
    dimensions: DEFAULT_EMBEDDING_DIMENSIONS_BY_ID[provider] ?? 0,
    keyState: opened.ok ? "set" : "unreadable",
    missing: [],
    ...transport,
  };
}

export function chatConfigured(resolution: ChatResolution): boolean {
  return resolution.provider !== null && chatProblem(resolution) === null;
}

// Whether the search of this installation can look for meaning right now: keyword mode always can, and vectors need a
// provider with everything it asks for. The public route of the answers asks this and answers its own sentence when it
// is false, because the message of `embeddingsProblem()` names the variables of the server and it is meant for whoever
// installs (the command line), never for the browser of a visitor.
export function embeddingsConfigured(resolution: EmbeddingsResolution): boolean {
  return resolution.mode === "keyword" || (resolution.mode === "vectors" && embeddingsProblem(resolution) === null);
}

// The message the panel and `/api/ask` give: it names what is missing and never a value of a variable.
export function chatProblem(resolution: ChatResolution): string | null {
  // Decision 23 of the third amendment: the catalogue does not know the name a row or the environment gave, so there is
  // no provider to use. The panel says it in the words of the owner and step 1 asks for attention; the answers path
  // refuses the resolution before it builds a model (the Major M-8 of `katalis-dev/tasks/revision-community-13c.md`).
  if (resolution.unknownProvider !== null) {
    return resolution.source === "server"
      ? `CHAT_PROVIDER names ${resolution.unknownProvider}, which is not one Cited knows: fill it with one of ${CHAT_PROVIDER_NAMES.join(", ")}`
      : `the chat provider saved in the panel (${resolution.unknownProvider}) is not one Cited knows: connect the provider again`;
  }

  if (resolution.provider === null) {
    return "the AI is not connected yet: connect your AI in the panel, or fill CHAT_PROVIDER in the environment of the server";
  }

  if (resolution.missing.length > 0) {
    return `the ${resolution.provider} chat provider needs ${resolution.missing.join(" and ")} in the environment of the server`;
  }

  if (resolution.keyState === "unreadable") {
    return "the key saved in the panel cannot be read with the encryption key of this server: connect the provider again";
  }

  if (resolution.keyState === "missing" && localProvider(resolution.provider) === false) {
    return "the chat provider saved in the panel has no key: connect it again";
  }

  return null;
}

export function embeddingsProblem(resolution: EmbeddingsResolution): string | null {
  if (resolution.mode === "none") {
    return "EMBEDDINGS_PROVIDER is empty and the panel holds no embeddings provider: choose meaning search or search by words in the panel";
  }

  if (resolution.missing.length > 0) {
    return `the ${resolution.provider} embeddings provider needs ${resolution.missing.join(" and ")} in the environment of the server`;
  }

  if (resolution.keyState === "unreadable") {
    return "the key saved in the panel cannot be read with the encryption key of this server: connect the provider again";
  }

  if (resolution.keyState === "missing" && resolution.provider !== "ollama" && resolution.provider !== "fake") {
    return "the embeddings provider saved in the panel has no key: connect it again";
  }

  return null;
}

// The same state, in the words of the owner. `embeddingsProblem()` writes the diagnostic of whoever installs and it
// names the variables of the server, which is what the command line reads; this is what a page of the panel may say
// (the Major M-3 of `revision-community-12.md` and the amendment of `proposal.md`: the API error bodies and the
// command line may name a variable, the interface of the owner never). `null` means the search works.
export function panelEmbeddingsProblem(resolution: EmbeddingsResolution): string | null {
  if (embeddingsConfigured(resolution)) {
    return null;
  }

  if (resolution.mode === "none") {
    return "The meaning search is not chosen yet: choose a provider or search by words in the panel.";
  }

  return resolution.keyState === "unreadable"
    ? "The key of the search provider cannot be read: connect it again."
    : "The search provider is not ready: connect it again in the panel.";
}

// What the store has to have been indexed with for every passage to carry a vector of the provider in force. The key
// is never part of it: the signature is written in the store and read by the panel.
export function embeddingsSignature(resolution: EmbeddingsResolution): string {
  if (resolution.mode === "keyword") {
    return "keyword";
  }

  if (resolution.mode === "none") {
    return "none";
  }

  return [
    "vectors",
    resolution.provider ?? "",
    resolution.model,
    resolution.baseUrl,
    String(resolution.dimensions),
  ].join(":");
}
