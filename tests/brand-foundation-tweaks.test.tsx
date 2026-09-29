import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CitationMark } from "@/components/brand";
import { Input } from "@/components/ui";

// The tweaks the two surface agents asked of the foundation (design decisions 3, 4 and 6 and the kit): the highlighter
// on ink, the tone of the citation mark and the styled file input. The rest of the foundation is read by
// `tests/brand-foundation.test.tsx` and `tests/brand-static.test.ts`.

const repositoryRoot = resolve(import.meta.dirname, "..");

function ruleBody(css: string, selector: string): string | undefined {
  const escaped = selector.split(".").join(String.raw`\.`);
  const match = new RegExp(String.raw`(^|\})\s*${escaped}\s*\{([^}]*)\}`, "m").exec(css);

  return match?.[2];
}

describe(".hl-on-ink, the highlighter for a ground of ink", () => {
  const css = readFileSync(resolve(repositoryRoot, "app/brand.css"), "utf8");

  it("is a solid lime block with ink text, declared after .hl so that it wins", () => {
    const body = ruleBody(css, ".hl-on-ink");

    expect(body, "a rule for .hl-on-ink").toBeDefined();
    expect(body).toMatch(/background-image\s*:\s*linear-gradient\(\s*var\(--lime\)\s*,\s*var\(--lime\)\s*\)/);
    expect(body).toMatch(/color\s*:\s*var\(--ink\)/);
    expect(css.indexOf(".hl-on-ink {")).toBeGreaterThan(css.indexOf(".hl {"));
  });

  it("animates nothing of its own: the sweep stays the job of .hl-sweep", () => {
    expect(ruleBody(css, ".hl-on-ink")).not.toMatch(/animation|transition/);
  });
});

describe("CitationMark tone", () => {
  const mark = (node: ReturnType<typeof render>) =>
    node.container.querySelector('[data-brand="citation-mark"]')?.className ?? "";

  it("keeps the look on paper when no tone is given", () => {
    const className = mark(render(<CitationMark n={2} />));

    expect(className).toContain("bg-lime");
    expect(className).toContain("text-ink");
    expect(className).not.toContain("ring-");
  });

  it("draws the rest mark on ink as a quiet outline with paper text, without a competing lime fill", () => {
    const className = mark(render(<CitationMark n={2} tone="ink" />));

    expect(className).toContain("text-paper/60");
    expect(className).toContain("ring-paper/30");
    expect(className).toContain("bg-transparent");
    expect(className).not.toContain("bg-lime");
    expect(className).not.toContain("text-ink");
  });

  it("draws the open mark on ink as ink with a lime number inside a lime outline", () => {
    const className = mark(render(<CitationMark n={2} tone="ink" state="open" />));

    expect(className).toContain("bg-ink");
    expect(className).toContain("text-lime");
    expect(className).toContain("ring-lime");
    expect(className).not.toContain("bg-lime");
  });

  it("keeps the measures of the mark in every tone", () => {
    for (const tone of ["paper", "ink"] as const) {
      const className = mark(render(<CitationMark tone={tone} />));

      for (const token of ["inline-grid", "h-[1.3em]", "min-w-[1.5em]", "rounded-none"]) {
        expect(className, `${tone}: ${token}`).toContain(token);
      }
    }
  });
});

describe("Input of type file", () => {
  it("styles the native button of the picker and keeps 44 px of height, and stays an input of type file", () => {
    const { container } = render(<Input type="file" name="upload" accept=".pdf" />);
    const input = container.querySelector("input");

    expect(input?.type).toBe("file");
    expect(input?.name).toBe("upload");
    expect(input?.accept).toBe(".pdf");

    const className = input?.className ?? "";

    expect(className).toContain("file:bg-ink");
    expect(className).toContain("file:text-paper");
    expect(className).toContain("file:rounded-none");
    expect(className).toContain("file:border-0");
    expect(className).toContain("min-h-11");
    expect(className).toContain("focus-visible:outline-lime");
  });

  it("leaves the text inputs exactly as they were", () => {
    const { container } = render(<Input name="q" />);
    const className = container.querySelector("input")?.className ?? "";

    expect(className).toContain("px-5 py-4");
    expect(className).not.toContain("file:");
    expect(className).not.toContain("min-h-11");
  });
});
