import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Embed from "@/app/embed/page";
import Home from "@/app/page";
import { Chat, type AskFn } from "@/components/chat/Chat";
import { Markdown } from "@/components/chat/Markdown";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import type { Citation } from "@/lib/answer/types";
import type { AskResult } from "@/lib/chat/client";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import type { Business, Lang } from "@/lib/settings/business";

// Task 10.1 of `openspec/changes/brand-identity-ui/tasks.md`: the tests of decisions 21 to 27 and of the minors that
// decision 33 fixes in this round (the landmarks, the double live region, the 24 px language buttons, the ink focus ring
// on paper), written before the fix. The page is in the language of `lang`; the server never writes to it.

let business: Business | null = null;
let langCookie: string | undefined;

vi.mock("@/lib/settings/business.ts", () => ({
  readBusiness: async () => business,
}));

vi.mock("@/lib/settings/providers.ts", () => ({
  resolveChat: async () => ({ source: "panel", provider: "deepseek", model: "deepseek-flash" }),
  chatProblem: () => null,
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
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.style.scrollPaddingBottom = "";
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

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });

  return { promise, resolve };
}

const bookings: Citation = {
  n: 1,
  document: "bike-workshop-policies.md",
  heading: "Bookings and cancellations",
  position: 1,
  excerpt: "Bookings are confirmed by message. A cancellation is free up to one day before.",
  lead: 0,
};
const storage: Citation = {
  n: 2,
  document: "bike-workshop-policies.md",
  heading: "Storage",
  position: 2,
  excerpt: "A bike can stay in the workshop for three days at no charge.",
  lead: 0,
};
const loose: Citation = {
  n: 3,
  document: "README.txt",
  heading: null,
  position: 0,
  excerpt: "Read me first.",
  lead: 0,
};
const answered: AskResult = {
  status: "answered",
  answer: "A booking is confirmed by message [1] and a bike can wait three days [2].",
  citations: [bookings, storage],
};

function failure(kind: string): AskResult {
  // The old shape (`message`) is carried too, so a page that still prints it fails the tests below instead of passing them.
  return { status: "failed", kind, message: "more than RATE_LIMIT_PER_IP_PER_HOUR (30) questions" } as unknown as AskResult;
}

function chat(result: AskResult | AskFn, lang: Lang = "en", options: { storage?: MemoryStorage | null } = {}) {
  const ask: AskFn = typeof result === "function" ? result : async () => result;

  return render(
    <Chat
      lang={lang}
      welcome="Ask us anything."
      ask={ask}
      storage={options.storage === undefined ? new MemoryStorage() : options.storage}
    />,
  );
}

async function ask(text: string, lang: Lang = "en"): Promise<void> {
  fireEvent.change(screen.getByLabelText(PUBLIC_STRINGS[lang].question.label), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: PUBLIC_STRINGS[lang].question.submit }));
  await act(async () => {
    await Promise.resolve();
  });
}

function errorsOf(lang: Lang): Record<string, string> {
  return (PUBLIC_STRINGS[lang] as unknown as { errors?: Record<string, string> }).errors ?? {};
}

function statusRegions(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[role="status"]')];
}

