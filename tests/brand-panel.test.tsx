import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "@/app/admin/layout";
import { AdminNav } from "@/components/admin/AdminNav";
import { ConversationsPanel } from "@/components/admin/ConversationsPanel";
import { adminStrings, formatWhen } from "@/lib/i18n/admin";

// Task 3.3 of `openspec/changes/brand-identity-ui` (decisions 7 and 8 of `design.md`, the hooks of decision 17): the panel
// is a workspace with an ink side navigation whose sections are numbered like citations, the sign-in is a split screen with
// the tagline, and the unconfigured page lives in the same shell. What a browser must measure (the ink column at 1440 px,
// the bar that scrolls sideways at 375 px, the contrast, axe) is in `e2e/admin-brand.spec.ts`; this file reads the markup.

let pathname: string | null = "/admin/documents";
let langCookie: string | undefined;
let guarded: { status: string; missing?: string[] } = { status: "ok" };

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "cited-lang" && langCookie !== undefined ? { name, value: langCookie } : undefined),
  }),
}));

vi.mock("@/lib/admin/guard", () => ({
  guardSession: () => guarded,
}));

const english = adminStrings("en");
const spanish = adminStrings("es");

beforeEach(() => {
  pathname = "/admin/documents";
  langCookie = undefined;
  guarded = { status: "ok" };
});

async function layout(children: ReactNode = <p>the page</p>) {
  return render(await AdminLayout({ children, params: Promise.resolve({}) }));
}

function sidebar(): HTMLElement {
  const found = document.querySelector<HTMLElement>('[data-admin="sidebar"]');

  expect(found, 'the element with data-admin="sidebar"').not.toBeNull();

  return found as HTMLElement;
}

describe("the new strings of the panel, in both languages", () => {
  it("tells the tagline of the identity in English and in Spanish", () => {
    expect(english.tagline).toBe("Every answer shows where it came from.");
    expect(spanish.tagline).toBe("Cada respuesta enseña de dónde salió.");
  });

  it("names who built it in both languages, and keeps the two sets of keys equal", () => {
    expect(english.builtBy).toBe("Built by Katalis");
    expect(spanish.builtBy.length).toBeGreaterThan(0);
    expect(Object.keys(english).sort()).toEqual(Object.keys(spanish).sort());
  });
});

