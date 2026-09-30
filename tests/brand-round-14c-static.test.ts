import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Task 10.1 of `openspec/changes/brand-identity-ui/tasks.md`: the checks that read the sources, for the minors that decision
// 33 and decision 31 of `design.md` fix in this round. Written before the fix, red until it lands.

const root = resolve(import.meta.dirname, "..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

// The change lives in `openspec/changes/brand-identity-ui/` until it is archived, and in
// `openspec/changes/archive/<date>-brand-identity-ui/` after: the pointer is checked wherever the change is.
function changeFolder(name: string): string {
  const archive = resolve(root, "openspec/changes/archive");
  const archived = existsSync(archive) ? readdirSync(archive).find((entry) => entry.endsWith(`-${name}`)) : undefined;

  return archived ? `openspec/changes/archive/${archived}` : `openspec/changes/${name}`;
}

describe("the evidence pointers (decision 31)", () => {
  const index = `${changeFolder("brand-identity-ui")}/reports/2026-09-29-step-3-implementation.md`;

  it("has the index report that the marks of 3.1 to 3.4 cite", () => {
    expect(existsSync(resolve(root, index)), index).toBe(true);
  });

  it("links the three split reports of step 3 and names the commits of the work", () => {
    const text = existsSync(resolve(root, index)) ? read(index) : "";

    for (const name of ["foundation", "panel", "public"]) {
      expect(text, name).toContain(`2026-09-29-step-3-implementation-${name}.md`);
    }

    expect(text).toMatch(/\b[0-9a-f]{7}\b/);

    for (const task of ["3.1", "3.2", "3.3", "3.4"]) {
      expect(text, task).toContain(task);
    }
  });
});

describe("the small fixes of the round (decision 33)", () => {
  it("ignores the output of the reporter of vitest, so one git add cannot commit it", () => {
    expect(read(".gitignore").split(/\r?\n/).map((line) => line.trim())).toContain("/.vitest/");
  });

  it("preloads the Outfit face the first frame is painted in, from the origin of the app", () => {
    const layout = read("app/layout.tsx");

    expect(layout).toContain('rel="preload"');
    expect(layout).toContain('as="font"');
    expect(layout).toContain('type="font/woff2"');
    expect(layout).toContain("/fonts/outfit/outfit-latin.woff2");
    expect(layout).toMatch(/crossOrigin=/);
    expect(existsSync(resolve(root, "public/fonts/outfit/outfit-latin.woff2"))).toBe(true);
  });

  it("paints the dash of the refusal in paper, so lime stays a citation, a verified step and the current place", () => {
    const marker = read("components/chat/Marker.tsx");

    expect(marker).toMatch(/ink:\s*"bg-ink text-paper"/);
    expect(marker).not.toMatch(/ink:[^\n]*text-lime/);
  });

  it("does not silence the hydration warning of the date cell, so the check of the dates can fail", () => {
    expect(read("components/admin/ConversationsPanel.tsx")).not.toContain("suppressHydrationWarning");
  });

  it("hides the development indicator of Next in the captures of record", () => {
    expect(read("scripts/capture-ui.mjs")).toContain("nextjs-portal");
  });

  it("does not let the guard of the dependencies skip itself when git cannot read main", () => {
    expect(read("tests/brand-static.test.ts")).not.toMatch(/it\.skipIf\(\s*main\s*===\s*null/);
  });
});