// Decision 21 of `design.md`.
describe("a failure speaks the language of the visitor (decision 21)", () => {
  for (const lang of ["en", "es"] as const) {
    for (const kind of ["rate_limited", "unavailable", "network"] as const) {
      it(`shows the sentence of ${kind} on the page in ${lang}, announces it once and prints nothing of the server`, async () => {
        const sentence = errorsOf(lang)[kind];

        chat(failure(kind), lang);
        await ask("q", lang);

        expect(sentence, `the sentence of ${kind}`).toBeTypeOf("string");

        const turn = document.querySelector('[data-cited="turn"]') as HTMLElement;

        expect(within(turn).getByText(sentence as string)).toBeInTheDocument();
        expect(document.body.textContent).not.toContain("RATE_LIMIT");

        const announcer = document.querySelector('[data-cited="announcer"]') as HTMLElement;

        expect(announcer.textContent).toBe(PUBLIC_STRINGS[lang].announce.failed(sentence as string));
        expect(statusRegions(), "the announcer is the only live region").toEqual([announcer]);
        expect(turn.textContent?.split(sentence as string).length, "the sentence is written once in the entry").toBe(2);
      });
    }
  }

  it("says nothing of the server on the Spanish page when the route answers 429 with an English developer message", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "rate_limited",
            error: "more than RATE_LIMIT_PER_IP_PER_HOUR (30) questions from this address in an hour",
          }),
          { status: 429, headers: { "content-type": "application/json" } },
        ),
    );

    vi.stubGlobal("fetch", fetchImpl);
    render(<Chat lang="es" welcome="Bienvenido." storage={new MemoryStorage()} />);
    fireEvent.change(screen.getByLabelText(PUBLIC_STRINGS.es.question.label), { target: { value: "¿Qué horario tienen?" } });
    fireEvent.click(screen.getByRole("button", { name: PUBLIC_STRINGS.es.question.submit }));

    await waitFor(() => {
      expect(screen.getByText(errorsOf("es")["rate_limited"] as string)).toBeInTheDocument();
    });
    expect(document.body.textContent).not.toMatch(/RATE_LIMIT|questions from this address|hour/);
  });

  it("keeps no live region on the wait but the announcer, which says the wait once", async () => {
    const pending = deferred<AskResult>();

    chat(() => pending.promise);
    await ask("q");

    const announcer = document.querySelector('[data-cited="announcer"]') as HTMLElement;

    expect(announcer.textContent).toBe(PUBLIC_STRINGS.en.announce.waiting);
    expect(statusRegions(), "the pending entry has no live region of its own").toEqual([announcer]);
    expect(screen.getByText(PUBLIC_STRINGS.en.loading)).toBeInTheDocument();

    await act(async () => {
      pending.resolve(answered);
    });
  });

  it("mounts a new entry when a failed one is asked again, so no node is reused while the answer is awaited", async () => {
    const pending = deferred<AskResult>();
    let calls = 0;

    chat(async () => {
      calls += 1;

      return calls === 1 ? failure("unavailable") : pending.promise;
    });
    await ask("q");

    const failed = document.querySelector('[data-cited="turn"]') as HTMLElement;

    expect(failed, "the failed entry").not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: PUBLIC_STRINGS.en.retry }));
    await act(async () => {
      await Promise.resolve();
    });

    const waiting = document.querySelector('[data-cited="pending"]') as HTMLElement;

    expect(waiting, "the retried entry waits").not.toBeNull();
    expect(waiting, "a new node, not the failed one changed in place").not.toBe(failed);
    expect(failed.isConnected).toBe(false);

    await act(async () => {
      pending.resolve(answered);
    });
  });
});

// Decision 22 of `design.md`.
describe("the session id survives blocked storage (decision 22)", () => {
  it("still ends in an answer when window.sessionStorage throws on every access", async () => {
    const original = Object.getOwnPropertyDescriptor(window, "sessionStorage");

    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new DOMException("Access is denied for this document.", "SecurityError");
      },
    });

    try {
      const calls: string[] = [];

      render(
        <Chat
          lang="en"
          welcome="Ask us anything."
          ask={async (input) => {
            calls.push(input.sessionId);

            return answered;
          }}
        />,
      );
      await ask("q");
      await waitFor(() => {
        expect(document.querySelector('[data-cited="pending"]')).toBeNull();
      });

      expect(calls, "the question was sent").toHaveLength(1);
      expect(calls[0]?.length ?? 0, "with an id").toBeGreaterThan(0);
      expect(document.querySelector('[data-cited="answer"]')).not.toBeNull();
      expect(screen.getByRole("button", { name: PUBLIC_STRINGS.en.question.submit })).toBeEnabled();
    } finally {
      if (original !== undefined) {
        Object.defineProperty(window, "sessionStorage", original);
      }
    }
  });

  it("keeps one id for the tab in memory when the storage fails, question after question", async () => {
    const throwing = {
      getItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
      setItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
    };
    const seen: string[] = [];

    render(
      <Chat
        lang="en"
        welcome="Ask us anything."
        storage={throwing}
        ask={async (input) => {
          seen.push(input.sessionId);

          return answered;
        }}
      />,
    );
    await ask("first");
    await ask("second");
    await waitFor(() => {
      expect(seen).toHaveLength(2);
    });

    expect(seen[0]?.length ?? 0).toBeGreaterThan(0);
    expect(seen[1], "the same conversation").toBe(seen[0]);
  });

  it("lands a failure entry, never a waiting one, when the ask itself throws", async () => {
    chat(async () => {
      throw new Error("boom");
    });
    await ask("q");
    await waitFor(() => {
      expect(document.querySelector('[data-cited="pending"]')).toBeNull();
    });

    expect(screen.getByText(errorsOf("en")["unavailable"] as string)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PUBLIC_STRINGS.en.question.submit })).toBeEnabled();
  });
});

