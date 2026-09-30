import { encryptionAvailable } from "../secrets/index.ts";
import { hourWindowStart, retryAfterSeconds } from "../guards/window.ts";
import type { ChatEnvironment } from "../models/types.ts";
import {
  embeddingsSignature,
  resolveChat,
  resolveEmbeddings,
  type ChatResolution,
  type EmbeddingsResolution,
} from "../settings/providers.ts";
import { sharedStore } from "../store/instance.ts";
import type { Store } from "../store/index.ts";
import type { StoredProviderSetting } from "../store/types.ts";

// The state the page "AI and keys" and the routes of `/api/admin/providers` share. Nothing here carries a key: the
// panel shows the provider, the model, the last four characters and the last test, which is all the owner may see
// again (PRODUCT.md, "Secrets stay secret").

export const PROVIDER_TESTS_PER_HOUR = 20;

export type ProviderView = {
  source: "server" | "panel" | "none";
  provider: string | null;
  model: string;
  last4: string | null;
  testedAt: string | null;
  latencyMs: number | null;
  mode: string | null;
};

// Decision 23 of the third amendment: a row of the panel that names a provider the catalogue does not know resolves
// with no provider at all and a problem, and it is the only state of the panel that has no provider — every row the
// catalogue knows resolves with its name (the Major M-8 of `katalis-dev/tasks/revision-community-13c.md`). The page of
// the setup reads this to choose the words of the notice that reopens step 1.
export function panelUnknownProvider(view: ProviderView): boolean {
  return view.source === "panel" && view.provider === null;
}

export type ProviderPanelState = {
  chat: ProviderView;
  embeddings: ProviderView;
  encryption: boolean;
  reindex: { documents: number; passages: number };
};

function view(
  source: "server" | "panel" | "none",
  provider: string | null,
  model: string,
  row: StoredProviderSetting | null,
): ProviderView {
  return {
    source,
    provider,
    model,
    last4: source === "panel" ? (row?.keyLast4 ?? null) : null,
    testedAt: source === "panel" ? (row?.testedAt ?? null) : null,
    latencyMs: source === "panel" ? (row?.testLatencyMs ?? null) : null,
    mode: source === "panel" ? (row?.mode ?? null) : null,
  };
}

export async function providerPanelState(
  environment: ChatEnvironment = process.env,
  reuse?: Store,
): Promise<ProviderPanelState> {
  const store = reuse ?? (await sharedStore(environment));

  return providerPanelStateOf(store, environment);
}

export async function providerPanelStateOf(
  store: Store,
  environment: ChatEnvironment = process.env,
): Promise<ProviderPanelState> {
  const chat: ChatResolution = await resolveChat({ environment, store });
  const embeddings: EmbeddingsResolution = await resolveEmbeddings({ environment, store });
  const chatRow = await store.readProviderSetting("chat");
  const embeddingsRow = await store.readProviderSetting("embeddings");
  const signature = embeddingsSignature(embeddings);
  const passages = embeddings.mode === "vectors" ? await store.countPassagesNeedingIndex(signature) : 0;
  const documents = passages === 0 ? 0 : (await store.listDocumentsNeedingIndex(signature)).length;

  return {
    chat: view(chat.source, chat.provider, chat.model, chatRow),
    embeddings: view(
      embeddings.source,
      // Keyword mode has no provider and is still a connected state of its own: the panel names it by its mode.
      embeddings.provider ?? (embeddings.mode === "keyword" ? "keyword" : null),
      embeddings.model,
      embeddingsRow,
    ),
    encryption: encryptionAvailable(environment),
    reindex: { documents, passages },
  };
}

export type TestSlot = { allowed: true } | { allowed: false; retryAfterSeconds: number };

// Decision 4: the test, the save and the remove routes share a limit of twenty tests per hour. The requirement "The
// test limit holds under concurrency" makes the reservation itself the atomic operation: the store writes the attempt
// and answers how many the window holds, and this reads that count. Reading it first and incrementing it after left a
// window in which forty simultaneous tests all saw the same value (Major M-2 of `revision-community-12.md`).
export async function reserveProviderTest(store: Store, now: Date = new Date()): Promise<TestSlot> {
  const windowStart = hourWindowStart(now);
  const used = await store.reserveProviderTest(windowStart);

  return used > PROVIDER_TESTS_PER_HOUR
    ? { allowed: false, retryAfterSeconds: retryAfterSeconds(now) }
    : { allowed: true };
}
