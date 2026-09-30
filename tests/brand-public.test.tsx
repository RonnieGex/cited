import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Embed from "@/app/embed/page";
import Home from "@/app/page";
import { Chat, type AskFn } from "@/components/chat/Chat";
import { Markdown } from "@/components/chat/Markdown";
import type { Citation } from "@/lib/answer/types";
import type { AskResult } from "@/lib/chat/client";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import type { Business } from "@/lib/settings/business";

// Task 3.4 of `openspec/changes/brand-identity-ui/tasks.md` (decisions 9 to 12 and the hooks of 17 of `design.md`): the
// public page wears the business first, the answers are a ledger, waiting shows one bar, the ask form stays in reach and
// the embed is a slim strip. The scenarios that need a browser (the computed colors, the sticky position, the contrast)
// live in `e2e/brand.spec.ts`; this file pins the markup, the classes and the hooks that those scenarios read.

const repositoryRoot = resolve(import.meta.dirname, "..");
const en = PUBLIC_STRINGS.en;
const es = PUBLIC_STRINGS.es;

let business: Business | null = null;
let langCookie: string | undefined;
let notReady = false;

vi.mock("@/lib/settings/business.ts", () => ({
  readBusiness: async () => business,
}));

// Decision 20 of `design.md`: the page of `main` asks the resolver whether the assistant is ready, and the test decides the
// answer instead of opening a store (the same mock as `tests/public-page.test.tsx`).
vi.mock("@/lib/settings/providers.ts", () => ({
  resolveChat: async () => ({ source: "panel", provider: "deepseek", model: "deepseek-flash" }),
  chatProblem: () => (notReady ? "the AI is not connected yet: connect your AI in the panel" : null),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (langCookie === undefined ? undefined : { name, value: langCookie }),
  }),
}));

const workshop: Business = {
  name: "Café La Horquilla",
  hasLogo: false,
  primaryColor: "#1d4ed8",
  tone: "close",
  language: "en",
  forbiddenTopics: [],
  welcome: {
    en: "Welcome. Ask anything about our workshop and see where each answer comes from.",
    es: "Bienvenido. Pregunta lo que quieras de nuestro taller y mira de dónde sale cada respuesta.",
  },
  updatedAt: "2026-09-29T00:00:00.000Z",
};

beforeEach(() => {
  business = null;
  langCookie = undefined;
  notReady = false;
});

class MemoryStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const first: Citation = {
  n: 1,
  document: "cafe-la-horquilla.md",
  heading: "Precios",
  position: 3,
  excerpt: "Afinación de bicicleta: 380 pesos.",
};
const second: Citation = {
  n: 2,
  document: "bike-workshop-policies.md",
  heading: null,
  position: 1,
  excerpt: "Cambio de cámara: 120 pesos.",
};
const answered: AskResult = {
  status: "answered",
  answer: "The tune-up is 380 pesos [1] and the tube change is 120 pesos [2].",
  citations: [first, second],
};

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });

  return { promise, resolve };
}

function chat(result: AskResult, lang: "en" | "es" = "en") {
  const ask: AskFn = async () => result;

  return render(<Chat lang={lang} welcome="Ask us anything." ask={ask} storage={new MemoryStorage()} />);
}

async function ask(text: string, lang: "en" | "es" = "en"): Promise<void> {
  fireEvent.change(screen.getByLabelText(PUBLIC_STRINGS[lang].question.label), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: PUBLIC_STRINGS[lang].question.submit }));
  await act(async () => {
    await Promise.resolve();
  });
}