describe("the numbered navigation of the panel (decision 7)", () => {
  it("lists the four sections in order, each with its number as a citation mark", () => {
    render(<AdminNav lang="en" strings={english} />);

    const links = within(sidebar()).getAllByRole("link").filter((link) => link.closest("nav") !== null);

    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/admin",
      "/admin/business",
      "/admin/documents",
      "/admin/conversations",
    ]);

    // The same pattern as `e2e/admin-brand.spec.ts`: the number, then the name, with or without a space between them.
    const names = [english.navSetup, english.navBusiness, english.navDocuments, english.navConversations];

    for (const [index, link] of links.entries()) {
      expect(link.textContent ?? "").toMatch(new RegExp(String.raw`^\s*${index + 1}\s*${names[index]}\s*$`));
    }

    for (const link of links) {
      expect(link.querySelector('[data-brand="citation-mark"]'), link.textContent ?? "").not.toBeNull();
    }
  });

  it("marks the current path with aria-current and no other link", () => {
    render(<AdminNav lang="en" strings={english} />);

    const current = sidebar().querySelectorAll('[aria-current="page"]');

    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(english.navDocuments);
    expect(current[0]?.getAttribute("href")).toBe("/admin/documents");
  });

  it("marks the setup only on /admin itself, never on the sections under it", () => {
    pathname = "/admin";
    render(<AdminNav lang="en" strings={english} />);

    const current = sidebar().querySelectorAll('[aria-current="page"]');

    expect(current).toHaveLength(1);
    expect(current[0]?.getAttribute("href")).toBe("/admin");
  });

  it("keeps a section current while the path is below it", () => {
    pathname = "/admin/conversations/some-day";
    render(<AdminNav lang="en" strings={english} />);

    const current = sidebar().querySelectorAll('[aria-current="page"]');

    expect(current).toHaveLength(1);
    expect(current[0]?.getAttribute("href")).toBe("/admin/conversations");
  });

  it("paints the number of the current section as the inverted mark and the others as quiet text", () => {
    render(<AdminNav lang="en" strings={english} />);

    const current = sidebar().querySelector('[aria-current="page"] [data-brand="citation-mark"]');
    const other = sidebar().querySelector('nav a:not([aria-current]) [data-brand="citation-mark"]');

    expect(current?.className).toContain("bg-ink");
    expect(current?.className).toContain("text-lime");
    expect(other?.className).toContain("text-paper/60");
    expect(other?.className).not.toContain("text-lime");
  });

  it("marks nothing when the router has no path yet", () => {
    pathname = null;
    render(<AdminNav lang="en" strings={english} />);

    expect(sidebar().querySelectorAll("[aria-current]")).toHaveLength(0);
  });

  it("names its landmark and keeps the wordmark, which is a link to /admin and never a heading", () => {
    render(<AdminNav lang="en" strings={english} />);

    expect(within(sidebar()).getByRole("navigation", { name: english.panelEyebrow })).toBeInTheDocument();

    const wordmark = sidebar().querySelector('[data-brand="wordmark"]');

    expect(wordmark?.tagName).toBe("A");
    expect(wordmark?.getAttribute("href")).toBe("/admin");
    expect(wordmark).toHaveAccessibleName("Cited");
    expect(within(sidebar()).queryAllByRole("heading")).toHaveLength(0);
  });

  it("has exactly one language switch and one sign-out in the DOM", () => {
    render(<AdminNav lang="en" strings={english} />);

    expect(screen.getAllByTestId("language-switch")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: english.signOut })).toHaveLength(1);
    expect(within(screen.getByTestId("language-switch")).getAllByRole("button")).toHaveLength(2);
  });

  it("ends the column with the silver flame beside who built it", () => {
    render(<AdminNav lang="en" strings={english} />);

    const flame = sidebar().querySelector("img");

    expect(flame?.getAttribute("src")).toBe("/brand/katalis-flame-64.png");
    expect(within(sidebar()).getByText(english.builtBy)).toBeInTheDocument();
  });

  it("speaks Spanish with the same structure", () => {
    render(<AdminNav lang="es" strings={spanish} />);

    expect(within(sidebar()).getByRole("link", { name: new RegExp(spanish.navConversations) })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: spanish.signOut })).toHaveLength(1);
  });

  it("keeps one switch, one sign-out and one h1 inside the whole signed-in layout", async () => {
    await layout(<h1>The page</h1>);

    expect(screen.getAllByTestId("language-switch")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: english.signOut })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("puts the column and the content side by side from 1024 px, with the content in a 960 px column", async () => {
    const { container } = await layout();
    const root = container.firstElementChild as HTMLElement;

    expect(root.className).toContain("lg:grid-cols-[240px_1fr]");
    expect(sidebar().parentElement).toBe(root);
    expect(screen.getByRole("main").className).toContain("max-w-[960px]");
    expect(root.contains(screen.getByRole("main"))).toBe(true);
  });
});

