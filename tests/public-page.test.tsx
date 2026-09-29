import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RootLayout from "@/app/layout";
import Home from "@/app/page";
import { DEFAULT_PRIMARY, LIME } from "@/lib/theme/primary";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import type { Business } from "@/lib/settings/business";

// The public page of `specs/app-skeleton/spec.md` (MODIFIED: the page is now the chat) and of the requirement "The
// public page speaks English first" of `specs/public-chat/spec.md`.
//
// Design decision 8 of the change: `lib/settings/business.ts` belongs to the parallel lane
// `admin-panel-and-onboarding`, which is building the administration panel in the other worktree. This lane writes
// only a stand-in with the same interface, and its tests mock that module, which is what happens here: the page is
// rendered against a business that the test decides.

let business: Business | null = null;
let langCookie: string | undefined;
let notReady = false;

vi.mock("@/lib/settings/business.ts", () => ({
  readBusiness: async () => business,
}));

// The scenario "Nothing configured anywhere" of `specs/answering/spec.md`: the page asks the resolver whether the
// assistant is ready, and the test decides the answer instead of opening a store.
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
  language: "es",
  forbiddenTopics: [],
  welcome: { en: "Ask us anything.", es: "Pregúntanos lo que quieras." },
  updatedAt: "2026-09-29T00:00:00.000Z",
};

beforeEach(() => {
  business = null;
  langCookie = undefined;
  notReady = false;
});

describe("the public page", () => {
  it("names the product when no business setting exists yet", async () => {
    render(await Home());

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Cited");
    expect(screen.getByLabelText(PUBLIC_STRINGS.en.question.label)).toBeInTheDocument();
    expect(screen.getByText(PUBLIC_STRINGS.en.welcome)).toBeInTheDocument();
    expect(screen.getByText(PUBLIC_STRINGS.en.footer)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Katalis" })).toHaveAttribute(
      "src",
      "/brand/katalis-flame-ink-64.png",
    );
  });

  it("opens in English although the browser prefers Spanish", async () => {
    Object.defineProperty(window.navigator, "language", { value: "es-MX", configurable: true });

    business = { ...workshop, language: "en", welcome: { en: "Ask us anything.", es: "" } };

    render(await Home());

    expect(screen.getByLabelText(PUBLIC_STRINGS.en.question.label)).toBeInTheDocument();
    expect(screen.getByText("Ask us anything.")).toBeInTheDocument();
    expect(screen.queryByLabelText(PUBLIC_STRINGS.es.question.label)).toBeNull();
  });

  it("carries the name, the primary color and the welcome of the business", async () => {
    business = workshop;

    const { container } = render(await Home());
    const main = container.querySelector("main");
    const ask = screen.getByRole("button", { name: PUBLIC_STRINGS.es.question.submit });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Café La Horquilla");
    expect(screen.getByLabelText(PUBLIC_STRINGS.es.question.label)).toBeInTheDocument();
    expect(screen.getByText("Pregúntanos lo que quieras.")).toBeInTheDocument();
    expect(main?.style.getPropertyValue("--primary")).toBe("#1d4ed8");
    expect(main?.getAttribute("lang")).toBe("es");
    // The requirement "The brand color is seen and the widget closes from inside": the color of the settings has to
    // reach the ask button and not stay in a variable nobody reads. The fixture is the one the review used.
    expect(ask.className, "the ask button takes the fill of the settings").toContain(
      "bg-[var(--primary)]",
    );
    expect(ask.className, "and the text that is legible over it").toContain(
      "text-[var(--on-primary)]",
    );
  });

  it("falls back to lime when the primary color fails AA", async () => {
    business = { ...workshop, primaryColor: "#7c7c7c" };

    const { container } = render(await Home());

    expect(container.querySelector("main")?.style.getPropertyValue("--primary")).toBe(
      DEFAULT_PRIMARY,
    );
    expect(DEFAULT_PRIMARY).toBe(LIME);
  });

  it("shows the welcome of the chosen language and falls back to the other when it is empty", async () => {
    business = { ...workshop, welcome: { en: "Ask us anything.", es: "" } };
    langCookie = "es";

    render(await Home());

    expect(screen.getByText("Ask us anything.")).toBeInTheDocument();
    expect(screen.getByLabelText(PUBLIC_STRINGS.es.question.label)).toBeInTheDocument();
  });

  it("shows the logo the panel serves when the business has one", async () => {
    business = { ...workshop, hasLogo: true };

    render(await Home());

    expect(screen.getByRole("img", { name: "Café La Horquilla" })).toHaveAttribute(
      "src",
      "/api/brand/logo",
    );
  });

  it("lets the cookie decide over the language of the business", async () => {
    business = workshop;
    langCookie = "en";

    render(await Home());

    expect(screen.getByLabelText(PUBLIC_STRINGS.en.question.label)).toBeInTheDocument();
    expect(screen.getByText("Ask us anything.")).toBeInTheDocument();
  });

  it("says the assistant is not ready when nobody connected a chat provider", async () => {
    notReady = true;
    business = workshop;

    render(await Home());

    expect(screen.getByText(PUBLIC_STRINGS.es.notReadyTitle)).toBeInTheDocument();
    expect(screen.getByText(PUBLIC_STRINGS.es.notReadyBody)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: PUBLIC_STRINGS.es.notReadyPanel })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(screen.queryByLabelText(PUBLIC_STRINGS.es.question.label)).toBeNull();
  });
});

describe("the document of the page", () => {
  const layout = async (): Promise<ReactElement<{ lang: string }>> =>
    (await RootLayout({
      children: null,
      params: Promise.resolve({}),
    })) as ReactElement<{ lang: string }>;

  it("declares English when nothing else is chosen", async () => {
    expect((await layout()).props.lang).toBe("en");
  });

  it("declares the language the visitor chose", async () => {
    langCookie = "es";

    expect((await layout()).props.lang).toBe("es");
  });

  it("declares the language of the business when the visitor chose nothing", async () => {
    business = workshop;

    expect((await layout()).props.lang).toBe("es");
  });
});
