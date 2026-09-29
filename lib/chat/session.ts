// Design decision 6 of `openspec/changes/public-page-and-widget/design.md`: one `sessionId` per browser tab, in session
// storage under `cited-session`, so a follow-up keeps its thread and a new tab starts clean.
//
// The scenario "A tab opened from the page" of the requirement "The brand color is seen and the widget closes from
// inside" needs more than the storage: Chromium copies the `sessionStorage` of the opener into the tab it opens with
// `window.open`, so the stored id alone cannot say which tab owns the thread. The tab keeps an owner mark in
// `window.name`, which a new tab does not inherit, and the id of the storage is believed only when the two agree.

export const SESSION_KEY = "cited-session";
export const OWNER_KEY = "cited-tab";

export type TabStorage = Pick<Storage, "getItem" | "setItem">;

export type TabOwner = {
  read(): string | null;
  write(mark: string): void;
};

function newId(): string {
  return crypto.randomUUID();
}

function markIn(name: string): string | null {
  const found = name.split(/\s+/).find((part) => part.startsWith(`${OWNER_KEY}=`));

  if (found === undefined) {
    return null;
  }

  const mark = found.slice(OWNER_KEY.length + 1);

  return mark.length > 0 ? mark : null;
}

/**
 * The owner of the tab: its mark `cited-tab=<id>` inside `window.name`, next to whatever the page already carries
 * there. `window.name` belongs to one browsing context, so a tab opened with `window.open` starts without it.
 */
export function tabOwner(win: Pick<Window, "name">): TabOwner {
  return {
    read: () => markIn(win.name),
    write: (mark) => {
      const kept = win.name
        .split(/\s+/)
        .filter((part) => part.length > 0 && part.startsWith(`${OWNER_KEY}=`) === false);

      win.name = [...kept, `${OWNER_KEY}=${mark}`].join(" ");
    },
  };
}

export function sessionId(
  storage: TabStorage,
  owner: TabOwner,
  create: () => string = newId,
): string {
  const stored = storage.getItem(SESSION_KEY)?.trim() ?? "";

  if (stored.length > 0 && stored === owner.read()) {
    return stored;
  }

  const created = create();

  storage.setItem(SESSION_KEY, created);
  owner.write(created);

  return created;
}