// Decision 23 of `design.md`.
describe("the box in reach, not in the way (decision 23)", () => {
  function matchMedia(matches: boolean): void {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }));
  }

  it("is sticky only from 560 px of viewport height, never as a plain sticky", async () => {
    chat(answered);
    await ask("q");

    const form = document.querySelector('[data-cited="ask"]') as HTMLFormElement;

    expect(form.className).toContain("[@media(min-height:560px)]:sticky");
    expect(form.className.split(/\s+/), "no unconditional sticky").not.toContain("sticky");
  });

  it("reserves the scroll padding only under the same condition", async () => {
    matchMedia(false);
    chat(answered);
    await ask("q");

    expect(document.documentElement.style.scrollPaddingBottom, "a short viewport reserves nothing").toBe("");
  });

  it("reserves the scroll padding when there is room for a sticky box", async () => {
    matchMedia(true);
    chat(answered);
    await ask("q");

    expect(document.documentElement.style.scrollPaddingBottom).not.toBe("");
  });

  it("hides the label of a threaded box on the page too, for the reader of the screen only", async () => {
    chat(answered);
    await ask("q");

    const label = screen.getByText(PUBLIC_STRINGS.en.question.label);

    expect(label.className).toContain("sr-only");
  });

  it("keeps the label visible before the first question", () => {
    chat(answered);

    expect(screen.getByText(PUBLIC_STRINGS.en.question.label).className).not.toContain("sr-only");
  });

  it("puts the field and the button of a threaded box in one row at every width, with the safe-area padding", async () => {
    chat(answered);
    await ask("q");

    const form = document.querySelector('[data-cited="ask"]') as HTMLFormElement;
    const field = screen.getByPlaceholderText(PUBLIC_STRINGS.en.question.placeholder);
    const row = field.parentElement as HTMLElement;
    const button = screen.getByRole("button", { name: PUBLIC_STRINGS.en.question.submit });

    expect(row.contains(button)).toBe(true);
    expect(row.className).toContain("flex-row");
    expect(row.className, "no stacking below 640 px").not.toMatch(/\bflex-col\b/);
    expect(button.className).not.toContain("w-full");
    expect(button.className).toContain("shrink-0");
    expect(form.className).toContain("env(safe-area-inset-bottom)");
  });
});

// Decision 24 of `design.md`.
describe("every page has a title (decision 24), the public ones", () => {
  type Meta = { title?: unknown };

  async function titleOf(module: unknown): Promise<unknown> {
    const generate = (module as { generateMetadata?: () => Promise<Meta> }).generateMetadata;

    expect(generate, "generateMetadata").toBeTypeOf("function");

    return (await generate?.())?.title;
  }

  it("titles / with the name of the business and Cited when there is none", async () => {
    const page = await import("@/app/page");

    expect(await titleOf(page)).toBe("Cited");
    business = workshop;
    expect(await titleOf(page)).toBe("Café La Horquilla");
  });

  it("titles /embed with the name of the business and Cited when there is none", async () => {
    const page = await import("@/app/embed/page");

    expect(await titleOf(page)).toBe("Cited");
    business = workshop;
    expect(await titleOf(page)).toBe("Café La Horquilla");
  });
});

