import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CitationMark, Highlight, HighlightedTail, Wordmark, citationMarkClass } from "@/components/brand";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { Button, SectionTitle } from "@/components/ui";
import { highlightLast } from "@/lib/brand/highlight";
import Kit from "@/app/kit/page";

// The foundation of the change `brand-identity-ui` (tasks 3.1 and 3.2, decisions 1 to 6, 13 and 17 of `design.md`): the
// wordmark, the citation mark, the highlighter helper, the tones of the kit and the kit page. The stylesheets themselves
// are read by `tests/brand-static.test.ts`; what a browser must measure lives in `e2e/brand.spec.ts`.

const repositoryRoot = resolve(import.meta.dirname, "..");

function readText(path: string): string {
  return readFileSync(resolve(repositoryRoot, path), "utf8");
}

describe("highlightLast (decision 4 and the addendum of decision 17)", () => {
  it("wraps the last three words when the text has six or more words", () => {
    const parts = highlightLast("Every answer shows where it came from.");

    expect(parts.tail).toBe("it came from.");
    expect(parts.lead).toBe("Every answer shows where ");
    expect(parts.lead + parts.tail).toBe("Every answer shows where it came from.");
  });

  it("wraps exactly the last three words at the threshold of six words", () => {
    expect(highlightLast("one two three four five six")).toEqual({ lead: "one two three ", tail: "four five six" });
  });

  it("wraps all of the text when it has fewer than six words", () => {
    expect(highlightLast("Ask us anything now")).toEqual({ lead: "", tail: "Ask us anything now" });
    expect(highlightLast("one two three four five")).toEqual({ lead: "", tail: "one two three four five" });
  });

  it("wraps a single word", () => {
    expect(highlightLast("Cited")).toEqual({ lead: "", tail: "Cited" });
  });

  it("returns an empty tail only for an empty text", () => {
    expect(highlightLast("")).toEqual({ lead: "", tail: "" });
    expect(highlightLast("   ")).toEqual({ lead: "", tail: "" });
    expect(highlightLast("x").tail).not.toBe("");
  });

  it("takes an explicit number of words and never more than the text has", () => {
    expect(highlightLast("one two three four five six seven", 2)).toEqual({
      lead: "one two three four five ",
      tail: "six seven",
    });
    expect(highlightLast("one two", 5)).toEqual({ lead: "", tail: "one two" });
  });

  it("keeps the text intact for Spanish with accents and inner spacing", () => {
    const text = "Cada respuesta enseña de dónde salió.";
    const parts = highlightLast(text);

    expect(parts.tail).toBe("de dónde salió.");
    expect(parts.lead + parts.tail).toBe(text);
  });
});

