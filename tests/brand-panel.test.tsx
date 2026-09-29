import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminBusiness from "@/app/admin/business/page";
import AdminConversations from "@/app/admin/conversations/page";
import AdminDocuments from "@/app/admin/documents/page";
import AdminLayout from "@/app/admin/layout";
import AdminSetup from "@/app/admin/page";
import { AdminNav } from "@/components/admin/AdminNav";
import { ConversationsPanel } from "@/components/admin/ConversationsPanel";
import { DocumentsPanel } from "@/components/admin/DocumentsPanel";
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

vi.mock("@/lib/store/instance", () => ({
  sharedStore: async () => ({}),
}));

vi.mock("@/lib/admin/documents", () => ({
  documentSummaries: async () => [
    { name: "cafe-la-horquilla.md", type: "md", pages: null, ingestedAt: "2026-09-29T10:00:00.000Z", passages: 4 },
  ],
}));

vi.mock("@/lib/admin/conversations", () => ({
  conversationSummaries: async () => [],
}));

vi.mock("@/lib/settings/business", async (original) => ({
  ...(await original<typeof import("@/lib/settings/business")>()),
  readBusiness: async () => ({
    name: "Café La Horquilla",
    hasLogo: false,
    primaryColor: "#171717",
    tone: "cercano y breve",
    language: "es" as const,
    forbiddenTopics: [],
    welcome: { en: "Welcome", es: "Bienvenido" },
    updatedAt: "2026-09-29T00:00:00.000Z",
  }),
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
  const measures = ["scrollWidth", "clientWidth"] as const;
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

  // The list is 375 px wide with 24 px of padding; the boxes are those of Spanish at 375 px: Configuración 24 to 172, Negocio
  // 176 to 284, Documentos 288 to 426.
  function place(current: { left: number; right: number }): void {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      const box = this.tagName === "NAV" ? { left: 0, right: 375 } : this.getAttribute("aria-current") === "page" ? current : { left: 0, right: 0 };

      return { ...box, top: 0, bottom: 44, x: box.left, y: 0, width: box.right - box.left, height: 44, toJSON: () => box } as DOMRect;
    });
  }

  it("scrolls only the list, and only as far as the current section needs to be whole and clear of the edge", () => {
    measure({ scrollWidth: 600, clientWidth: 375 });
    place({ left: 288, right: 426 });
    render(<AdminNav lang="es" strings={spanish} />);

    expect(within(sidebar()).getByRole("navigation").scrollLeft).toBe(426 + 24 - 375);
  });

  it("stays at the start when the current section already fits there", () => {
    pathname = "/admin/business";
    measure({ scrollWidth: 600, clientWidth: 375 });
    place({ left: 176, right: 284 });
    render(<AdminNav lang="es" strings={spanish} />);

    expect(within(sidebar()).getByRole("navigation").scrollLeft).toBe(0);
  });

  it("leaves the list where it is when every section fits", () => {
    measure({ scrollWidth: 192, clientWidth: 192 });
    place({ left: 288, right: 426 });
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

// Findings of the review of step 12: the sign-in declares its own language like the signed-in branch, the Setup chips are
// the plain kit chip (lime marks a citation, a verified step or the current place, never a value that is merely present),
// and no screen restates the product name or its own title.
describe("the language, the chips and the headings of the panel", () => {
  it("declares the language of the panel on the sign-in shell, in English and in Spanish", async () => {
    guarded = { status: "unauthorized" };
    await layout();
    expect(document.querySelector('[data-admin="auth"]')?.getAttribute("lang")).toBe("en");
  });

  it("declares Spanish on the sign-in shell when the panel speaks Spanish", async () => {
    guarded = { status: "unauthorized" };
    langCookie = "es";
    await layout();
    expect(document.querySelector('[data-admin="auth"]')?.getAttribute("lang")).toBe("es");
  });

  it("declares the language on the unconfigured shell too", async () => {
    guarded = { status: "unconfigured", missing: ["ADMIN_PASSWORD"] };
    langCookie = "es";
    await layout();
    expect(document.querySelector('[data-admin="auth"]')?.getAttribute("lang")).toBe("es");
  });

  it("titles the sign-in plainly, with no eyebrow that repeats the name of the product", async () => {
    guarded = { status: "unauthorized" };
    await layout();

    expect(english.signInTitle).toBe("Sign in to your panel");
    expect(spanish.signInTitle).toBe("Entra a tu panel");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(english.signInTitle);
    expect(screen.queryByText(english.panelEyebrow)).toBeNull();
  });

  it("drops the eyebrow of the unconfigured page", async () => {
    guarded = { status: "unconfigured", missing: ["ADMIN_PASSWORD"] };
    await layout();

    expect(screen.queryByText(english.panelEyebrow)).toBeNull();
  });

  it("paints the Setup chips with the plain kit chip, never lime and never an important override", async () => {
    vi.stubEnv("CHAT_PROVIDER", "fake");
    render(await AdminSetup());
    vi.unstubAllEnvs();

    const chips = screen.getAllByText(new RegExp(`^(${english.configured}|${english.missing})$`));

    expect(chips.some((chip) => chip.textContent === english.configured)).toBe(true);

    for (const chip of chips) {
      expect(chip.className, chip.textContent ?? "").not.toMatch(/lime/);
      expect(chip.className, chip.textContent ?? "").not.toMatch(/!(\s|$)/);
    }
  });

  it("titles every page of the panel once, with no eyebrow above the h1", async () => {
    for (const page of [AdminSetup, AdminBusiness, AdminDocuments, AdminConversations]) {
      const { unmount } = render(await page());

      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(screen.queryByText(english.panelEyebrow)).toBeNull();
      unmount();
    }
  });

  it("keeps the heading inside the Documents and Conversations boxes for the reader of the screen only", async () => {
    for (const [page, title] of [
      [AdminDocuments, english.documentsTitle],
      [AdminConversations, english.conversationsTitle],
    ] as const) {
      const { unmount } = render(await page());
      const inner = screen.getByRole("heading", { level: 2, name: title });

      expect(inner.parentElement?.className).toContain("sr-only");
      unmount();
    }
  });
});

// Finding of the review of step 12: at 375 px the actions column of Documents was cut at the edge of the box and its buttons
// broke at the hyphen ("RE-/INGEST"). The actions now sit under the name of their document, on one line each, and the box is
// a labelled region reachable by keyboard like the one of Conversations, in case a long name still makes it scroll.
describe("the documents table on a phone", () => {
  const listed = [
    { name: "bike-workshop-policies.md", type: "md", pages: null, ingestedAt: "2026-09-29T10:00:00.000Z", passages: 7 },
  ];

  it("puts the two actions under the name of their document, in the same cell, as a named group", () => {
    render(<DocumentsPanel documents={listed} strings={spanish} />);

    const cell = screen.getByText("bike-workshop-policies.md").closest("td") as HTMLElement;
    const group = within(cell).getByRole("group", { name: spanish.actions });

    expect(within(group).getByRole("button", { name: `${spanish.reingestDocument} bike-workshop-policies.md` })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: `${spanish.deleteDocument} bike-workshop-policies.md` })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((head) => head.textContent)).toEqual([
      spanish.documentName,
      spanish.passages,
    ]);
  });

  it("keeps each action on one line and lets a long name wrap anywhere", () => {
    render(<DocumentsPanel documents={listed} strings={english} />);

    for (const button of within(screen.getByRole("table")).getAllByRole("button")) {
      expect(button.className, button.textContent ?? "").toContain("whitespace-nowrap");
    }

    expect(screen.getByText("bike-workshop-policies.md").className).toContain("[overflow-wrap:anywhere]");
  });

  it("makes the box a labelled region reachable by keyboard, like the one of Conversations", () => {
    render(<DocumentsPanel documents={listed} strings={english} />);

    const region = screen.getByRole("region", { name: english.documentsTitle });

    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.className).toContain("overflow-x-auto");
    expect(region.className).toContain("focus-visible:outline-lime");
  });
});