// Decision 25 of `design.md`.
describe("a citation mark sits against its word (decision 25)", () => {
  function paragraph(text: string) {
    const opened: number[] = [];

    render(<Markdown text={text} onCitation={(n) => opened.push(n)} citationLabel={(n) => `Citation ${n}`} />);

    return document.querySelector("p") as HTMLElement;
  }

  it("wraps the last word, the mark and the punctuation that follows in one nowrap span, with no space before the mark", () => {
    const p = paragraph("It costs 50 pesos [1]. Once a day [2].");
    const marks = within(p).getAllByRole("button");

    expect(marks).toHaveLength(2);

    for (const [index, mark] of marks.entries()) {
      const unit = mark.parentElement as HTMLElement;

      expect(unit.tagName, `the unit of mark ${index + 1}`).toBe("SPAN");
      expect(unit.className).toContain("whitespace-nowrap");
      expect(unit.textContent, "word, mark and punctuation with no space").toMatch(/^\S+\d\.$/);
    }

    expect(marks[0]?.parentElement?.textContent).toBe("pesos1.");
    expect(marks[1]?.parentElement?.textContent).toBe("day2.");
    expect(p.textContent).toBe("It costs 50 pesos1. Once a day2.");
  });

  it("gives the mark only the small margin of the design and no mx-1", () => {
    const p = paragraph("It costs 50 pesos [1].");
    const mark = within(p).getByRole("button");

    expect(mark.className).toContain("ms-[0.15em]");
    expect(mark.className).not.toMatch(/\bmx-1\b/);
  });

  it("keeps two marks that follow one word in the same unit", () => {
    const p = paragraph("Both agree [1][2] on this.");
    const [one, two] = within(p).getAllByRole("button");

    expect(one?.parentElement, "one unit").toBe(two?.parentElement);
    expect(one?.parentElement?.textContent).toBe("agree12");
  });

  it("leaves a mark that opens a paragraph alone", () => {
    const p = paragraph("[1] says so.");

    expect(within(p).getByRole("button")).toBeInTheDocument();
    expect(p.textContent).toBe("1 says so.");
  });
});

// Decision 26 of `design.md`.
describe("the sources name the passage (decision 26)", () => {
  const three: AskResult = {
    status: "answered",
    answer: "One [1], two [2], three [3].",
    citations: [bookings, storage, loose],
  };

  it("names each source by its heading first and its document second, and the button [n] heading, document", async () => {
    chat(three);
    await ask("q");

    const sources = document.querySelector('[data-cited="sources"]') as HTMLElement;

    expect(within(sources).getByRole("button", { name: "[1] Bookings and cancellations, bike-workshop-policies.md" })).toBeInTheDocument();
    expect(within(sources).getByRole("button", { name: "[2] Storage, bike-workshop-policies.md" })).toBeInTheDocument();

    const rows = [...sources.querySelectorAll("li")];

    expect(rows[0]?.textContent).toContain("Bookings and cancellations");
    expect(rows[0]?.querySelector(".text-xs.text-ink-2")?.textContent, "the document on a second line").toBe("bike-workshop-policies.md");
    expect(rows[1]?.querySelector(".text-xs.text-ink-2")?.textContent).toBe("bike-workshop-policies.md");
  });

  it("falls back to the document as the first line and hides the second line when it would repeat it", async () => {
    chat(three);
    await ask("q");

    const sources = document.querySelector('[data-cited="sources"]') as HTMLElement;
    const row = [...sources.querySelectorAll("li")][2] as HTMLElement;

    expect(within(row).getByRole("button", { name: "[3] README.txt" })).toBeInTheDocument();
    expect(row.querySelector(".text-xs"), "no repeated second line").toBeNull();
    expect(row.textContent?.match(/README\.txt/g)?.length, "the visible document once, plus the name for the reader of the screen").toBeLessThanOrEqual(2);
  });
});

