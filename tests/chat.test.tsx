import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Chat, type AskFn } from "@/components/chat/Chat";
import { SESSION_KEY } from "@/lib/chat/session";
import type { AskResult } from "@/lib/chat/client";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import type { Citation } from "@/lib/answer/types";

// Design decision 1 of `openspec/changes/public-page-and-widget/design.md`: one chat component used by `/` and
// `/embed`, with the question box, the list of turns, the citation chips, the refusal style and a loading state in
// words. The answer text of the scenarios is the one the sample corpus and the fake provider produce.

const strings = PUBLIC_STRINGS.en;

const citation: Citation = {
  n: 1,
  document: "cafe-la-horquilla.md",
  heading: "Precios",
  position: 3,
  excerpt: "Afinación de bicicleta: 380 pesos.",
};

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

function askWith(result: AskResult): { ask: AskFn; calls: Array<{ question: string; sessionId: string }> } {
  const calls: Array<{ question: string; sessionId: string }> = [];
  const ask: AskFn = async (input) => {
    calls.push(input);

    return result;
  };

  return { ask, calls };
}

function question(text: string): void {
  fireEvent.change(screen.getByLabelText(strings.question.label), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: strings.question.submit }));
}

describe("the chat of the public page", () => {
  it("shows the welcome message and a labelled question box", () => {
    render(<Chat lang="en" welcome="Ask us anything." storage={new MemoryStorage()} />);

    expect(screen.getByText("Ask us anything.")).toBeInTheDocument();
    expect(screen.getByLabelText(strings.question.label)).toHaveAttribute(
      "placeholder",
      strings.question.placeholder,
    );
    expect(screen.getByRole("button", { name: strings.question.submit })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Español" })).toBeInTheDocument();
  });

  it("says in words that it is looking the answer up", async () => {
    const pending = deferred<AskResult>();
    const ask: AskFn = () => pending.promise;

    render(<Chat lang="en" welcome="Ask us anything." ask={ask} storage={new MemoryStorage()} />);

    question("How much is a tune-up?");

    expect(await screen.findByText(strings.loading)).toBeInTheDocument();

    await act(async () => {
      pending.resolve({ status: "answered", answer: "380 pesos. [1]", citations: [citation] });
    });

    expect(screen.queryByText(strings.loading)).toBeNull();
  });

  it("renders the answer with its citation chip and opens the excerpt, the document and the heading", async () => {
    const { ask } = askWith({
      status: "answered",
      answer: "The tune-up is **380 pesos**. [1]",
      citations: [citation],
    });

    render(<Chat lang="en" welcome="Ask us anything." ask={ask} storage={new MemoryStorage()} />);

    question("How much is a tune-up?");

    const answer = await screen.findByText("380 pesos");

    expect(answer.tagName).toBe("STRONG");
    expect(screen.queryByText(citation.excerpt)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: strings.citation(1) }));

    expect(screen.getByText(citation.excerpt)).toBeInTheDocument();
    expect(screen.getByText(citation.document)).toBeInTheDocument();
    expect(screen.getByText(citation.heading as string)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: strings.close }));

    expect(screen.queryByText(citation.excerpt)).toBeNull();
  });

  it("shows a refusal as a refusal, with no citation chip", async () => {
    const { ask } = askWith({
      status: "refused",
      answer: "I can't find that in this business's documents.",
    });

    render(<Chat lang="en" welcome="Ask us anything." ask={ask} storage={new MemoryStorage()} />);

    question("Do you sell submarines?");

    expect(
      await screen.findByText("I can't find that in this business's documents."),
    ).toBeInTheDocument();
    expect(screen.getByText(strings.refusal)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: strings.citation(1) })).toBeNull();
  });

  it("sends every question of the tab with the same session id", async () => {
    const storage = new MemoryStorage();
    const { ask, calls } = askWith({ status: "refused", answer: "I can't find that." });

    render(<Chat lang="en" welcome="Ask us anything." ask={ask} storage={storage} />);

    question("Do you sell submarines?");
    await waitFor(() => expect(calls).toHaveLength(1));
    question("And do you sell anchors?");
    await waitFor(() => expect(calls).toHaveLength(2));
    question("again");
    await waitFor(() => expect(calls).toHaveLength(3));

    expect(calls).toHaveLength(3);
    expect(calls[0]?.sessionId).toBe(calls[1]?.sessionId);
    expect(calls[1]?.sessionId).toBe(calls[2]?.sessionId);
    expect(storage.getItem(SESSION_KEY)).toBe(calls[0]?.sessionId);
    expect(calls.map((call) => call.question)).toEqual([
      "Do you sell submarines?",
      "And do you sell anchors?",
      "again",
    ]);
  });

  it("keeps the session id the tab already carries, in Spanish too", async () => {
    const storage = new MemoryStorage();

    storage.setItem(SESSION_KEY, "the-thread-of-this-tab");

    const { ask, calls } = askWith({ status: "refused", answer: "No encuentro eso." });

    render(<Chat lang="es" welcome="Pregúntanos." ask={ask} storage={storage} />);

    fireEvent.change(screen.getByLabelText(PUBLIC_STRINGS.es.question.label), {
      target: { value: "¿Venden submarinos?" },
    });
    fireEvent.click(screen.getByRole("button", { name: PUBLIC_STRINGS.es.question.submit }));

    await screen.findByText("No encuentro eso.");

    expect(calls).toEqual([{ question: "¿Venden submarinos?", sessionId: "the-thread-of-this-tab" }]);
    expect(screen.getByText(PUBLIC_STRINGS.es.refusal)).toBeInTheDocument();
  });

  it("shows the message of the server when the request fails", async () => {
    const { ask } = askWith({ status: "failed", message: "the daily limit is reached" });

    render(<Chat lang="en" welcome="Ask us anything." ask={ask} storage={new MemoryStorage()} />);

    question("How much is a tune-up?");

    expect(await screen.findByText("the daily limit is reached")).toBeInTheDocument();
  });

  it("shows its own message when the failure carries none", async () => {
    const { ask } = askWith({ status: "failed", message: null });

    render(<Chat lang="en" welcome="Ask us anything." ask={ask} storage={new MemoryStorage()} />);

    question("How much is a tune-up?");

    expect(await screen.findByText(strings.error)).toBeInTheDocument();
  });

  it("does not ask an empty question", () => {
    const ask = vi.fn<AskFn>(async () => ({ status: "refused", answer: "no" }));

    render(<Chat lang="en" welcome="Ask us anything." ask={ask} storage={new MemoryStorage()} />);

    fireEvent.click(screen.getByRole("button", { name: strings.question.submit }));

    expect(ask).not.toHaveBeenCalled();
  });

  // The requirement "The brand color is seen and the widget closes from inside" of `specs/public-chat/spec.md`: the
  // primary color of the settings paints the ask button and the accents. The page declares `--primary` and
  // `--on-primary` on its `main` (`tests/public-page.test.tsx`) and this test pins that the chat consumes them; the
  // computed color a browser paints is measured in `e2e/public-chat.spec.ts`.
  it("paints the ask button and the accents with the primary color of the settings", async () => {
    const pending = deferred<AskResult>();

    render(
      <Chat
        lang="en"
        welcome="Ask us anything."
        ask={() => pending.promise}
        storage={new MemoryStorage()}
      />,
    );

    const ask = screen.getByRole("button", { name: strings.question.submit });

    expect(ask.className, "the fill of the ask button").toContain("bg-[var(--primary)]");
    expect(ask.className, "the text over the fill").toContain("text-[var(--on-primary)]");

    question("How much is a tune-up?");

    const loading = await screen.findByText(strings.loading);

    expect(loading.className, "the accent of the loading state").toContain(
      "border-[var(--primary)]",
    );

    await act(async () => {
      pending.resolve({ status: "answered", answer: "380 pesos. [1]", citations: [citation] });
    });

    const chip = screen.getByRole("button", { name: strings.citation(1) });

    expect(chip.className, "the accent of the citation chip").toContain(
      "hover:bg-[var(--primary)]",
    );
  });
});

