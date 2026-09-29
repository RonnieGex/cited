// Design decision 6 of `openspec/changes/public-page-and-widget/design.md`: one `sessionId` per browser tab, in session
// storage under `cited-session`, so a follow-up keeps its thread and a new tab starts clean.

export const SESSION_KEY = "cited-session";

export type TabStorage = Pick<Storage, "getItem" | "setItem">;

function newId(): string {
  return crypto.randomUUID();
}

export function sessionId(storage: TabStorage, create: () => string = newId): string {
  const stored = storage.getItem(SESSION_KEY)?.trim() ?? "";

  if (stored.length > 0) {
    return stored;
  }

  const created = create();

  storage.setItem(SESSION_KEY, created);

  return created;
}
