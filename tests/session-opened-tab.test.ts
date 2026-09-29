import { describe, expect, it } from "vitest";
import { SESSION_KEY, sessionId, tabOwner } from "@/lib/chat/session";

// The scenario "A tab opened from the page" of the requirement "The brand color is seen and the widget closes from
// inside" of `openspec/changes/public-page-and-widget/specs/public-chat/spec.md`.
//
// `revision-community-08` reproduced that Chromium copies the `sessionStorage` of the opener into a tab opened with
// `window.open`, so the stored id alone cannot say which tab owns the conversation. The tab keeps an owner mark in
// `window.name` next to the id in session storage: a new tab inherits neither the mark nor, therefore, the thread.

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

class MemoryStorage {
  readonly values = new Map<string, string>();
  readonly written: string[] = [];

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.written.push(key);
    this.values.set(key, value);
  }
}

describe("the mark of the tab", () => {
  it("reads and writes its own mark inside window.name, next to what the page already carries", () => {
    const win = { name: "what-the-page-put-there" };
    const owner = tabOwner(win);

    expect(owner.read()).toBeNull();

    owner.write("abc");

    expect(owner.read()).toBe("abc");
    expect(win.name).toContain("what-the-page-put-there");

    owner.write("def");

    expect(owner.read()).toBe("def");
    expect(win.name).not.toContain("abc");
    expect(win.name).toContain("what-the-page-put-there");
  });

  it("does not confuse another word of window.name with its own mark", () => {
    expect(tabOwner({ name: "cited=1 another-tab=xyz" }).read()).toBeNull();
    expect(tabOwner({ name: "" }).read()).toBeNull();
    expect(tabOwner({ name: "cited-tab=" }).read()).toBeNull();
  });
});

describe("the session of a tab opened from another", () => {
  it("starts its own conversation although the session storage came copied", () => {
    const copied = new MemoryStorage();

    copied.values.set(SESSION_KEY, "the-thread-of-the-opener");

    // A tab opened with `window.open` inherits the session storage of its opener and an empty `window.name`.
    const opened = tabOwner({ name: "" });
    const created = sessionId(copied, opened);

    expect(created).not.toBe("the-thread-of-the-opener");
    expect(created).toMatch(uuidV4);
    expect(copied.getItem(SESSION_KEY)).toBe(created);
    expect(opened.read()).toBe(created);
  });

  it("keeps its own id in every question of the tab", () => {
    const storage = new MemoryStorage();
    const owner = tabOwner({ name: "" });
    const first = sessionId(storage, owner);

    expect(sessionId(storage, owner)).toBe(first);
    expect(sessionId(storage, owner)).toBe(first);
    expect(storage.written).toEqual([SESSION_KEY]);
  });

  it("keeps the id the tab already carries when the mark says the tab owns it", () => {
    const storage = new MemoryStorage();

    storage.values.set(SESSION_KEY, "the-thread-of-this-tab");

    expect(sessionId(storage, tabOwner({ name: "cited-tab=the-thread-of-this-tab" }))).toBe(
      "the-thread-of-this-tab",
    );
  });

  it("replaces an id whose mark points at another conversation", () => {
    const storage = new MemoryStorage();

    storage.values.set(SESSION_KEY, "a-thread-of-another-tab");

    const created = sessionId(storage, tabOwner({ name: "cited-tab=the-thread-of-this-tab" }));

    expect(created).not.toBe("a-thread-of-another-tab");
    expect(created).toMatch(uuidV4);
    expect(storage.getItem(SESSION_KEY)).toBe(created);
  });
});
