import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "@/app/admin/layout";
import AdminSetup from "@/app/admin/page";
import { ConversationsPanel } from "@/components/admin/ConversationsPanel";
import { DocumentsPanel } from "@/components/admin/DocumentsPanel";
import { TestButton } from "@/components/admin/TestButton";
import { Wordmark } from "@/components/brand";
import type { ConversationSummary } from "@/lib/admin/conversations";
import { exampleText, setupGroups } from "@/lib/admin/setup";
import { adminStrings } from "@/lib/i18n/admin";
import { SETUP_GROUPS } from "@/lib/i18n/setup-groups";
import type { Lang } from "@/lib/settings/business";

// Task 10.1 of `openspec/changes/brand-identity-ui/tasks.md`: the tests of decisions 24, 28 and 29 of `design.md` (a title
// for every page of the panel, a delete that asks first and inline, the Spanish panel whole) and of the minors that decision
// 33 fixes in this round (the landmark of the column, the tab stop of a box that does not scroll, the promise of the
// Conversations intro). Written before the fix: each is red until its decision lands.

let langCookie: string | undefined;
let guarded: { status: string; missing?: string[] } = { status: "ok" };

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/documents",
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
  sharedStore: async () => ({ readVoiceAgent: async () => null }),
}));

vi.mock("@/lib/admin/documents", () => ({ documentSummaries: async () => [] }));
vi.mock("@/lib/admin/conversations", () => ({ conversationSummaries: async () => [] }));

vi.mock("@/lib/settings/business", async (original) => ({
  ...(await original<typeof import("@/lib/settings/business")>()),
  readBusiness: async () => null,
}));

const english = adminStrings("en");
const spanish = adminStrings("es");

type Meta = { title?: unknown };
type PageModule = { generateMetadata?: () => Promise<Meta> };

