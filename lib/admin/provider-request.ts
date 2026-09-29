import { providerEntry } from "../providers/catalog.ts";
import { PROVIDER_KINDS, type ProviderKind } from "../store/types.ts";

// The body of the routes of `/api/admin/providers`: the kind, the provider of the catalogue, the key the owner pasted
// and, when the caller has one, the model and the base URL of the provider. Decision 4 of
// `openspec/changes/provider-keys-in-panel/design.md`.

export type ProviderTestBody = {
  kind: ProviderKind;
  provider: string;
  key: string;
  model?: string;
  baseUrl?: string;
};

export type ProviderSaveBody =
  | { mode: "keyword" }
  | ({ mode: null } & ProviderTestBody);

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function parseTestBody(
  body: Record<string, unknown> | null,
  environment: Record<string, string | undefined> = process.env,
): ProviderTestBody | null {
  const kind = body?.["kind"];
  const provider = body?.["provider"];
  const key = body?.["key"];
  const model = body?.["model"];
  const baseUrl = body?.["baseUrl"];

  if (typeof kind !== "string" || PROVIDER_KINDS.includes(kind as ProviderKind) === false) {
    return null;
  }

  if (typeof provider !== "string" || provider.trim().length === 0) {
    return null;
  }

  if (key !== undefined && typeof key !== "string") {
    return null;
  }

  if (model !== undefined && typeof model !== "string") {
    return null;
  }

  if (baseUrl !== undefined && typeof baseUrl !== "string") {
    return null;
  }

  if (providerEntry(provider.trim(), kind as ProviderKind, environment) === null) {
    return null;
  }

  return {
    kind: kind as ProviderKind,
    provider: provider.trim(),
    key: (key ?? "").trim(),
    ...(text(model) === null ? {} : { model: text(model) as string }),
    ...(text(baseUrl) === null ? {} : { baseUrl: text(baseUrl) as string }),
  };
}

export function parseSaveBody(
  body: Record<string, unknown> | null,
  environment: Record<string, string | undefined> = process.env,
): ProviderSaveBody | null {
  if (body?.["kind"] === "embeddings" && body["mode"] === "keyword") {
    return { mode: "keyword" };
  }

  if (body?.["mode"] !== undefined && body["mode"] !== null && body["mode"] !== "keyword") {
    return null;
  }

  const parsed = parseTestBody(body, environment);

  return parsed === null ? null : { mode: null, ...parsed };
}

export const PROVIDER_BODY_ERROR =
  'the body must be {"kind": "chat" | "embeddings", "provider": string, "key"?: string, "model"?: string, "baseUrl"?: string}';