// The minors of decision 33: the landmarks of the public page.
describe("the landmarks of the public page (decision 33)", () => {
  it("lists the sources in a group named Sources, not in a complementary landmark, inside the entry", async () => {
    chat(answered);
    await ask("q");

    const sources = document.querySelector('[data-cited="sources"]') as HTMLElement;

    expect(sources.tagName).not.toBe("ASIDE");
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.getByRole("group", { name: PUBLIC_STRINGS.en.sources })).toBe(sources);
  });

  it("names the section of the conversation and its list differently, or leaves the list unnamed", async () => {
    chat(answered);
    await ask("q");

    const section = document.querySelector("section") as HTMLElement;
    const list = document.querySelector("ol") as HTMLElement;

    expect(section.getAttribute("aria-label")).toBe(PUBLIC_STRINGS.en.history);
    expect(list.getAttribute("aria-label")).not.toBe(section.getAttribute("aria-label"));
  });

  it("keeps the band and the footer outside main, so the page has a banner and a contentinfo", async () => {
    const { container } = render(await Home());
    const main = container.querySelector("main") as HTMLElement;
    const band = container.querySelector('[data-public="band"]') as HTMLElement;
    const footer = container.querySelector("footer") as HTMLElement;

    expect(band.tagName).toBe("HEADER");
    expect(main.contains(band), "the band is not inside main").toBe(false);
    expect(main.contains(footer), "the footer is not inside main").toBe(false);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("banner")).toBe(band);
    expect(screen.getByRole("contentinfo")).toBe(footer);
    expect(screen.getAllByRole("heading", { level: 1 }), "one h1").toHaveLength(1);
  });

  it("keeps the same landmarks on the embed", async () => {
    const { container } = render(await Embed());
    const main = container.querySelector("main") as HTMLElement;
    const band = container.querySelector('[data-public="band"]') as HTMLElement;

    expect(main.contains(band)).toBe(false);
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("marks the flame of the footer as decoration: the words beside it say Katalis", async () => {
    const { container } = render(await Home());
    const flame = container.querySelector("footer img[src*='katalis-flame']") as HTMLImageElement;

    expect(flame, "the flame").not.toBeNull();
    expect(flame.getAttribute("alt")).toBe("");
  });
});

// Decision 27 of `design.md`.
describe("the footer names Cited and the box has a neutral placeholder (decision 27)", () => {
  it("shows the small wordmark, Answers by Cited, a middot and the flame with Built by Katalis on one text-sm row", async () => {
    business = workshop;

    const { container } = render(await Home());
    const footer = container.querySelector("footer") as HTMLElement;
    const wordmark = footer.querySelector('[data-brand="wordmark"]') as HTMLElement;

    expect(wordmark, "the small wordmark").not.toBeNull();
    expect(wordmark.className, "sm").toContain("text-[20px]");
    expect(footer.textContent).toContain("Answers by Cited");
    expect(footer.textContent).toContain("·");
    expect(footer.textContent).toContain("Built by Katalis");
    expect(footer.querySelector("img[src*='katalis-flame']")).not.toBeNull();
    expect(footer.className).toContain("text-sm");
    expect((PUBLIC_STRINGS.en as unknown as { answersBy?: string }).answersBy).toBe("Answers by Cited");
  });

  it("says Respuestas de Cited and Hecho por Katalis on the Spanish page", async () => {
    langCookie = "es";
    business = workshop;

    const { container } = render(await Home());
    const footer = container.querySelector("footer") as HTMLElement;

    expect(footer.textContent).toContain("Respuestas de Cited");
    expect(footer.textContent).toContain("Hecho por Katalis");
    expect(footer.textContent).not.toContain("Answers by");
  });

  it("keeps a neutral placeholder: no bicycle question leaves the product", () => {
    expect(PUBLIC_STRINGS.en.question.placeholder).toBe("Type your question");
    expect(PUBLIC_STRINGS.es.question.placeholder).toBe("Escribe tu pregunta");
    expect(JSON.stringify(PUBLIC_STRINGS)).not.toMatch(/bicycle|bicicleta/i);
  });
});