describe("the band of the public page (decision 9)", () => {
  it("is ink with the wordmark, and the h1 is visually hidden, when there is no business yet", async () => {
    const { container } = render(await Home());
    const band = container.querySelector('[data-public="band"]');

    expect(band, "the band").not.toBeNull();
    expect(band?.tagName).toBe("HEADER");
    expect(band?.className).toContain("bg-ink");
    expect(band?.className).toContain("text-paper");
    expect(band?.className).toContain("py-10");
    expect(band?.className).toContain("lg:py-14");

    const wordmark = band?.querySelector('[data-brand="wordmark"]');

    expect(wordmark, "the wordmark of the band").not.toBeNull();
    expect(wordmark?.closest('[aria-hidden="true"]'), "hidden from assistive technology there").not.toBeNull();
    expect(wordmark?.className, "the lg wordmark").toContain("text-[56px]");
    expect(wordmark?.className, "on ink").toContain("text-paper");

    const heading = screen.getByRole("heading", { level: 1 });

    expect(heading).toHaveTextContent("Cited");
    expect(heading.className, "the h1 stays for assistive technology, out of sight").toContain("sr-only");
    expect(band?.contains(heading), "the h1 is in the band").toBe(true);
  });

  it("carries the color of the business, its name as the only visible h1 and the switch in the brand tone", async () => {
    business = workshop;

    const { container } = render(await Home());
    const band = container.querySelector('[data-public="band"]') as HTMLElement;

    expect(band.className).toContain("bg-[var(--primary)]");
    expect(band.className).toContain("text-[var(--on-primary)]");
    expect(band.className).not.toContain("bg-ink");
    expect(band.querySelector('[data-brand="wordmark"]'), "no wordmark once the business has a name").toBeNull();

    const heading = within(band).getByRole("heading", { level: 1 });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(heading).toHaveTextContent("Café La Horquilla");
    expect(heading.className).not.toContain("sr-only");
    expect(heading.className).toContain("text-[32px]");
    expect(heading.className).toContain("lg:text-[40px]");
    expect(heading.className).toContain("font-bold");

    const group = within(band).getByRole("group", { name: en.language });
    const pressed = within(group).getByRole("button", { name: "English" });

    expect(pressed).toHaveAttribute("aria-pressed", "true");
    expect(pressed.className, "the brand tone paints with the color of the band").toContain("text-current");
  });

  it("uses the ink tone of the switch on the ink band", async () => {
    const { container } = render(await Home());
    const band = container.querySelector('[data-public="band"]') as HTMLElement;
    const pressed = within(band).getByRole("button", { name: "English" });

    expect(pressed.className).toContain("text-lime");
  });

  it("holds the only language switch of the page, in the language of the visitor", async () => {
    business = { ...workshop, language: "es" };

    const { container } = render(await Home());

    expect(screen.getAllByRole("group", { name: es.language })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Español" })).toHaveLength(1);
    expect(container.querySelector('[data-public="band"]')?.contains(screen.getByRole("group", { name: es.language }))).toBe(
      true,
    );
  });

  it("shows the logo the panel serves inside the band", async () => {
    business = { ...workshop, hasLogo: true };

    const { container } = render(await Home());
    const band = container.querySelector('[data-public="band"]') as HTMLElement;

    expect(within(band).getByRole("img", { name: "Café La Horquilla" })).toHaveAttribute("src", "/api/brand/logo");
  });

  it("keeps one main, the question box and the ink flame of Katalis in the footer", async () => {
    const { container } = render(await Home());
    const main = container.querySelector("main");

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(main?.style.getPropertyValue("--primary")).not.toBe("");
    expect(main?.style.getPropertyValue("--on-primary")).not.toBe("");
    expect(screen.getByLabelText(en.question.label)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Katalis" })).toHaveAttribute("src", "/brand/katalis-flame-ink-64.png");
    expect(screen.getByText(en.footer)).toBeInTheDocument();
  });

  // Decision 18 of `design.md`: the signature of Katalis reads in the language of the page.
  it("signs the Spanish page with Hecho por Katalis beside the flame, and never the English line", async () => {
    langCookie = "es";

    render(await Home());
    const signature = screen.getByText("Hecho por Katalis", { exact: true });

    expect(es.footer).toBe("Hecho por Katalis");
    expect(signature.parentElement?.querySelector("img[src*='katalis-flame']")).not.toBeNull();
    expect(screen.queryByText("Built by Katalis")).toBeNull();
  });

  it("puts the welcome under the band as the headline with its last words in the highlighter", async () => {
    business = workshop;

    const { container } = render(await Home());
    const band = container.querySelector('[data-public="band"]') as HTMLElement;
    const headline = container.querySelector('[data-cited="welcome"]') as HTMLElement;

    expect(headline, "the welcome headline").not.toBeNull();
    expect(band.contains(headline), "the headline is under the band, on paper").toBe(false);
    expect(headline.tagName).toBe("P");
    expect(headline.textContent).toBe(workshop.welcome.en);
    expect(headline.className).toContain("rise");
    expect(headline.className).toContain("text-[28px]");
    expect(headline.className).toContain("lg:text-[36px]");
    expect(headline.className).toContain("font-semibold");
    expect(headline.className).toContain("leading-[1.15]");
    expect(headline.className).toContain("max-w-[24ch]");

    const highlighted = headline.querySelector(".hl.hl-sweep");

    expect(highlighted?.textContent, "the last three words").toBe("answer comes from.");
  });
});

describe("the embed strip (decision 12)", () => {
  it("is a slim strip in the primary color with the name at 18px and the switch in the brand tone", async () => {
    business = workshop;

    const { container } = render(await Embed());
    const band = container.querySelector('[data-public="band"]') as HTMLElement;

    expect(band, "the strip").not.toBeNull();
    expect(band.className).toContain("py-4");
    expect(band.className).toContain("bg-[var(--primary)]");
    expect(band.className).toContain("text-[var(--on-primary)]");

    const heading = within(band).getByRole("heading", { level: 1 });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(heading).toHaveTextContent("Café La Horquilla");
    expect(heading.className).toContain("text-[18px]");

    const pressed = within(band).getByRole("button", { name: "English" });

    expect(pressed.className).toContain("text-current");
    expect(screen.getAllByRole("group", { name: en.language })).toHaveLength(1);
  });

  it("keeps its size, the same chat and no footer", async () => {
    const { container } = render(await Embed());

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(container.querySelector('[data-cited="welcome"]')).not.toBeNull();
    expect(screen.getByLabelText(en.question.label)).toBeInTheDocument();
    expect(screen.queryByText(en.footer)).toBeNull();
    expect(container.querySelector("main")?.style.getPropertyValue("--primary")).not.toBe("");
  });
});

describe("the ledger of the chat (decision 10)", () => {
  it("does not render the language switch: the band owns it", () => {
    chat(answered);

    expect(screen.queryByRole("group", { name: en.language })).toBeNull();
  });

  it("makes each turn an entry with the question under a label, in both languages", async () => {
    const { container, unmount } = chat(answered);

    await ask("How much is a tune-up?");

    const turn = container.querySelector('[data-cited="turn"]') as HTMLElement;

    expect(turn.tagName).toBe("LI");
    expect(within(turn).getByText(en.asked)).toBeInTheDocument();
    expect(within(turn).getByText("How much is a tune-up?")).toBeInTheDocument();
    expect(en.asked).toBe("You asked");
    expect(within(turn).getByText(en.asked).className).toContain("text-ink-2");
    expect(within(turn).getByText(en.asked).className).toContain("uppercase");
    expect(within(turn).getByText("How much is a tune-up?").className).toContain("font-semibold");

    unmount();
    chat(answered, "es");
    await ask("¿Cuánto cuesta?", "es");

    expect(es.asked).toBe("Preguntaste");
    expect(screen.getByText(es.asked)).toBeInTheDocument();
  });

  it("paints each mark of the answer as a lime button named Citation n, with the stagger variable", async () => {
    chat(answered);
    await ask("How much is a tune-up?");

    const marks = [screen.getByRole("button", { name: en.citation(1) }), screen.getByRole("button", { name: en.citation(2) })];

    for (const [index, mark] of marks.entries()) {
      expect(mark.className, "lime, ink text").toContain("bg-lime");
      expect(mark.className).toContain("text-ink");
      expect(mark.className, "the color of the business on hover").toContain("hover:bg-[var(--primary)]");
      expect(mark.textContent, "the number of the source").toBe(String(index + 1));
      expect(mark.style.getPropertyValue("--i"), "the stagger").toBe(String(index));
      expect(mark.className, "lands when the answer arrives").toContain("mark-land");
      expect(mark).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("lands the marks of the turn that just arrived and no earlier one", async () => {
    chat(answered);
    await ask("First question");
    await ask("Second question");

    const marks = screen.getAllByRole("button", { name: en.citation(1) });

    expect(marks).toHaveLength(2);
    expect(marks[0]?.className, "the first turn is at rest").not.toContain("mark-land");
    expect(marks[1]?.className, "the newest turn lands").toContain("mark-land");
  });

  it("lists the sources in an aside beside the answer, one mark per source and the name unchanged", async () => {
    const { container } = chat(answered);

    await ask("How much is a tune-up?");

    const aside = container.querySelector('[data-cited="sources"]') as HTMLElement;

    expect(aside.tagName).toBe("ASIDE");
    expect(screen.getByRole("complementary", { name: en.sources })).toBe(aside);
    expect(container.querySelector('[data-cited="turn"]')?.contains(aside)).toBe(true);

    for (const source of [first, second]) {
      const button = within(aside).getByRole("button", { name: `[${source.n}] ${source.document}` });

      expect(within(button).getByText(`[${source.n}] ${source.document}`), "the name is one text node").toBeInTheDocument();
      expect(button.querySelector('[data-brand="citation-mark"]')?.className, "a lime mark").toContain("bg-lime");
      expect(button.className, "44px on phones").toContain("max-lg:min-h-11");
    }
  });

  it("puts the sources in a margin column from 1024px and after the answer below", async () => {
    const { container } = chat(answered);

    await ask("How much is a tune-up?");

    const turn = container.querySelector('[data-cited="turn"]') as HTMLElement;
    const aside = turn.querySelector('[data-cited="sources"]') as HTMLElement;

    expect(turn.className).toContain("lg:grid-cols-[minmax(0,1fr)_220px]");
    expect(aside.className).toContain("lg:col-start-2");
  });

  it("opens the passage in the highlighter under the answer, with the note motion, and inks the open marks", async () => {
    const { container } = chat(answered);

    await ask("How much is a tune-up?");
    fireEvent.click(screen.getByRole("button", { name: en.citation(1) }));

    const panel = container.querySelector('[data-cited="citation"]') as HTMLElement;

    expect(panel).toHaveAttribute("role", "region");
    expect(panel).toHaveAttribute("aria-label", en.citation(1));
    expect(panel.className, "the source note enters").toContain("note-in");

    const passage = panel.querySelector(".hl.hl-sweep");

    expect(passage?.textContent, "the passage in the highlighter").toBe(first.excerpt);

    const terms = [...panel.querySelectorAll("dt")].map((term) => term.textContent);
    const definitions = [...panel.querySelectorAll("dd")].map((definition) => definition.textContent);

    expect(terms).toEqual([en.document, en.heading]);
    expect(definitions).toEqual([first.document, first.heading]);

    const close = within(panel).getByRole("button", { name: en.close });

    expect(close.className, "the secondary, small close").toContain("border-border");
    expect(close.className).toContain("px-4 py-2");

    const inline = screen.getByRole("button", { name: en.citation(1) });

    expect(inline).toHaveAttribute("aria-expanded", "true");
    expect(inline).toHaveAttribute("aria-controls", panel.id);
    expect(inline.className, "the open mark is ink with lime text").toContain("bg-ink");
    expect(inline.className).toContain("text-lime");
    expect(screen.getByRole("button", { name: en.citation(2) }).className, "the other stays lime").toContain("bg-lime");

    const listed = screen.getByRole("button", { name: `[1] ${first.document}` });

    expect(listed).toHaveAttribute("aria-expanded", "true");
    expect(listed.querySelector('[data-brand="citation-mark"]')?.className, "the source that is open").toContain("bg-ink");
  });

  it("omits the heading of the note when the passage has none", async () => {
    const { container } = chat(answered);

    await ask("How much is a tune-up?");
    fireEvent.click(screen.getByRole("button", { name: en.citation(2) }));

    const panel = container.querySelector('[data-cited="citation"]') as HTMLElement;

    expect([...panel.querySelectorAll("dt")].map((term) => term.textContent)).toEqual([en.document]);
  });

  it("shows a refusal with a square marker carrying an en dash, and no side stripe", async () => {
    const { container } = chat({ status: "refused", answer: "I can't find that in this business's documents." });

    await ask("Do you sell submarines?");

    const refusal = container.querySelector('[data-cited="refusal"]') as HTMLElement;

    expect(refusal).toHaveTextContent(en.refusal);
    expect(refusal).toHaveTextContent("I can't find that in this business's documents.");
    expect(refusal.className).not.toMatch(/\bborder-[lr]-/);

    const marker = refusal.querySelector('[data-marker="ink"]') as HTMLElement;

    expect(marker.textContent).toBe("–");
    expect(marker.className, "an ink square").toContain("bg-ink");
    expect(marker.closest('[aria-hidden="true"]'), "decorative").not.toBeNull();
    expect(container.querySelector('[data-cited="sources"]'), "a refusal has no sources").toBeNull();
    expect(screen.queryByRole("button", { name: en.citation(1) })).toBeNull();
  });

  it("shows a failure as a status beside a coral square, and no side stripe", async () => {
    const { container } = chat({ status: "failed", message: "the daily limit is reached" });

    await ask("How much is a tune-up?");

    const message = screen.getByText("the daily limit is reached");
    const status = message.closest('[role="status"]') as HTMLElement;

    expect(status).not.toBeNull();
    expect(status.className).not.toMatch(/\bborder-[lr]-/);

    const marker = container.querySelector('[data-marker="coral"]') as HTMLElement;

    expect(marker.className, "a coral square").toContain("bg-coral");
    expect(marker.closest('[aria-hidden="true"]'), "decorative").not.toBeNull();
    expect(status.contains(marker)).toBe(true);
  });
});

describe("waiting and asking (decision 11)", () => {
  it("keeps the words of the wait in a status and adds one bar painted with the primary color", async () => {
    const pending = deferred<AskResult>();
    const { container } = render(
      <Chat lang="en" welcome="Ask us anything." ask={() => pending.promise} storage={new MemoryStorage()} />,
    );

    await ask("How much is a tune-up?");

    const words = screen.getByText(en.loading);
    const status = words.closest('[role="status"]') as HTMLElement;
    const bar = container.querySelector('[data-cited="waiting-bar"]') as HTMLElement;

    expect(status, "the wait is announced").not.toBeNull();
    expect(status.contains(bar), "the bar is under the text, in the status").toBe(true);
    expect(bar.className).toContain("bg-[var(--primary)]");
    expect(bar.className).toContain("bar");
    expect(bar.className).toContain("h-0.5");
    expect(container.innerHTML, "no side stripe on the wait").not.toMatch(/border-l-/);

    await act(async () => {
      pending.resolve(answered);
    });

    expect(container.querySelector('[data-cited="waiting-bar"]')).toBeNull();
  });

  it("does not stick the ask form until the thread exists, then sticks it to the foot with a rule", async () => {
    const { container } = chat(answered);
    const form = container.querySelector('[data-cited="ask"]') as HTMLFormElement;

    expect(form.tagName).toBe("FORM");
    expect(form.className).not.toContain("sticky");

    await ask("How much is a tune-up?");

    const stuck = container.querySelector('[data-cited="ask"]') as HTMLFormElement;

    expect(stuck.className).toContain("sticky");
    expect(stuck.className).toContain("bottom-0");
    expect(stuck.className).toContain("bg-paper");
    expect(stuck.className).toContain("border-t");
  });

  it("does not change the label, the name, the placeholder or the brand button of the box", () => {
    chat(answered);

    const field = screen.getByLabelText(en.question.label);

    expect(field).toHaveAttribute("name", "question");
    expect(field).toHaveAttribute("placeholder", en.question.placeholder);
    expect(screen.getAllByRole("button", { name: /ask/i })).toHaveLength(1);
    expect(screen.getByRole("button", { name: en.question.submit }).className).toContain("bg-[var(--primary)]");
  });

  it("shows the welcome as the headline with the rise motion and the highlighter", () => {
    const { container } = chat(answered);
    const headline = container.querySelector('[data-cited="welcome"]') as HTMLElement;

    expect(headline.className).toContain("rise");
    expect(headline.querySelector(".hl")?.textContent).toBe("Ask us anything.");
  });
});

describe("the Markdown marks of an answer that just arrived", () => {
  const marks = { citationLabel: (n: number) => `Citation ${n}`, onCitation: () => {} };

  it("numbers the marks, staggers them and lands them only when told to", () => {
    const { rerender } = render(<Markdown text="One [1] two [2] three [3]." landing {...marks} />);
    const landing = screen.getAllByRole("button");

    expect(landing.map((mark) => mark.textContent)).toEqual(["1", "2", "3"]);
    expect(landing.map((mark) => mark.style.getPropertyValue("--i"))).toEqual(["0", "1", "2"]);

    for (const mark of landing) {
      expect(mark.className).toContain("mark-land");
    }

    rerender(<Markdown text="One [1] two [2] three [3]." {...marks} />);

    for (const mark of screen.getAllByRole("button")) {
      expect(mark.className).not.toContain("mark-land");
      expect(mark.className).toContain("bg-lime");
    }
  });

  it("reads at 18px with a line of 1.6 and a measure of at most 75 characters", () => {
    const { container } = render(<Markdown text="A sentence." />);
    const root = container.firstElementChild as HTMLElement;

    expect(root.className).toContain("text-[18px]");
    expect(root.className).toContain("leading-[1.6]");
    expect(root.className).toMatch(/max-w-\[(6\d|7[0-5])ch\]/);
  });
});

describe("the sources of the public surface obey the bans", () => {
  const files = [
    "app/page.tsx",
    "app/embed/page.tsx",
    "components/chat/Chat.tsx",
    "components/chat/CitationPanel.tsx",
    "components/chat/Markdown.tsx",
    "components/chat/Marker.tsx",
  ];

  for (const path of files) {
    it(`${path} has no side stripe, no animation of its own and no gradient text`, () => {
      const source = readFileSync(resolve(repositoryRoot, path), "utf8");

      expect(source).not.toMatch(/\bborder-[lrse]-/);
      expect(source).not.toMatch(/\banimate-/);
      expect(source).not.toMatch(/@keyframes|animation\s*:/);
      expect(source).not.toMatch(/bg-clip-text|backdrop-blur/);
    });
  }

  it("motion is only named through the classes of app/brand.css", () => {
    const used = files
      .map((path) => readFileSync(resolve(repositoryRoot, path), "utf8"))
      .flatMap((source) => source.match(/\b(mark-land|note-in|rise|bar|hl-sweep)\b/g) ?? []);

    expect(used.length).toBeGreaterThan(0);
  });
});

// The adversarial review of step 12 (`reports/2026-09-29-step-12-review-fixes-public.md`): the keyboard keeps its place
// when a citation closes, the answers are announced, the question stays on the page while it is answered, the page
// follows the new entry and keeps the focus clear of the sticky box, the box stacks on a phone, the widget gives its
// room to the thread, a passage opens after the sources on a phone and the embed without a business is ink.
describe("the review of step 12", () => {
  const scrolled = vi.fn();

  beforeEach(() => {
    scrolled.mockClear();
    Element.prototype.scrollIntoView = scrolled;
  });

  function announcer(container: HTMLElement): HTMLElement {
    return container.querySelector('[data-cited="announcer"]') as HTMLElement;
  }

  it("gives the focus back to the mark that opened a passage when Close is pressed", async () => {
    chat(answered);
    await ask("How much is a tune-up?");

    const mark = screen.getByRole("button", { name: en.citation(1) });

    mark.focus();
    fireEvent.click(mark);

    const close = within(screen.getByRole("region", { name: en.citation(1) })).getByRole("button", { name: en.close });

    close.focus();
    fireEvent.click(close);

    expect(screen.queryByRole("region", { name: en.citation(1) })).toBeNull();
    expect(document.activeElement, "the focus is back on the mark, not on the body").toBe(mark);
  });

  it("gives the focus back to the source that opened a passage when Close is pressed", async () => {
    chat(answered);
    await ask("How much is a tune-up?");

    const source = screen.getByRole("button", { name: `[2] ${second.document}` });

    source.focus();
    fireEvent.click(source);

    const close = within(screen.getByRole("region", { name: en.citation(2) })).getByRole("button", { name: en.close });

    close.focus();
    fireEvent.click(close);

    expect(document.activeElement).toBe(source);
  });

  it("closes an open passage with Escape and gives the focus back to its mark", async () => {
    chat(answered);
    await ask("How much is a tune-up?");

    const mark = screen.getByRole("button", { name: en.citation(2) });

    mark.focus();
    fireEvent.click(mark);
    expect(mark).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(within(screen.getByRole("region", { name: en.citation(2) })).getByRole("button", { name: en.close }), {
      key: "Escape",
    });

    expect(screen.queryByRole("region", { name: en.citation(2) })).toBeNull();
    expect(mark).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(mark);
  });

  it("in the widget, the first Escape closes the passage and only the next one closes the widget", async () => {
    const posted: unknown[] = [];
    const parent = Object.getOwnPropertyDescriptor(window, "parent");

    Object.defineProperty(window, "parent", {
      configurable: true,
      get: () => ({ postMessage: (data: unknown) => posted.push(data) }),
    });

    try {
      render(
        <Chat lang="en" welcome="Ask us anything." variant="embed" ask={async () => answered} storage={new MemoryStorage()} />,
      );
      await ask("How much is a tune-up?");

      const mark = screen.getByRole("button", { name: en.citation(1) });

      mark.focus();
      fireEvent.click(mark);
      fireEvent.keyDown(mark, { key: "Escape" });

      expect(screen.queryByRole("region", { name: en.citation(1) })).toBeNull();
      expect(posted, "the widget stays open").toEqual([]);

      fireEvent.keyDown(mark, { key: "Escape" });

      expect(posted).toEqual([{ source: "cited-embed", type: "close" }]);
    } finally {
      if (parent === undefined) {
        Reflect.deleteProperty(window, "parent");
      } else {
        Object.defineProperty(window, "parent", parent);
      }
    }
  });

  it("keeps one polite live region from the first render and announces the wait and the answer in it", async () => {
    const pending = deferred<AskResult>();
    const { container } = render(
      <Chat lang="en" welcome="Ask us anything." ask={() => pending.promise} storage={new MemoryStorage()} />,
    );
    const region = announcer(container);

    expect(region, "the live region exists before any question").not.toBeNull();
    expect(region).toHaveAttribute("role", "status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region.className).toContain("sr-only");
    expect(region.textContent).toBe("");

    await ask("How much is a tune-up?");

    expect(announcer(container), "the same element, not a new one").toBe(region);
    expect(region.textContent).toBe("Question sent. Looking it up in the documents.");

    await act(async () => {
      pending.resolve(answered);
    });

    expect(announcer(container)).toBe(region);
    expect(region.textContent).toBe("Answer with 2 sources");
  });

  it("announces a refusal, a failure and a one-source answer, in Spanish too", async () => {
    const refusal = chat({ status: "refused", answer: "I can't find that in this business's documents." });

    await ask("Do you sell submarines?");
    expect(announcer(refusal.container).textContent).toBe(
      "Not in the documents: I can't find that in this business's documents.",
    );
    refusal.unmount();

    const failure = chat({ status: "failed", message: null });

    await ask("How much is a tune-up?");
    expect(announcer(failure.container).textContent).toBe(`No answer. ${en.error}`);
    failure.unmount();

    const spanish = chat(answered, "es");

    await ask("¿Cuánto cuesta?", "es");
    expect(announcer(spanish.container).textContent).toBe("Respuesta con 2 fuentes");
    spanish.unmount();

    const one = chat({ status: "answered", answer: "380 pesos [1].", citations: [first] }, "es");

    await ask("¿Cuánto cuesta?", "es");
    expect(announcer(one.container).textContent).toBe("Respuesta con 1 fuente");
  });

  it("shows the question with the waiting bar inside its own entry while it is answered", async () => {
    const pending = deferred<AskResult>();
    const { container } = render(
      <Chat lang="en" welcome="Ask us anything." ask={() => pending.promise} storage={new MemoryStorage()} />,
    );

    await ask("How much is a tune-up?");

    const entry = container.querySelector('[data-cited="pending"]') as HTMLElement;

    expect(entry, "the pending entry").not.toBeNull();
    expect(entry.tagName).toBe("LI");
    expect(entry.closest("ol"), "inside the ledger").not.toBeNull();
    expect(within(entry).getByText(en.asked)).toBeInTheDocument();
    expect(within(entry).getByText("How much is a tune-up?")).toBeInTheDocument();
    expect(entry.querySelector('[data-cited="waiting-bar"]'), "the bar is in the entry").not.toBeNull();
    expect(within(entry).getByText(en.loading).closest('[role="status"]')).not.toBeNull();

    await act(async () => {
      pending.resolve(answered);
    });

    expect(container.querySelector('[data-cited="pending"]')).toBeNull();
    expect(container.querySelectorAll('[data-cited="turn"]')).toHaveLength(1);
  });

  it("keeps the question of a failed turn and asks it again from a Try again button, in both languages", async () => {
    const calls: string[] = [];
    const results: AskResult[] = [{ status: "failed", message: null }, answered];
    const { container, unmount } = render(
      <Chat
        lang="en"
        welcome="Ask us anything."
        ask={async ({ question }) => {
          calls.push(question);

          return results.shift() as AskResult;
        }}
        storage={new MemoryStorage()}
      />,
    );

    await ask("How much is a tune-up?");

    const retry = screen.getByRole("button", { name: "Try again" });

    expect(retry.className, "the secondary, small button").toContain("border-border");
    expect(retry.className).toContain("px-4 py-2");

    await act(async () => {
      fireEvent.click(retry);
      await Promise.resolve();
    });

    expect(calls).toEqual(["How much is a tune-up?", "How much is a tune-up?"]);
    expect(container.querySelectorAll('[data-cited="turn"]'), "the failed entry became the answer").toHaveLength(1);
    expect(container.querySelector('[data-cited="answer"]')).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();

    unmount();
    chat({ status: "failed", message: null }, "es");
    await ask("¿Cuánto cuesta?", "es");

    expect(screen.getByRole("button", { name: "Intentar de nuevo" })).toBeInTheDocument();
  });

  it("brings the new entry into view, and reserves the height of the sticky box for scrolling while it sticks", async () => {
    const pending = deferred<AskResult>();
    const { container, unmount } = render(
      <Chat lang="en" welcome="Ask us anything." ask={() => pending.promise} storage={new MemoryStorage()} />,
    );

    expect(document.documentElement.style.scrollPaddingBottom, "nothing reserved before the box sticks").toBe("");

    await ask("How much is a tune-up?");

    expect(scrolled).toHaveBeenCalledWith({ block: "nearest" });
    expect(scrolled.mock.contexts.at(-1)).toBe(container.querySelector('[data-cited="pending"]'));
    expect(document.documentElement.style.scrollPaddingBottom, "the box is reserved").not.toBe("");

    await act(async () => {
      pending.resolve(answered);
    });

    expect(scrolled.mock.contexts.at(-1)).toBe(container.querySelector('[data-cited="turn"]'));

    unmount();

    expect(document.documentElement.style.scrollPaddingBottom, "released with the chat").toBe("");
  });

  it("stacks the field and the ask button on a phone so the field keeps the whole column", () => {
    chat(answered);

    const field = screen.getByLabelText(en.question.label);
    const button = screen.getByRole("button", { name: en.question.submit });
    const row = field.parentElement as HTMLElement;

    expect(row.contains(button)).toBe(true);
    expect(row.className).toMatch(/(^|\s)flex-col(\s|$)/);
    expect(row.className).toContain("sm:flex-row");
    expect(button.className).toContain("w-full");
    expect(button.className).toContain("sm:w-auto");
    expect(button.className).not.toContain("max-sm:px-5");
  });

  it("gives the room of the widget to the thread: no welcome and a visually hidden label once it exists", async () => {
    const { container } = render(
      <Chat lang="en" welcome="Ask us anything." variant="embed" ask={async () => answered} storage={new MemoryStorage()} />,
    );

    expect(container.querySelector('[data-cited="welcome"]'), "the welcome greets an empty widget").not.toBeNull();

    await ask("How much is a tune-up?");

    expect(container.querySelector('[data-cited="welcome"]')).toBeNull();

    const label = container.querySelector(`label[for="${screen.getByLabelText(en.question.label).id}"]`) as HTMLElement;

    expect(label.textContent).toBe(en.question.label);
    expect(label.className).toContain("sr-only");
  });

  it("keeps the welcome of the public page and its visible label once the thread exists", async () => {
    const { container } = chat(answered);

    await ask("How much is a tune-up?");

    expect(container.querySelector('[data-cited="welcome"]')).not.toBeNull();
    expect(screen.getByText(en.question.label).className).not.toContain("sr-only");
  });

  it("opens the passage after the sources in the order of the page, under the answer from 1024px, and brings it into view", async () => {
    const { container } = chat(answered);

    await ask("How much is a tune-up?");
    fireEvent.click(screen.getByRole("button", { name: `[1] ${first.document}` }));

    const panel = container.querySelector('[data-cited="citation"]') as HTMLElement;
    const aside = container.querySelector('[data-cited="sources"]') as HTMLElement;
    const turn = container.querySelector('[data-cited="turn"]') as HTMLElement;

    expect(panel.closest('[data-cited="answer"]'), "no longer inside the answer column").toBeNull();
    expect(turn.contains(panel)).toBe(true);
    expect(aside.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING, "after the sources").toBeTruthy();

    const cell = panel.parentElement as HTMLElement;

    expect(cell.className).toContain("lg:col-start-1");
    expect(cell.className).toContain("lg:row-start-3");
    expect(scrolled.mock.contexts.at(-1)).toBe(panel);
    expect(scrolled).toHaveBeenLastCalledWith({ block: "nearest" });
  });

  it("paints the embed strip ink with the ink switch when there is no business yet", async () => {
    const { container } = render(await Embed());
    const band = container.querySelector('[data-public="band"]') as HTMLElement;

    expect(band.className).toContain("bg-ink");
    expect(band.className).toContain("text-paper");
    expect(band.className).not.toContain("bg-[var(--primary)]");
    expect(band.className).toContain("py-4");
    expect(within(band).getByRole("button", { name: "English" }).className).toContain("text-lime");
  });
});

// Decision 20 of `design.md` (task 10.0): `main` brought the voice launcher on `/` and `/embed` and the not-ready state of
// the public page. Their behaviour wins, and both live inside the band and the column of the new look.
describe("what main brings, inside the new look (decision 20)", () => {
  it("keeps the voice launcher under the chat on the public page and on the embed", async () => {
    const page = render(await Home());

    expect(within(page.container).getByTestId("voice-launcher")).toBeInTheDocument();
    expect(page.container.querySelector('[data-public="band"]')?.contains(page.getByTestId("voice-launcher"))).toBe(false);
    page.unmount();

    const embed = render(await Embed());

    expect(within(embed.container).getByTestId("voice-launcher")).toBeInTheDocument();
  });

  it("says the assistant is not ready under the band, with the way to the panel and no question box", async () => {
    notReady = true;
    business = workshop;

    const { container } = render(await Home());
    const notice = container.querySelector('[data-cited="not-ready"]') as HTMLElement;

    expect(container.querySelector('[data-public="band"]'), "the band is still there").not.toBeNull();
    expect(notice, "the not-ready panel").not.toBeNull();
    expect(within(notice).getByText(en.notReadyTitle)).toBeInTheDocument();
    expect(within(notice).getByRole("link", { name: en.notReadyPanel })).toHaveAttribute("href", "/admin");
    expect(screen.queryByLabelText(en.question.label)).toBeNull();
  });

  it("is rendered on demand, not prerendered: the answer depends on the settings of every request", async () => {
    const source = readFileSync(resolve(repositoryRoot, "app/page.tsx"), "utf8");

    expect(source).toContain('export const dynamic = "force-dynamic"');
  });
});