describe("the split sign-in (decision 8)", () => {
  beforeEach(() => {
    guarded = { status: "unauthorized" };
  });

  it("shows the tagline in English with the highlighter on its last three words", async () => {
    await layout();

    const tagline = document.querySelector('[data-admin="tagline"]');

    expect(tagline?.textContent).toBe(english.tagline);
    expect(tagline?.querySelector(".hl")?.textContent).toBe("it came from.");
  });

  it("shows the tagline in Spanish with the highlighter on its last three words", async () => {
    langCookie = "es";
    await layout();

    const tagline = document.querySelector('[data-admin="tagline"]');

    expect(tagline?.textContent).toBe(spanish.tagline);
    expect(tagline?.querySelector(".hl")?.textContent).toBe("de dónde salió.");
  });

  it("keeps the form, its label and its button, under the one h1 of the page", async () => {
    await layout();

    expect(screen.getByLabelText(english.passwordLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: english.signIn })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(english.signInTitle);
  });

  it("carries the wordmark and the flame on the ink half, and no navigation", async () => {
    await layout();

    const shell = document.querySelector<HTMLElement>('[data-admin="auth"]');

    expect(shell, 'the element with data-admin="auth"').not.toBeNull();
    expect(shell?.querySelectorAll('[data-brand="wordmark"]')).toHaveLength(1);
    expect(shell?.querySelector("img")?.getAttribute("src")).toBe("/brand/katalis-flame-64.png");
    expect(within(shell as HTMLElement).getByText(english.builtBy)).toBeInTheDocument();
    expect(document.querySelector('[data-admin="sidebar"]')).toBeNull();
    expect(screen.queryByTestId("language-switch")).toBeNull();
  });

  it("splits in two halves from 1024 px and stacks them below, ink first", async () => {
    await layout();

    const shell = document.querySelector<HTMLElement>('[data-admin="auth"]') as HTMLElement;
    const halves = [...shell.children] as HTMLElement[];

    expect(shell.className).toContain("lg:grid-cols-2");
    expect(halves).toHaveLength(2);
    expect(halves[0]?.className).toContain("bg-ink");
    expect(halves[1]?.className).toContain("bg-paper");
    expect(halves[1]?.querySelector("form")).not.toBeNull();
  });
});