// The minors that decision 33 fixes in the files this round touches.
describe("the small states of the ledger (decision 33)", () => {
  it("does not paint the mark of an open source in the color of the business under the pointer", async () => {
    chat(answered);
    await ask("q");

    const sources = document.querySelector('[data-cited="sources"]') as HTMLElement;
    const rest = within(sources).getByRole("button", { name: /^\[1\]/ });
    const restMark = rest.querySelector('[data-brand="citation-mark"]') as HTMLElement;

    expect(restMark.className, "a mark at rest takes the color of the business on hover").toContain("group-hover:bg-[var(--primary)]");

    fireEvent.click(rest);

    const open = within(sources).getByRole("button", { name: /^\[1\]/ });
    const openMark = open.querySelector('[data-brand="citation-mark"]') as HTMLElement;

    expect(open).toHaveAttribute("aria-expanded", "true");
    expect(openMark.className, "an open mark stays ink").not.toContain("group-hover:");
  });

  it("lands the marks of an earlier entry that was asked again and answered in place", async () => {
    let calls = 0;

    chat(async () => {
      calls += 1;

      return calls === 1 ? failure("unavailable") : answered;
    });
    await ask("first");
    await ask("second");
    // The first entry failed and the second one answered; the first is asked again from its button and lands in place.
    const retry = screen.getAllByRole("button", { name: PUBLIC_STRINGS.en.retry })[0] as HTMLElement;

    fireEvent.click(retry);
    await act(async () => {
      await Promise.resolve();
    });

    const marks = screen.getAllByRole("button", { name: PUBLIC_STRINGS.en.citation(1) });

    expect(marks[0]?.className, "the entry that landed, though it is not the last").toContain("mark-land");
  });

  it("brings a new note in and sweeps a new passage when the other citation of the entry is chosen", async () => {
    chat(answered);
    await ask("q");

    fireEvent.click(screen.getByRole("button", { name: PUBLIC_STRINGS.en.citation(1) }));

    const first = document.querySelector('[data-cited="citation"]') as HTMLElement;

    expect(first.textContent).toContain("Bookings are confirmed by message.");

    fireEvent.click(screen.getByRole("button", { name: PUBLIC_STRINGS.en.citation(2) }));

    const next = document.querySelector('[data-cited="citation"]') as HTMLElement;

    expect(next.textContent).toContain("A bike can stay in the workshop");
    expect(next, "a new node, so the note enters and the highlighter sweeps again").not.toBe(first);
  });

  it("moves at most two marks at once: only the first two marks of an answer land", async () => {
    chat({
      status: "answered",
      answer: "One [1], two [2], three [3], four [4].",
      citations: [bookings, storage, loose, { ...loose, n: 4 }],
    });
    await ask("q");

    const landing = screen.getAllByRole("button", { name: /^Citation \d$/ }).filter((mark) => mark.className.includes("mark-land"));

    expect(landing.map((mark) => mark.textContent)).toEqual(["1", "2"]);
  });
});

// The minors of decision 33 that live in the kit: the 24 px language buttons and the ink focus ring on paper.
describe("the language buttons and the focus ring (decision 33)", () => {
  it("gives the buttons of the switch 24 px of height at every width, and 44 px on a phone", () => {
    for (const tone of ["paper", "ink", "brand"] as const) {
      const { unmount } = render(<LanguageSwitch current="en" tone={tone} reload={() => {}} />);

      for (const button of screen.getAllByRole("button")) {
        expect(button.className, tone).toMatch(/(^|\s)min-h-6(\s|$)/);
        expect(button.className, tone).toContain("max-lg:min-h-11");
      }

      unmount();
    }
  });

  it("draws the focus of a control on paper with an ink outline and a lime ring inside it", async () => {
    const { focusRing } = await import("@/components/ui");

    expect(focusRing).toContain("focus-visible:outline-ink");
    expect(focusRing).toContain("focus-visible:ring-lime");
    expect(focusRing).not.toContain("focus-visible:outline-lime");
  });

  it("keeps the lime outline on ink and the color of the text on the band of the business", async () => {
    const ink = render(<LanguageSwitch current="en" tone="ink" reload={() => {}} />);

    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toContain("focus-visible:outline-lime");
    }

    ink.unmount();
    render(<LanguageSwitch current="en" tone="brand" reload={() => {}} />);

    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toContain("focus-visible:outline-current");
      expect(button.className).not.toContain("focus-visible:outline-lime");
    }
  });
});
