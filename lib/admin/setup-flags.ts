import type { Store } from "../store/index.ts";

// Decision 2 of `openspec/changes/guided-setup-and-knowledge/design.md`: the state of a step is derived from the real
// configuration and the only things this change stores are the decisions the owner takes by pressing a button. The
// flags live in the table `setup_flags` of the store, so the state of a store shows them (`scripts/store-state.ts`) and
// two flags never contradict each other in two different places.

export const SETUP_FLAGS = ["started", "try_verified", "try_attention", "published", "skipped"] as const;

export type SetupFlag = (typeof SETUP_FLAGS)[number];

export type SetupFlags = Record<SetupFlag, boolean>;

export function isSetupFlag(value: unknown): value is SetupFlag {
  return typeof value === "string" && (SETUP_FLAGS as readonly string[]).includes(value);
}

export function emptyFlags(): SetupFlags {
  return {
    started: false,
    try_verified: false,
    try_attention: false,
    published: false,
    skipped: false,
  };
}

export async function readSetupFlags(store: Store): Promise<SetupFlags> {
  const stored = await store.listSetupFlags();
  const flags = emptyFlags();

  for (const flag of SETUP_FLAGS) {
    flags[flag] = stored[flag] === true;
  }

  return flags;
}

export async function writeSetupFlag(
  store: Store,
  flag: SetupFlag,
  value: boolean,
): Promise<SetupFlags> {
  await store.saveSetupFlag(flag, value);

  return readSetupFlags(store);
}