describe("Wordmark (decision 2)", () => {
  it("renders the word Cited with a lime citation mark that says 1 and is hidden from assistive technology", () => {
    const { container } = render(<Wordmark />);
    const wordmark = container.querySelector('[data-brand="wordmark"]');
    const mark = container.querySelector('[data-brand="citation-mark"]');

    expect(wordmark).not.toBeNull();
    expect(wordmark?.textContent).toContain("Cited");
    expect(mark?.textContent).toBe("1");
    expect(mark?.closest('[aria-hidden="true"]'), "the visible 1 is aria-hidden").not.toBeNull();
    expect(mark?.className).toContain("bg-lime");
    expect(wordmark?.className).toContain("font-extrabold");
    expect(wordmark?.className).toContain("tracking-[-0.04em]");
  });

  it("is a span without href and a link named Cited with one", () => {
    const { container, rerender } = render(<Wordmark />);

    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector('span[data-brand="wordmark"]')).not.toBeNull();

    rerender(<Wordmark href="/admin" />);

    const link = screen.getByRole("link", { name: "Cited" });

    expect(link).toHaveAttribute("href", "/admin");
    expect(link).toHaveAttribute("data-brand", "wordmark");
  });

  it("is never a heading", () => {
    render(<Wordmark href="/" />);

    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("has three sizes: 20, 36 and 56 px", () => {
    const sizes = { sm: "text-[20px]", md: "text-[36px]", lg: "text-[56px]" } as const;

    for (const [size, expected] of Object.entries(sizes)) {
      const { container, unmount } = render(<Wordmark size={size as keyof typeof sizes} />);

      expect(container.querySelector('[data-brand="wordmark"]')?.className, size).toContain(expected);
      unmount();
    }
  });

  it("defaults to the medium size and the paper tone (ink text)", () => {
    const { container } = render(<Wordmark />);
    const className = container.querySelector('[data-brand="wordmark"]')?.className ?? "";

    expect(className).toContain("text-[36px]");
    expect(className).toContain("text-ink");
  });

  it("gives paper text on the ink tone and keeps the mark lime in both tones", () => {
    const { container: onInk } = render(<Wordmark tone="ink" />);
    const { container: onPaper } = render(<Wordmark tone="paper" />);

    expect(onInk.querySelector('[data-brand="wordmark"]')?.className).toContain("text-paper");
    expect(onPaper.querySelector('[data-brand="wordmark"]')?.className).toContain("text-ink");
    expect(onInk.querySelector('[data-brand="citation-mark"]')?.className).toContain("bg-lime");
    expect(onPaper.querySelector('[data-brand="citation-mark"]')?.className).toContain("bg-lime");
  });

  it("adds the class it is given", () => {
    const { container } = render(<Wordmark className="mt-2" />);

    expect(container.querySelector('[data-brand="wordmark"]')?.className).toContain("mt-2");
  });
});

describe("CitationMark and citationMarkClass (decision 3)", () => {
  it("renders a static span with the number, 1 by default", () => {
    const { container, rerender } = render(<CitationMark />);
    const mark = container.querySelector('[data-brand="citation-mark"]');

    expect(mark?.tagName).toBe("SPAN");
    expect(mark?.textContent).toBe("1");

    rerender(<CitationMark n={3} />);
    expect(container.querySelector('[data-brand="citation-mark"]')?.textContent).toBe("3");

    rerender(<CitationMark n="–" />);
    expect(container.querySelector('[data-brand="citation-mark"]')?.textContent).toBe("–");
  });

  it("paints the static mark ink with a lime number when its state is open", () => {
    const { container } = render(<CitationMark n={3} state="open" />);
    const className = container.querySelector('[data-brand="citation-mark"]')?.className ?? "";

    expect(className).toContain("bg-ink");
    expect(className).toContain("text-lime");
    expect(className).not.toContain("bg-lime");
  });

  it("is a lime square with ink text and the measures of the design", () => {
    const { container } = render(<CitationMark className="ml-2" />);
    const className = container.querySelector('[data-brand="citation-mark"]')?.className ?? "";

    for (const token of [
      "inline-grid",
      "place-items-center",
      "min-w-[1.5em]",
      "h-[1.3em]",
      "px-[0.3em]",
      "bg-lime",
      "text-ink",
      "font-bold",
      "text-[0.72em]",
      "align-[0.1em]",
      "rounded-none",
      "ml-2",
    ]) {
      expect(className, token).toContain(token);
    }
  });

  it("gives the rest state lime with ink, the open state ink with lime, and the same measures to both", () => {
    const rest = citationMarkClass("rest");
    const open = citationMarkClass("open");

    expect(citationMarkClass()).toBe(rest);
    expect(rest).toContain("bg-lime");
    expect(rest).toContain("text-ink");
    expect(open).toContain("bg-ink");
    expect(open).toContain("text-lime");
    expect(open).not.toContain("bg-lime");

    for (const measure of ["inline-grid", "min-w-[1.5em]", "h-[1.3em]", "px-[0.3em]", "text-[0.72em]", "rounded-none"]) {
      expect(rest, measure).toContain(measure);
      expect(open, measure).toContain(measure);
    }
  });

  it("keeps an open mark ink under the pointer: the hover of the business color paints only a mark at rest", () => {
    expect(citationMarkClass("rest")).toContain("hover:bg-[var(--primary)]");
    expect(citationMarkClass("open")).not.toContain("hover:");
  });

  it("takes the color of the business on hover and the focus ring of the kit, for the marks that are buttons", () => {
    const rest = citationMarkClass("rest");

    expect(rest).toContain("hover:bg-[var(--primary)]");
    expect(rest).toContain("hover:text-[var(--on-primary)]");
    expect(rest).toContain("focus-visible:outline-lime");
  });

  it("styles a real button exactly like the static span", () => {
    render(
      <>
        <button type="button" className={citationMarkClass("rest")} aria-label="Citation 1" aria-expanded={false}>
          1
        </button>
        <CitationMark n={2} />
      </>,
    );

    const button = screen.getByRole("button", { name: "Citation 1" });

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button.className).toContain("bg-lime");
  });
});