beforeEach(() => {
  langCookie = undefined;
  guarded = { status: "ok" };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Decision 24 of `design.md`.
describe("every page of the panel has a title in the language of the panel (decision 24)", () => {
  const pages = [
    { name: "the setup", load: () => import("@/app/admin/page"), en: "For the installer · Cited", es: undefined },
    { name: "the business", load: () => import("@/app/admin/business/page"), en: "Business · Cited", es: "Negocio · Cited" },
    { name: "the documents", load: () => import("@/app/admin/documents/page"), en: "Documents · Cited", es: "Documentos · Cited" },
    {
      name: "the conversations",
      load: () => import("@/app/admin/conversations/page"),
      en: "Conversations · Cited",
      es: "Conversaciones · Cited",
    },
    { name: "AI and keys", load: () => import("@/app/admin/ai/page"), en: "AI and keys · Cited", es: "IA y llaves · Cited" },
  ] as const;

  async function titleOf(load: () => Promise<unknown>): Promise<unknown> {
    const generate = ((await load()) as PageModule).generateMetadata;

    expect(generate, "generateMetadata").toBeTypeOf("function");

    return (await generate?.())?.title;
  }

  for (const page of pages) {
    it(`titles ${page.name} in English and in Spanish`, async () => {
      expect(await titleOf(page.load)).toBe(page.en);

      langCookie = "es";
      expect(await titleOf(page.load)).toBe(page.es ?? `${spanish.navSetup} · Cited`);
    });
  }

  it("titles the sign-in of every page with its own words while nobody is signed in", async () => {
    guarded = { status: "unauthorized" };

    for (const page of pages) {
      langCookie = undefined;
      expect(await titleOf(page.load), `${page.name}, English`).toBe("Sign in · Cited");
      langCookie = "es";
      expect(await titleOf(page.load), `${page.name}, Spanish`).toBe("Iniciar sesión · Cited");
    }
  });

  it("gives no two pages the same title", async () => {
    const titles = await Promise.all(pages.map((page) => titleOf(page.load)));

    expect(new Set(titles).size).toBe(pages.length);
  });
});

// Decision 28 of `design.md`.
describe("a delete asks first, inline (decision 28)", () => {
  const listed = [
    { name: "README.txt", type: "txt", pages: null, ingestedAt: "2026-09-29T10:00:00.000Z", passages: 2 },
    { name: "menu.md", type: "md", pages: null, ingestedAt: "2026-09-29T10:00:00.000Z", passages: 5 },
  ];

  function answer(body: unknown) {
    return vi.fn(async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));
  }

  it("swaps the button of a document for a group with a sentence, Delete and Keep, and moves the focus to Keep", () => {
    const fetchImpl = answer({ status: "deleted", documents: [] });

    vi.stubGlobal("fetch", fetchImpl);
    render(<DocumentsPanel documents={listed} strings={english} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete README.txt" }));

    const group = screen.getByRole("group", { name: "Delete README.txt?" });
    const confirm = within(group).getByRole("button", { name: "Delete" });
    const keep = within(group).getByRole("button", { name: "Keep" });

    expect(fetchImpl, "nothing is deleted on the first press").not.toHaveBeenCalled();
    expect(confirm.className, "the primary button").toContain("bg-ink");
    expect(keep.className, "the secondary button").toContain("bg-paper");
    expect(document.activeElement, "the focus is on Keep").toBe(keep);
    expect(screen.queryByRole("dialog"), "no modal").toBeNull();
    expect(screen.queryByRole("button", { name: "Delete README.txt" }), "the first button left").toBeNull();
    expect(screen.getByRole("button", { name: "Delete menu.md" }), "the other rows are untouched").toBeInTheDocument();
  });

  it("deletes only on the second press, with the same request as before", async () => {
    const fetchImpl = answer({ status: "deleted", documents: [listed[1]] });

    vi.stubGlobal("fetch", fetchImpl);
    render(<DocumentsPanel documents={listed} strings={english} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete README.txt" }));
    fireEvent.click(within(screen.getByRole("group", { name: "Delete README.txt?" })).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe("/api/admin/documents/delete");
    expect(JSON.parse(String(init.body))).toEqual({ name: "README.txt" });
    await waitFor(() => {
      expect(screen.queryByText("README.txt")).toBeNull();
    });
  });

  it("keeps the document with Keep or with Escape, gives the focus back to the first button and sends nothing", () => {
    const fetchImpl = answer({ status: "deleted", documents: [] });

    vi.stubGlobal("fetch", fetchImpl);
    render(<DocumentsPanel documents={listed} strings={english} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete README.txt" }));
    fireEvent.click(within(screen.getByRole("group", { name: "Delete README.txt?" })).getByRole("button", { name: "Keep" }));

    expect(screen.queryByRole("group", { name: "Delete README.txt?" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Delete README.txt" }));

    fireEvent.click(screen.getByRole("button", { name: "Delete README.txt" }));
    fireEvent.keyDown(screen.getByRole("group", { name: "Delete README.txt?" }), { key: "Escape" });

    expect(screen.queryByRole("group", { name: "Delete README.txt?" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Delete README.txt" }));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("asks in Spanish with Borrar and Conservar", () => {
    vi.stubGlobal("fetch", answer({ status: "deleted", documents: [] }));
    render(<DocumentsPanel documents={listed} strings={spanish} />);
    fireEvent.click(screen.getByRole("button", { name: "Borrar README.txt" }));

    const group = screen.getByRole("group", { name: "¿Borrar README.txt?" });

    expect(within(group).getByRole("button", { name: "Borrar" })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: "Conservar" })).toBeInTheDocument();
  });

  const turns: ConversationSummary[] = [
    {
      sessionId: "s1",
      turn: 1,
      question: "What time do you open?",
      answer: "At nine. [1]",
      status: "answered",
      citations: [1],
      createdAt: "2026-09-29T10:00:00.000Z",
    },
  ];

  function conversations(strings: typeof english, lang: Lang) {
    return render(<ConversationsPanel strings={strings} conversations={turns} lang={lang} timeZone="UTC" />);
  }

  it("asks before Delete all, keeps on Keep or Escape and deletes on the second press", async () => {
    const fetchImpl = answer({ status: "deleted", conversations: [] });

    vi.stubGlobal("fetch", fetchImpl);
    conversations(english, "en");
    fireEvent.click(screen.getByRole("button", { name: "Delete all" }));

    const group = screen.getByRole("group", { name: "Delete all conversations?" });
    const keep = within(group).getByRole("button", { name: "Keep" });

    expect(fetchImpl, "nothing is deleted on the first press").not.toHaveBeenCalled();
    expect(document.activeElement).toBe(keep);
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.keyDown(group, { key: "Escape" });
    expect(screen.queryByRole("group", { name: "Delete all conversations?" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Delete all" }));
    expect(fetchImpl).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete all" }));
    fireEvent.click(within(screen.getByRole("group", { name: "Delete all conversations?" })).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });
    expect((fetchImpl.mock.calls[0] as unknown as [string])[0]).toBe("/api/admin/conversations/delete");
  });

  it("asks in Spanish before Borrar todas", () => {
    vi.stubGlobal("fetch", answer({ status: "deleted", conversations: [] }));
    conversations(spanish, "es");
    fireEvent.click(screen.getByRole("button", { name: "Borrar todas" }));

    expect(screen.getByRole("group", { name: "¿Borrar todas las conversaciones?" })).toBeInTheDocument();
  });
});

// Decision 29 of `design.md`.
describe("the Spanish panel is whole (decision 29)", () => {
  function table(lang: Lang): Record<string, { title?: string; detail?: string }> {
    return SETUP_GROUPS[lang];
  }

  function idsOfTheTemplate(): string[] {
    return setupGroups(exampleText(), {}).map((group) => (group as unknown as { id?: string }).id ?? "");
  }

  it("gives every group of the template a stable id and a title and a detail in both languages", () => {
    const ids = idsOfTheTemplate();

    expect(ids.length).toBeGreaterThan(5);
    expect(ids.every((id) => id.length > 0), "an id for every group").toBe(true);
    expect(new Set(ids).size, "no two groups share an id").toBe(ids.length);

    for (const id of ids) {
      for (const lang of ["en", "es"] as const) {
        expect(table(lang)[id]?.title?.length ?? 0, `${lang} title of ${id}`).toBeGreaterThan(0);
        expect(table(lang)[id]?.detail?.length ?? 0, `${lang} detail of ${id}`).toBeGreaterThan(0);
      }

      expect(table("es")[id]?.title, `the Spanish title of ${id} is not the English one`).not.toBe(table("en")[id]?.title);
    }
  });

  it("marks the required group with a flag of its own, so the fold never compares an English word", () => {
    const groups = setupGroups(exampleText(), {}) as unknown as Array<{ id?: string; required?: boolean }>;

    expect(groups.filter((group) => group.required === true).map((group) => group.id)).toEqual(["required"]);
  });

  it("prints no title and no detail of the English template on the Spanish Setup, and keeps only the required group open", async () => {
    langCookie = "es";
    vi.stubEnv("CHAT_PROVIDER", "fake");
    render(await AdminSetup());
    vi.unstubAllEnvs();

    const groups = [...document.querySelectorAll<HTMLElement>('[data-admin="setup-group"]')];
    const template = setupGroups(exampleText(), {});

    expect(groups).toHaveLength(template.length);

    for (const [index, group] of groups.entries()) {
      const title = within(group).getByRole("heading", { level: 2 }).textContent ?? "";
      const detail = template[index]?.detail.slice(0, 40) ?? "";

      expect(title, `the title of group ${index + 1}`).not.toBe(template[index]?.title);

      if (detail.length > 0) {
        expect(group.textContent, `the detail of group ${index + 1}`).not.toContain(detail);
      }

      expect(group.querySelector("details") === null, `group ${index + 1} is open only when it is the required one`).toBe(index === 0);
    }
  });

  function stubTest(check: unknown | Error) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        if (check instanceof Error) {
          throw check;
        }

        return new Response(JSON.stringify(check), { status: 200, headers: { "content-type": "application/json" } });
      }),
    );
  }

  async function press(strings: typeof english, target: "chat" | "embeddings"): Promise<HTMLElement> {
    render(<TestButton strings={strings} target={target} />);
    fireEvent.click(screen.getByRole("button"));

    return await waitFor(() => {
      const result = document.querySelector<HTMLElement>('[role="status"], [role="alert"]');

      expect(result, "the result of the test").not.toBeNull();

      return result as HTMLElement;
    });
  }

  it("says a provider test passed in Spanish, with the name of the provider and none of the words of the server", async () => {
    langCookie = "es";
    stubTest({ status: "ok", target: "chat", detail: "the model answered NO_ANSWER" });

    const result = await press(spanish, "chat");

    expect(result.textContent).toMatch(/respondió/i);
    expect(result.textContent).toMatch(/chat/i);
    expect(result.textContent).not.toMatch(/NO_ANSWER|the model answered/);
  });

  it("says a provider test failed in Spanish and prints nothing of what the server wrote", async () => {
    stubTest({ status: "error", target: "embeddings", detail: "OPENAI_API_KEY is missing: the provider answered 401" });

    const result = await press(spanish, "embeddings");

    expect(result.textContent).toMatch(/no respondió/i);
    expect(result.textContent).not.toMatch(/OPENAI_API_KEY|401|missing|the provider answered/);
    expect(result.getAttribute("role")).toBe("alert");
  });

  it("says the same in English, in the words of the panel", async () => {
    stubTest({ status: "ok", target: "chat", detail: "the model answered NO_ANSWER" });

    const ok = await press(english, "chat");

    expect(ok.textContent).toMatch(/answered/i);
    expect(ok.textContent).not.toMatch(/NO_ANSWER/);
  });

  it("says a failed request as a failed test, not as a business that could not be saved", async () => {
    stubTest(new TypeError("Failed to fetch"));

    const result = await press(spanish, "chat");

    expect(result.textContent).toMatch(/no respondió/i);
    expect(result.textContent).not.toBe(spanish.saveFailed);
  });
});

// The minors of decision 33 that live in the panel.
describe("the landmarks and the tab stops of the panel (decision 33)", () => {
  it("draws the column of the panel as a plain element, not as a complementary landmark, keeping the navigation", async () => {
    render(await AdminLayout({ children: <p>the page</p>, params: Promise.resolve({}) }));

    const sidebar = document.querySelector('[data-admin="sidebar"]') as HTMLElement;

    expect(sidebar, "the column").not.toBeNull();
    expect(sidebar.tagName).not.toBe("ASIDE");
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(within(sidebar).getByRole("navigation", { name: english.panelEyebrow })).toBeInTheDocument();
  });

  it("gives the focus ring of the wordmark on ink its lime outline, and the ink one on paper", () => {
    const { unmount } = render(<Wordmark size="sm" tone="ink" href="/admin" />);

    expect(document.querySelector('[data-brand="wordmark"]')?.className).toContain("focus-visible:outline-lime");
    unmount();
    render(<Wordmark size="sm" tone="paper" href="/" />);
    expect(document.querySelector('[data-brand="wordmark"]')?.className).toContain("focus-visible:outline-ink");
  });

  // jsdom has no layout: the widths the box would have are stubbed on `Element`, where jsdom defines them.
  function overflowing(does: boolean): void {
    vi.spyOn(Element.prototype, "scrollWidth", "get").mockReturnValue(does ? 900 : 300);
    vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(300);
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const listed = [{ name: "README.txt", type: "txt", pages: null, ingestedAt: "2026-09-29T10:00:00.000Z", passages: 2 }];
  const turns: ConversationSummary[] = [
    {
      sessionId: "s1",
      turn: 1,
      question: "What time do you open?",
      answer: "At nine. [1]",
      status: "answered",
      citations: [1],
      createdAt: "2026-09-29T10:00:00.000Z",
    },
  ];

  it("makes the boxes of Documents and Conversations a tab stop only while they scroll sideways", async () => {
    overflowing(false);

    const documents = render(<DocumentsPanel documents={listed} strings={english} />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: english.documentsTitle }).getAttribute("tabindex")).not.toBe("0");
    });
    documents.unmount();

    const conversations = render(<ConversationsPanel strings={english} conversations={turns} lang="en" timeZone="UTC" />);

    expect(screen.getByRole("region", { name: english.conversationsTitle }).getAttribute("tabindex")).not.toBe("0");
    conversations.unmount();

    overflowing(true);
    render(<DocumentsPanel documents={listed} strings={english} />);
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole("region", { name: english.documentsTitle }).getAttribute("tabindex")).toBe("0");
    });
  });

  it("does not promise the passages in the intro of Conversations, which lists the numbers of the sources", () => {
    expect(english.conversationsIntro).not.toMatch(/passage/i);
    expect(spanish.conversationsIntro).not.toMatch(/pasaje/i);
  });

  it("hides the Citations column on a phone so the When column is never cut off", () => {
    render(<ConversationsPanel strings={english} conversations={turns} lang="en" timeZone="UTC" />);

    expect(screen.getByRole("columnheader", { name: english.citations }).className).toContain("max-sm:hidden");
    expect(screen.getByRole("columnheader", { name: english.when }).className).not.toContain("max-sm:hidden");
  });
});

// Found by the browser suite of `main` (`e2e/providers.spec.ts`, "the page speaks Spanish completely") on the first run of 10.5:
// the client components of every page of the panel receive `adminStrings(lang)` whole, so a table of words that names variables of
// the environment cannot live inside it, or its text travels in the payload of every page even where nothing shows it.
describe("the strings that reach the browser name no variable of the environment (decision 29)", () => {
  for (const lang of ["en", "es"] as const) {
    it(`carry no name of a variable in ${lang}`, () => {
      const names = JSON.stringify(adminStrings(lang)).match(/\b[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+\b/g) ?? [];

      expect(names, "names of variables inside the strings the client components receive").toEqual([]);
    });
  }

  it("keeps the words of the groups of Setup in a table of their own, read only by the server page", () => {
    expect(Object.keys(adminStrings("en"))).not.toContain("setupGroups");
    expect(JSON.stringify(SETUP_GROUPS.es)).toMatch(/ENCRYPTION_KEY/);
  });
});