describe("the chat inside the widget", () => {
  const originalParent = Object.getOwnPropertyDescriptor(window, "parent");

  afterEach(() => {
    if (originalParent === undefined) {
      Reflect.deleteProperty(window, "parent");

      return;
    }

    Object.defineProperty(window, "parent", originalParent);
  });

  /** Turns the jsdom window into the window of an iframe, whose parent is the page that carries the widget. */
  function frame(parent: { postMessage: (data: unknown, target: string) => void }): void {
    Object.defineProperty(window, "parent", { configurable: true, get: () => parent });
  }

  it("asks its parent to close when Escape is pressed inside the iframe", () => {
    const posted: Array<{ data: unknown; target: string }> = [];

    frame({
      postMessage: (data, target) => {
        posted.push({ data, target });
      },
    });

    render(<Chat lang="en" welcome="Ask us anything." variant="embed" storage={new MemoryStorage()} />);

    fireEvent.keyDown(document, { key: "Escape" });

    // The protocol the widget of `lib/widget/script.ts` listens to: a message with this shape, and only from the
    // origin of the embed, closes the chat and returns the focus to the button. `e2e/widget.spec.ts` proves the two
    // halves together in a browser.
    expect(posted).toEqual([{ data: { source: "cited-embed", type: "close" }, target: "*" }]);
  });

  it("does not post anything when the chat is the public page", () => {
    const posted: unknown[] = [];

    frame({
      postMessage: (data) => {
        posted.push(data);
      },
    });

    render(<Chat lang="en" welcome="Ask us anything." storage={new MemoryStorage()} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(posted).toEqual([]);
  });

  it("ignores every other key", () => {
    const posted: unknown[] = [];

    frame({
      postMessage: (data) => {
        posted.push(data);
      },
    });

    render(<Chat lang="en" welcome="Ask us anything." variant="embed" storage={new MemoryStorage()} />);

    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.keyDown(document, { key: "a" });

    expect(posted).toEqual([]);
  });
});