describe("Highlight and HighlightedTail", () => {
  it("paints the words with the .hl class, and sweeps only when asked", () => {
    const { container, rerender } = render(<Highlight>the passage</Highlight>);

    expect(container.querySelector(".hl")?.textContent).toBe("the passage");
    expect(container.querySelector(".hl-sweep")).toBeNull();

    rerender(<Highlight sweep>the passage</Highlight>);
    expect(container.querySelector(".hl.hl-sweep")?.textContent).toBe("the passage");
  });

  it("highlights the last three words of a headline and leaves the lead alone", () => {
    const { container } = render(<HighlightedTail text="Every answer shows where it came from." sweep />);

    expect(container.querySelector(".hl")?.textContent).toBe("it came from.");
    expect(container.textContent).toBe("Every answer shows where it came from.");
  });

  it("renders a short text whole in the highlighter and an empty text as nothing", () => {
    const { container, rerender } = render(<HighlightedTail text="Ask us" />);

    expect(container.querySelector(".hl")?.textContent).toBe("Ask us");

    rerender(<HighlightedTail text="" />);
    expect(container.querySelector(".hl")).toBeNull();
    expect(container.textContent).toBe("");
  });
});

describe("Button: ghost and sm (decision 6)", () => {
  it("adds a ghost variant for controls on ink: transparent, a paper 40% border and paper text", () => {
    render(<Button variant="ghost">Sign out</Button>);

    const className = screen.getByRole("button", { name: "Sign out" }).className;

    expect(className).toContain("bg-transparent");
    expect(className).toContain("border-paper/40");
    expect(className).toContain("text-paper");
    expect(className).toContain("rounded-none");
  });

  it("adds an sm size with px-4 py-2, and keeps 44 px of height on phones", () => {
    render(<Button size="sm">Close</Button>);

    const className = screen.getByRole("button", { name: "Close" }).className;

    expect(className).toContain("px-4");
    expect(className).toContain("py-2");
    expect(className).not.toContain("px-7");
    expect(className).toContain("max-lg:min-h-11");
  });

  it("keeps the default size px-7 py-3", () => {
    render(<Button>Ask</Button>);

    const className = screen.getByRole("button", { name: "Ask" }).className;

    expect(className).toContain("px-7");
    expect(className).toContain("py-3");
  });

  it("keeps the brand variant painted with the two variables of the business", () => {
    render(
      <Button variant="brand" size="sm">
        Ask
      </Button>,
    );

    const className = screen.getByRole("button", { name: "Ask" }).className;

    expect(className).toContain("bg-[var(--primary)]");
    expect(className).toContain("text-[var(--on-primary)]");
  });

  it("keeps the secondary variant with its border-border hairline and the primary as it was", () => {
    render(
      <>
        <Button variant="secondary">Secondary</Button>
        <Button>Primary</Button>
      </>,
    );

    expect(screen.getByRole("button", { name: "Secondary" }).className).toContain("border-border");
    expect(screen.getByRole("button", { name: "Primary" }).className).toContain("bg-ink");
  });

  it("keeps the focus ring of the kit in every variant and size, and type button by default", () => {
    render(
      <>
        <Button variant="ghost" size="sm">
          Ghost
        </Button>
        <Button variant="brand">Brand</Button>
      </>,
    );

    for (const name of ["Ghost", "Brand"]) {
      const button = screen.getByRole("button", { name });

      expect(button.className, name).toContain("focus-visible:outline-lime");
      expect(button).toHaveAttribute("type", "button");
    }
  });
});

