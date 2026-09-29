import { describe, expect, it, vi } from "vitest";
import { SESSION_KEY, sessionId } from "@/lib/chat/session";

// Decision 6 of `openspec/changes/public-page-and-widget/design.md`: `crypto.randomUUID()` in session storage under
// `cited-session`, so a follow-up keeps its thread in the tab and a new tab starts clean.

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

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("the session of a tab", () => {
  it("keeps its id under cited-session", () => {
    expect(SESSION_KEY).toBe("cited-session");
  });

  it("creates one id per tab, keeps it and writes it once", () => {
    const storage = new MemoryStorage();
    const first = sessionId(storage);

    expect(first).toMatch(uuidV4);
    expect(storage.getItem(SESSION_KEY)).toBe(first);

    const second = sessionId(storage);

    expect(second).toBe(first);
    expect(storage.written).toEqual([SESSION_KEY]);
  });

  it("starts a new tab with a different id", () => {
    const one = sessionId(new MemoryStorage());
    const other = sessionId(new MemoryStorage());

    expect(other).not.toBe(one);
  });

  it("keeps the id the tab already carries", () => {
    const storage = new MemoryStorage();

    storage.setItem(SESSION_KEY, "the-thread-of-this-tab");

    expect(sessionId(storage)).toBe("the-thread-of-this-tab");
    expect(storage.written).toEqual([]);
  });

  it("replaces an empty or blank stored value", () => {
    const empty = new MemoryStorage();
    const blank = new MemoryStorage();

    empty.setItem(SESSION_KEY, "");
    blank.setItem(SESSION_KEY, "   ");

    expect(sessionId(empty)).toMatch(uuidV4);
    expect(sessionId(blank)).toMatch(uuidV4);
  });

  it("takes the id from the factory it is given", () => {
    const create = vi.fn(() => "made-up");

    expect(sessionId(new MemoryStorage(), create)).toBe("made-up");
    expect(create).toHaveBeenCalledTimes(1);
  });
});
