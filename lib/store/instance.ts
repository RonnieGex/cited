import type { ChatEnvironment } from "../models/types.ts";
import { openStore, type Store } from "./index.ts";
import { prepareStorePath, storeLocation } from "./path.ts";

const opened = new Map<string, Promise<Store>>();

export function sharedStore(environment: ChatEnvironment = process.env): Promise<Store> {
  const location = storeLocation(environment);
  const existing = opened.get(location);

  if (existing !== undefined) {
    return existing;
  }

  const store = openStore(prepareStorePath(location));

  opened.set(location, store);
  store.catch(() => opened.delete(location));

  return store;
}

export async function closeSharedStores(): Promise<void> {
  const stores = [...opened.values()];

  opened.clear();

  for (const store of stores) {
    try {
      (await store).close();
    } catch {
      // A store that never opened holds nothing to close.
    }
  }
}