describe("the unconfigured page, in the same shell", () => {
  beforeEach(() => {
    guarded = { status: "unconfigured", missing: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"] };
  });

  it("keeps its heading and names what the server needs", async () => {
    await layout();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(english.unconfiguredTitle);
    expect(screen.getByText(/ADMIN_PASSWORD, ADMIN_SESSION_SECRET/)).toBeInTheDocument();
  });

  it("wears the same split shell as the sign-in, with the wordmark and the tagline", async () => {
    await layout();

    const shell = document.querySelector<HTMLElement>('[data-admin="auth"]');

    expect(shell, 'the element with data-admin="auth"').not.toBeNull();
    expect(shell?.className).toContain("lg:grid-cols-2");
    expect(shell?.querySelectorAll('[data-brand="wordmark"]')).toHaveLength(1);
    expect(document.querySelector('[data-admin="tagline"]')?.textContent).toBe(english.tagline);
    expect(document.querySelector('[data-admin="sidebar"]')).toBeNull();
    expect(document.querySelector("form")).toBeNull();
  });

  it("says it in Spanish too", async () => {
    langCookie = "es";
    await layout();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(spanish.unconfiguredTitle);
    expect(document.querySelector('[data-admin="tagline"]')?.textContent).toBe(spanish.tagline);
  });
});

// Scenario "Dates read like dates" of `specs/admin-panel/spec.md` and decision 19 of `design.md`: the When column prints a
// `time` whose `dateTime` is the stored ISO value and whose text is the date and hour in the language of the panel. The zone
// is explicit, so the text rendered on the server and the text hydrated in the browser are the same.
describe("the dates of the conversations (decision 19)", () => {
  const stored = "2026-09-29T15:49:00.000Z";
  const turn = {
    sessionId: "sesion-a",
    turn: 1,
    question: "¿Cuánto cuesta?",
    answer: "380 pesos [1]",
    status: "answered" as const,
    citations: [1],
    createdAt: stored,
  };

  it("formats a stored value with the medium date and the short hour of the language, in the given zone", () => {
    const expected = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(
      new Date(stored),
    );

    expect(formatWhen(stored, "es", "UTC")).toBe(expected);
    expect(formatWhen(stored, "es", "UTC")).toMatch(/2026/);
    expect(formatWhen(stored, "es", "UTC")).toMatch(/15:49/);
    expect(formatWhen(stored, "es", "UTC")).not.toMatch(/[TZ]/);
    expect(formatWhen(stored, "en", "UTC")).toMatch(/Sep 29, 2026/);
  });

  it("renders the When cell of Spanish as a time element with the ISO value and a date without T or Z", () => {
    render(<ConversationsPanel conversations={[turn]} lang="es" strings={spanish} timeZone="UTC" />);

    const times = document.querySelectorAll("table time");

    expect(times).toHaveLength(1);
    expect(times[0]?.getAttribute("dateTime")).toBe(stored);
    expect(times[0]?.textContent).toBe(formatWhen(stored, "es", "UTC"));
    expect(times[0]?.textContent ?? "").not.toMatch(/[TZ]/);
    expect(screen.queryByText(stored)).toBeNull();
  });
});

// Findings of the review of step 12: on a phone the bar scrolls sideways, so a link reached with Tab has to come into view,
// and the mount must not call `scrollIntoView`, which in Chromium moves the starting point of the sequential focus to the
// current link and makes the first Tab skip the wordmark and the sections before it (WCAG 2.4.3).
describe("the keyboard in the bar that scrolls sideways", () => {
  const measures = ["scrollWidth", "clientWidth", "offsetLeft", "offsetWidth"] as const;
  const saved = measures.map((key) => [key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key)] as const);
  const scrollIntoView = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");

  function measure(values: Record<(typeof measures)[number], number>): void {
    for (const key of measures) {
      Object.defineProperty(HTMLElement.prototype, key, { configurable: true, get: () => values[key] });
    }
  }

  afterEach(() => {
    for (const [key, descriptor] of saved) {
      if (descriptor === undefined) {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
      } else {
        Object.defineProperty(HTMLElement.prototype, key, descriptor);
      }
    }

    if (scrollIntoView === undefined) {
      delete (Element.prototype as unknown as Record<string, unknown>)["scrollIntoView"];
    } else {
      Object.defineProperty(Element.prototype, "scrollIntoView", scrollIntoView);
    }

    vi.restoreAllMocks();
  });

  it("never calls scrollIntoView when it mounts, so the first Tab starts at the top of the page", () => {
    const scrolled = vi.fn();

    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, writable: true, value: scrolled });
    render(<AdminNav lang="en" strings={english} />);

    expect(scrolled).not.toHaveBeenCalled();
  });

  it("scrolls only the list, and only when it overflows, to center the current section", () => {
    measure({ scrollWidth: 600, clientWidth: 375, offsetLeft: 300, offsetWidth: 150 });
    render(<AdminNav lang="en" strings={english} />);

    const nav = within(sidebar()).getByRole("navigation");

    expect(nav.scrollLeft).toBe(300 - (375 - 150) / 2);
  });

  it("leaves the list where it is when every section fits", () => {
    measure({ scrollWidth: 192, clientWidth: 192, offsetLeft: 0, offsetWidth: 150 });
    render(<AdminNav lang="en" strings={english} />);

    expect(within(sidebar()).getByRole("navigation").scrollLeft).toBe(0);
  });

  it("brings a link reached with the keyboard into view, sideways and only as far as needed", () => {
    const scrolled = vi.fn();

    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, writable: true, value: scrolled });
    render(<AdminNav lang="en" strings={english} />);

    const setup = within(sidebar()).getByRole("link", { name: new RegExp(english.navSetup) });

    fireEvent.focus(setup);

    expect(scrolled).toHaveBeenCalledTimes(1);
    expect(scrolled).toHaveBeenCalledWith({ inline: "nearest", block: "nearest" });
    expect(scrolled.mock.contexts[0]).toBe(setup);
  });

  it("keeps a focused link clear of the edges of the list and fades the edges where the list scrolls", () => {
    render(<AdminNav lang="en" strings={english} />);

    const nav = within(sidebar()).getByRole("navigation");

    expect(nav.className).toContain("scroll-px-6");
    expect(nav.className).toMatch(/max-lg:\[mask-image:/);
  });

  it("gives the wordmark a target of 44 px on a phone and 24 px from 1024 px without moving the word", () => {
    render(<AdminNav lang="en" strings={english} />);

    const wordmark = sidebar().querySelector('[data-brand="wordmark"]');
    const classes = (wordmark?.className ?? "").split(/\s+/);

    expect(classes).toEqual(expect.arrayContaining(["py-1", "-my-1", "max-lg:py-3", "max-lg:-my-3"]));
  });
});