describe("SectionTitle: the eyebrow is ink-2 (decision 6)", () => {
  it("paints the eyebrow with text-ink-2 and keeps the heading", () => {
    render(
      <SectionTitle level="h1" eyebrow="Design system">
        The kit
      </SectionTitle>,
    );

    expect(screen.getByText("Design system").className).toContain("text-ink-2");
    expect(screen.getByRole("heading", { level: 1, name: "The kit" })).toBeInTheDocument();
  });

  it("renders no eyebrow without one", () => {
    const { container } = render(<SectionTitle>Only a title</SectionTitle>);

    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});

describe("LanguageSwitch tones (decision 6)", () => {
  const tones = ["paper", "ink", "brand"] as const;

  for (const tone of tones) {
    it(`keeps English first and aria-pressed in the ${tone} tone`, () => {
      render(<LanguageSwitch current="es" tone={tone} reload={() => {}} />);

      const buttons = screen.getAllByRole("button");

      expect(buttons.map((button) => button.textContent)).toEqual(["English", "Español"]);
      expect(screen.getByRole("button", { name: "Español" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByRole("group", { name: "Idioma" })).toBeInTheDocument();
    });
  }

  it("is the paper tone by default, with the look it always had", () => {
    render(<LanguageSwitch current="en" reload={() => {}} />);

    const chosen = screen.getByRole("button", { name: "English" });
    const other = screen.getByRole("button", { name: "Español" });

    expect(chosen.className).toContain("text-ink");
    expect(chosen.className).toContain("underline");
    expect(other.className).toContain("text-ink/60");
  });

  it("paints the chosen language lime and the other paper on the ink tone", () => {
    render(<LanguageSwitch current="en" tone="ink" reload={() => {}} />);

    expect(screen.getByRole("button", { name: "English" }).className).toContain("text-lime");
    expect(screen.getByRole("button", { name: "Español" }).className).toContain("text-paper/80");
  });

  it("takes the color of its ground on the brand tone", () => {
    render(<LanguageSwitch current="en" tone="brand" reload={() => {}} />);

    expect(screen.getByRole("button", { name: "English" }).className).toContain("text-current");
    expect(screen.getByRole("button", { name: "Español" }).className).toContain("text-current");
  });

  it("keeps the interface of the parallel lanes: the prop current alone still works", () => {
    render(<LanguageSwitch current="en" />);

    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("keeps 44 px of height on phones for its buttons and the focus ring", () => {
    render(<LanguageSwitch current="en" tone="ink" reload={() => {}} />);

    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toContain("max-lg:min-h-11");
      expect(button.className).toContain("focus-visible:outline-lime");
    }
  });
});

describe("the kit stays made of server components", () => {
  for (const path of [
    "components/ui/Button.tsx",
    "components/ui/Chip.tsx",
    "components/ui/Input.tsx",
    "components/ui/Panel.tsx",
    "components/ui/SectionTitle.tsx",
    "components/brand/Wordmark.tsx",
    "components/brand/CitationMark.tsx",
    "components/brand/Highlight.tsx",
    "components/brand/index.ts",
    "lib/brand/highlight.ts",
  ]) {
    it(`${path} is not a client module`, () => {
      expect(readText(path)).not.toContain('"use client"');
    });
  }

  it("keeps the square corners, the hairlines and the focus ring of the kit", () => {
    for (const name of ["Button", "Panel", "Input", "Chip"]) {
      expect(readText(`components/ui/${name}.tsx`), `${name} is square`).toContain("rounded-none");
    }

    expect(readText("components/ui/Panel.tsx")).toContain("border-ink/10");
    expect(readText("components/ui/Input.tsx")).toContain("border-border");
    expect(readText("components/ui/Button.tsx")).toContain("border-border");

    for (const name of ["Button", "Input"]) {
      expect(readText(`components/ui/${name}.tsx`), `${name} focus`).toContain("focusRing");
    }
  });
});

describe("the kit page (decision 13)", () => {
  const markers = [
    "button-primary",
    "button-secondary",
    "input",
    "chip",
    "panel",
    "section-title",
    "wordmark",
    "citation-mark",
    "highlighter",
  ];

  it("renders the nine markers, each once, and one h1", () => {
    const { container } = render(<Kit />);

    for (const marker of markers) {
      expect(container.querySelectorAll(`[data-kit="${marker}"]`), marker).toHaveLength(1);
    }

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("carries no money figure in its sample copy, so a capture of the kit never shows a price", () => {
    const { container } = render(<Kit />);

    expect(container.textContent ?? "").not.toMatch(/\d\s*(pesos|MXN|USD|EUR)|[$€]\s*\d/i);
  });

  it("shows the wordmark in both tones, the citation mark and the highlighter in their sections", () => {
    const { container } = render(<Kit />);

    expect(container.querySelectorAll('[data-kit="wordmark"] [data-brand="wordmark"]').length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll('[data-kit="citation-mark"] [data-brand="citation-mark"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-kit="highlighter"] .hl').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-kit="highlighter"] .hl-sweep').length).toBeGreaterThan(0);
  });

  it("is in Spanish, says what each device is for and carries a note on reduced motion", () => {
    const { container } = render(<Kit />);
    const text = container.textContent ?? "";

    expect(container.querySelector("main")).toHaveAttribute("lang", "es");
    expect(text).toContain("Marca de cita");
    expect(text).toContain("Marcatextos");
    expect(text).toContain("Logotipo");
    expect(text).toMatch(/movimiento reducido|reducir el movimiento/i);
  });

  it("keeps a paragraph no wider than 75 characters", () => {
    const { container } = render(<Kit />);

    for (const paragraph of container.querySelectorAll("p")) {
      expect(paragraph.className, (paragraph.textContent ?? "").slice(0, 40)).not.toMatch(/max-w-\[(7[6-9]|[89]\d|\d{3,})ch\]/);
    }
  });
});
