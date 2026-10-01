import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AttentionNotice } from "@/components/setup/AttentionNotice";
import { DocumentPanel } from "@/components/setup/DocumentPanel";
import { InfoPanel } from "@/components/setup/InfoPanel";
import { PublishPanel } from "@/components/setup/PublishPanel";
import { SetupLane } from "@/components/setup/SetupLane";
import { TryItPanel } from "@/components/setup/TryItPanel";
import { adminStrings } from "@/lib/i18n/admin";
import type { SetupStep } from "@/lib/admin/setup-checklist";

// Decisions 1 to 7 of `openspec/changes/guided-setup-and-knowledge/design.md`: the lane opens one step in place and
// shows the state of each one with the numbered citation mark; the information lane takes several files at once and
// says what happened to each; Try it shows the answer beside the passage it cited; Publish saves the business and
// shows the page as visitors will see it. No modal, no emoji, no environment variable name.

vi.mock("@/components/i18n/LanguageSwitch", () => ({
  LanguageSwitch: ({ current }: { current: string }) => <button type="button">{`English | Español (${current})`}</button>,
}));

const english = adminStrings("en");
const spanish = adminStrings("es");

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function step(id: SetupStep["id"], state: SetupStep["state"]): SetupStep {
  return {
    id,
    state,
    title: { en: `Step ${id}`, es: `Paso ${id}` },
    detail: { en: `What ${id} does`, es: `Lo que hace ${id}` },
  };
}

const steps: SetupStep[] = [
  step("ai", "verified"),
  step("information", "progress"),
  step("try", "todo"),
  step("publish", "todo"),
];

describe("the lane of the guided setup", () => {
  it("numbers the four steps and marks the ones that are verified", () => {
    render(
      <SetupLane
        current="information"
        lang="en"
        onCurrent={vi.fn()}
        onSkip={vi.fn()}
        steps={steps}
        strings={english}
      >
        {{
          ai: <p>Connect your AI here</p>,
          information: <p>Your information here</p>,
          try: <p>Try it here</p>,
          publish: <p>Publish here</p>,
        }}
      </SetupLane>,
    );

    const items = screen.getAllByRole("listitem");

    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent("1");
    expect(items[1]).toHaveTextContent("2");
    expect(items[2]).toHaveTextContent("3");
    expect(items[3]).toHaveTextContent("4");
    expect(within(items[0] as HTMLElement).getByText(english.stepVerified)).toBeInTheDocument();
  });

  it("opens the current step in place and keeps the others closed", () => {
    render(
      <SetupLane
        current="information"
        lang="en"
        onCurrent={vi.fn()}
        onSkip={vi.fn()}
        steps={steps}
        strings={english}
      >
        {{
          ai: <p>Connect your AI here</p>,
          information: <p>Your information here</p>,
          try: <p>Try it here</p>,
          publish: <p>Publish here</p>,
        }}
      </SetupLane>,
    );

    expect(screen.getByText("Your information here")).toBeInTheDocument();
    expect(screen.queryByText("Connect your AI here")).not.toBeInTheDocument();
    expect(screen.queryByText("Try it here")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog"), "no modal").toBeNull();
  });

  it("opens the step the owner presses and asks the page for it", () => {
    const asked = vi.fn();

    render(
      <SetupLane current="information" lang="en" onCurrent={asked} onSkip={vi.fn()} steps={steps} strings={english}>
        {{
          ai: <p>Connect your AI here</p>,
          information: <p>Your information here</p>,
          try: <p>Try it here</p>,
          publish: <p>Publish here</p>,
        }}
      </SetupLane>,
    );

    fireEvent.click(screen.getByRole("button", { name: new RegExp(`Step publish`) }));

    expect(asked).toHaveBeenCalledWith("publish");
  });

  it("says what each step does and what to do next, in both languages", () => {
    for (const strings of [english, spanish]) {
      const { unmount } = render(
        <SetupLane current="ai" lang={strings === english ? "en" : "es"} onCurrent={vi.fn()} onSkip={vi.fn()} steps={steps} strings={strings}>
          {{
            ai: <p>content</p>,
            information: <p>content</p>,
            try: <p>content</p>,
            publish: <p>content</p>,
          }}
        </SetupLane>,
      );

      expect(screen.getByText(strings.setupSkip)).toBeInTheDocument();

      unmount();
    }
  });

  it("says the state of a step in words, never in a badge of capitals", () => {
    const attention: SetupStep[] = [step("ai", "attention"), step("information", "todo"), step("try", "todo"), step("publish", "todo")];

    render(
      <SetupLane current="ai" lang="en" onCurrent={vi.fn()} onSkip={vi.fn()} steps={attention} strings={english}>
        {{
          ai: <p>content</p>,
          information: <p>content</p>,
          try: <p>content</p>,
          publish: <p>content</p>,
        }}
      </SetupLane>,
    );

    expect(screen.getByText(english.stepAttention)).toBeInTheDocument();
    // The three steps that are not the one with attention say the same words, one each.
    expect(screen.getAllByText(english.stepTodo)).toHaveLength(3);
  });

  // Decision 14 of the amendment: a chat provider the server set that cannot answer shows the step as needing
  // attention, with the link to the only page allowed to name the variables (decision 11).
  it("sends the owner to the installer when a step needs attention, in both languages", () => {
    for (const strings of [english, spanish]) {
      const { unmount } = render(<AttentionNotice strings={strings} />);

      expect(screen.getByText(strings.stepAttentionBody)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: strings.panelInstaller })).toHaveAttribute(
        "href",
        "/admin/settings",
      );

      unmount();
    }
  });

  // Decision 20 of the second amendment: a key saved in the panel that can no longer be read needs attention in the
  // words of the owner, and the notice carries the button that reopens step 1, which is where the key is connected
  // again. It never sends the owner to the page of the installer: the provider is theirs.
  it("tells the owner of an unreadable key to connect the AI again, in both languages", () => {
    for (const strings of [english, spanish]) {
      const { unmount } = render(<AttentionNotice source="panel" strings={strings} />);

      expect(screen.getByText(strings.stepKeyBody)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: strings.stepKeyAction })).toHaveAttribute(
        "href",
        "/admin?step=ai",
      );
      expect(screen.queryByRole("link", { name: strings.panelInstaller })).not.toBeInTheDocument();

      unmount();
    }
  });

  // Decision 23 of the third amendment: a row of the panel that names a provider Cited does not know is the owner's to
  // fix, in their words, with the button that reopens step 1. It never sends the owner to the page of the installer:
  // the provider is theirs (the Major M-8 of `katalis-dev/tasks/revision-community-13c.md`).
  it("tells the owner of a provider Cited does not know to connect the AI again, in both languages", () => {
    for (const strings of [english, spanish]) {
      const { unmount } = render(<AttentionNotice source="unknown" strings={strings} />);

      expect(screen.getByText(strings.stepUnknownProviderBody)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: strings.stepKeyAction })).toHaveAttribute(
        "href",
        "/admin?step=ai",
      );
      expect(screen.queryByRole("link", { name: strings.panelInstaller })).not.toBeInTheDocument();

      unmount();
    }
  });

  // Decision 24 of the fourth amendment: the AI answers and the search is not chosen, which is the state the real run
  // of `entrega-community-13.md` left step 1 in. The sentence says what is missing and the two doors of the section
  // below — a meaning provider or search by words — are what finishes the step, so the notice sends nowhere.
  it("asks the owner to choose how to search, in both languages", () => {
    for (const strings of [english, spanish]) {
      const { unmount } = render(<AttentionNotice source="search" strings={strings} />);

      expect(screen.getByText(strings.stepSearchBody)).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: strings.panelInstaller })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: strings.stepKeyAction })).not.toBeInTheDocument();

      unmount();
    }
  });
});

describe("the information lane", () => {
  const files = [
    { name: "cafe-la-horquilla.md", passages: 4 },
    { name: "notas-del-negocio.txt", passages: 2 },
  ];

  it("takes several files at once and says what happened to each one", async () => {
    const asked: string[] = [];
    const fetched = vi.fn(async (url: string, options?: RequestInit) => {
      asked.push(String(url));

      const form = options?.body as FormData;
      const names = form.getAll("document").map((one) => (one as File).name);

      return new Response(
        JSON.stringify({
          status: "ok",
          results: names.map((name) => ({
            name,
            state: "ready",
            passages: files.find((file) => file.name === name)?.passages ?? 1,
            failure: null,
          })),
          documents: files.map((file) => ({
            name: file.name,
            type: "md",
            pages: null,
            ingestedAt: "2026-09-30T12:00:00.000Z",
            passages: file.passages,
          })),
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetched);

    render(<InfoPanel documents={[]} strings={english} />);

    const chooser = screen.getByLabelText(english.uploadDocument) as HTMLInputElement;

    fireEvent.change(chooser, {
      target: {
        files: files.map((file) => new File([`# ${file.name}\n\ntexto`], file.name, { type: "text/markdown" })),
      },
    });
    fireEvent.click(screen.getByRole("button", { name: english.upload }));

    await waitFor(() => expect(screen.getByText(english.uploadReady.replace("{n}", "4"))).toBeInTheDocument());

    // One request per file: that is what lets one file fail while the files after it are read (decisions 3 and the
    // scenario "A scanned PDF").
    expect(asked).toEqual(["/api/admin/documents", "/api/admin/documents"]);
    expect(screen.getByText(english.uploadReady.replace("{n}", "2"))).toBeInTheDocument();
  });

  it("says the reason of a file that failed and that the others were read", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            status: "ok",
            results: [
              { name: "escaneo.pdf", state: "failed", passages: 0, failure: "the file has no readable text" },
              { name: "horario.md", state: "ready", passages: 3, failure: null },
            ],
            documents: [],
          }),
          { status: 200 },
        ),
      ),
    );

    render(<InfoPanel documents={[]} strings={english} />);

    fireEvent.change(screen.getByLabelText(english.uploadDocument), {
      target: { files: [new File(["%PDF-"], "escaneo.pdf", { type: "application/pdf" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: english.upload }));

    await waitFor(() => expect(screen.getByText(english.uploadScanTitle)).toBeInTheDocument());

    expect(screen.getByText(english.uploadScanAdvice)).toBeInTheDocument();
    expect(screen.getByText(english.uploadReady.replace("{n}", "3"))).toBeInTheDocument();
  });

  it("offers the sample business and asks the server for it", async () => {
    const fetched = vi.fn(async () =>
      new Response(
        JSON.stringify({
          status: "ok",
          name: "Café La Horquilla",
          documents: ["cafe-la-horquilla.md"],
          results: [{ name: "cafe-la-horquilla.md", state: "ready", passages: 4, failure: null }],
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal("fetch", fetched);

    render(<InfoPanel documents={[]} strings={english} />);

    fireEvent.click(screen.getByRole("button", { name: english.sampleTry }));

    await waitFor(() => expect(screen.getByText(english.sampleLoaded.replace("{name}", "Café La Horquilla"))).toBeInTheDocument());

    const [url, options] = fetched.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe("/api/admin/samples");
    expect(options.method).toBe("POST");
  });

  // Decision 24 of the fourth amendment: while the search is not chosen the sample cannot be ingested, so the same
  // control is the door back to step 1 and the owner never presses a button that fails after the press.
  it("sends the owner back to step 1 for the sample while the search is not chosen, in both languages", () => {
    const fetched = vi.fn();

    vi.stubGlobal("fetch", fetched);

    for (const strings of [english, spanish]) {
      const { unmount } = render(<InfoPanel documents={[]} searchChosen={false} strings={strings} />);

      expect(screen.getByRole("link", { name: strings.sampleTry })).toHaveAttribute("href", "/admin?step=ai");
      expect(screen.queryByRole("button", { name: strings.sampleTry })).not.toBeInTheDocument();

      unmount();
    }

    expect(fetched, "the panel asks the server for nothing").not.toHaveBeenCalled();
  });

  // Decision 16 of the amendment: undoing the sample is one request that removes its documents and clears the name it
  // set, and only when the business still carries that name.
  it("undoes the sample business with one request that also clears its name", async () => {
    const fetched = vi.fn(async (url: string, options?: RequestInit) => {
      if (String(url) === "/api/admin/samples" && options?.method === "DELETE") {
        return new Response(JSON.stringify({ status: "ok", name_cleared: true, documents: [] }), { status: 200 });
      }

      return new Response(JSON.stringify({ status: "ok", documents: [] }), { status: 200 });
    });

    vi.stubGlobal("fetch", fetched);

    render(
      <InfoPanel
        documents={[
          {
            name: "cafe-la-horquilla.md",
            type: "md",
            pages: null,
            ingestedAt: "2026-09-30T12:00:00.000Z",
            passages: 4,
          },
        ]}
        sampleLoaded
        strings={english}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: english.sampleUndo }));

    await waitFor(() => expect(screen.getByText(english.documentUndone)).toBeInTheDocument());

    expect(fetched).toHaveBeenCalledWith("/api/admin/samples", expect.objectContaining({ method: "DELETE" }));
    expect(
      fetched.mock.calls.some(([url]) => String(url) === "/api/admin/documents/delete"),
      "the documents are not removed one by one",
    ).toBe(false);
  });

  it("opens a document as a page of its own", () => {
    render(
      <InfoPanel
        documents={[
          {
            name: "cafe-la-horquilla.md",
            type: "md",
            pages: null,
            ingestedAt: "2026-09-30T12:00:00.000Z",
            passages: 4,
          },
        ]}
        strings={english}
      />,
    );

    const link = screen.getByRole("link", { name: "cafe-la-horquilla.md" });

    expect(link).toHaveAttribute("href", "/admin/information/cafe-la-horquilla.md");
  });

  it("offers the drop zone with a real control inside it, in both languages", () => {
    for (const strings of [english, spanish]) {
      const { unmount } = render(<InfoPanel documents={[]} strings={strings} />);

      expect(screen.getByText(strings.uploadDrop)).toBeInTheDocument();
      expect(screen.getByLabelText(strings.uploadDocument)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: strings.upload })).toBeInTheDocument();

      unmount();
    }
  });

  it("says what to do next when there is no document yet", () => {
    render(<InfoPanel documents={[]} strings={english} />);

    expect(screen.getByText(english.noDocuments)).toBeInTheDocument();
  });
});

describe("the try lane", () => {
  const citation = {
    n: 1,
    document: "cafe-la-horquilla.md",
    heading: "Precios",
    position: 2,
    excerpt: "Afinación de bicicleta: 380 pesos.",
  };

  it("shows the answer with its citation and the passage inside its document", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ status: "answered", answer: "La afinación cuesta 380 pesos [1].", citations: [citation] }),
          { status: 200 },
        ),
      ),
    );

    render(
      <TryItPanel
        documents={[
          {
            name: "cafe-la-horquilla.md",
            passages: [
              { id: 1, name: "cafe-la-horquilla.md", position: 2, heading: "Precios", text: "Afinación de bicicleta: 380 pesos." },
            ],
          },
        ]}
        lang="es"
        strings={english}
        suggestions={["¿Cuánto cuesta Precios?"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "¿Cuánto cuesta Precios?" }));

    await waitFor(() => expect(screen.getByText(/380 pesos/)).toBeInTheDocument());

    expect(screen.getByText(citation.excerpt)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: english.thisIsRight })).toBeInTheDocument();
  });

  it("shows the heading of the cited passage once and its list as a list of five items", async () => {
    const listCitation = {
      n: 1,
      document: "cafe-la-horquilla.md",
      heading: "Precios",
      position: 2,
      excerpt:
        "Precios - Espresso: 35 pesos. - Café de olla: 45 pesos. - Pan dulce del día: 30 pesos. - Afinación de bicicleta: 380 pesos. - Cambio de cámara: 120 pesos.",
      lead: 0,
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            status: "answered",
            answer: "La afinación cuesta 380 pesos [1].",
            citations: [listCitation],
          }),
          { status: 200 },
        ),
      ),
    );

    render(
      <TryItPanel
        documents={[
          {
            name: "cafe-la-horquilla.md",
            passages: [
              { id: 3, name: "cafe-la-horquilla.md", position: 2, heading: "Precios", text: listCitation.excerpt },
            ],
          },
        ]}
        lang="es"
        strings={english}
        suggestions={["¿Cuánto cuesta Precios?"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "¿Cuánto cuesta Precios?" }));

    await waitFor(() => expect(screen.getByText(/380 pesos/)).toBeInTheDocument());

    // The heading of the passage is the heading of its section, and the list is a list: the text of the passage never
    // repeats the heading and never joins the items into one paragraph (decisions 1 and 3).
    expect(screen.getAllByText("Precios")).toHaveLength(1);
    expect(screen.queryByText(/^Precios - Espresso/)).toBeNull();

    const open = screen.getByText("Espresso: 35 pesos.").closest("li") as HTMLElement;
    const items = within(open).getAllByRole("listitem");

    expect(items).toHaveLength(5);
    expect(items[0]?.textContent).toBe("Espresso: 35 pesos.");
    expect(items[4]?.textContent).toBe("Cambio de cámara: 120 pesos.");
  });

  it("shows the citation's number beside the cited passage, never its position", async () => {
    const laterCitation = {
      n: 2,
      document: "cafe-la-horquilla.md",
      heading: "Políticas",
      position: 3,
      excerpt: "Políticas Aceptamos efectivo y tarjeta.",
      lead: "Políticas ".length,
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ status: "answered", answer: "Aceptamos efectivo [2].", citations: [laterCitation] }),
          { status: 200 },
        ),
      ),
    );

    const { container } = render(
      <TryItPanel
        documents={[
          {
            name: "cafe-la-horquilla.md",
            passages: [
              {
                id: 1,
                name: "cafe-la-horquilla.md",
                position: 2,
                heading: "Precios",
                text: "Precios - Espresso: 35 pesos.",
              },
              { id: 2, name: "cafe-la-horquilla.md", position: 3, heading: "Políticas", text: laterCitation.excerpt },
            ],
          },
        ]}
        lang="en"
        strings={english}
        suggestions={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText(english.question.label), { target: { value: "How do I pay?" } });
    fireEvent.click(screen.getByRole("button", { name: english.question.submit }));

    await waitFor(() => expect(container.querySelector('[data-citation-passage="open"]')).not.toBeNull());

    const open = container.querySelector('[data-citation-passage="open"]') as HTMLElement;

    expect(open).toHaveTextContent("Aceptamos efectivo y tarjeta.");
    expect(open.querySelector('[data-brand="citation-mark"]')?.textContent).toBe("2");
    expect(within(open).getByText("Passage 3", { selector: ".sr-only" })).toBeInTheDocument();
  });

  it("offers the suggested questions as buttons and never calls a model to build them", () => {
    const fetched = vi.fn();

    vi.stubGlobal("fetch", fetched);

    render(
      <TryItPanel
        documents={[{ name: "cafe.md", passages: [] }]}
        lang="en"
        strings={english}
        suggestions={["What does Horario say?", "What does Precios say?"]}
      />,
    );

    expect(screen.getAllByRole("button", { name: /What does/ })).toHaveLength(2);
    expect(fetched).not.toHaveBeenCalled();
  });

  it("says the documents do not say it and suggests adding one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ status: "refused", answer: "The documents don't say." }), { status: 200 }),
      ),
    );

    render(
      <TryItPanel
        documents={[{ name: "cafe.md", passages: [] }]}
        lang="en"
        strings={english}
        suggestions={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText(english.question.label), { target: { value: "¿Tienen wifi?" } });
    fireEvent.click(screen.getByRole("button", { name: english.question.submit }));

    await waitFor(() => expect(screen.getByText(english.tryRefusalAdvice)).toBeInTheDocument());
  });

  it("marks the answer as right through the route of the panel", async () => {
    const fetched = vi.fn(async (url: string) => {
      if (String(url).includes("/api/admin/try/verify")) {
        return new Response(JSON.stringify({ status: "ok", flags: { try_verified: true } }), { status: 200 });
      }

      return new Response(
        JSON.stringify({ status: "answered", answer: "Cuesta 380 pesos [1].", citations: [citation] }),
        { status: 200 },
      );
    });

    vi.stubGlobal("fetch", fetched);

    render(
      <TryItPanel
        documents={[{ name: "cafe-la-horquilla.md", passages: [] }]}
        lang="en"
        strings={english}
        suggestions={["How much does Precios cost?"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "How much does Precios cost?" }));

    await waitFor(() => expect(screen.getByRole("button", { name: english.thisIsRight })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: english.thisIsRight }));

    await waitFor(() =>
      expect(fetched).toHaveBeenCalledWith(
        "/api/admin/try/verify",
        expect.objectContaining({ method: "PUT" }),
      ),
    );
  });
});

describe("the publish lane", () => {
  const business = {
    name: "Café La Horquilla",
    hasLogo: false,
    primaryColor: "#171717",
    tone: "",
    language: "en" as const,
    forbiddenTopics: [],
    welcome: { en: "", es: "" },
    updatedAt: "2026-09-30T12:00:00.000Z",
  };

  it("shows the form beside the preview of the public page", () => {
    render(
      <PublishPanel
        business={business}
        published={false}
        site="http://localhost:3213"
        strings={english}
        widgetSites={["https://cafe.example"]}
      />,
    );

    expect(screen.getByLabelText(english.businessName)).toHaveValue("Café La Horquilla");

    const preview = screen.getByTitle(english.previewTitle);

    expect(preview.tagName).toBe("IFRAME");
    expect(preview).toHaveAttribute("src", "/embed");
  });

  it("shows the public link with a copy and an open control", () => {
    render(
      <PublishPanel
        business={business}
        published={false}
        site="http://localhost:3213"
        strings={english}
        widgetSites={["https://cafe.example"]}
      />,
    );

    expect(screen.getByText("http://localhost:3213/")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: english.copyLink })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: english.openLink })).toHaveAttribute("href", "/");
  });

  it("shows the widget code with the sites that may embed it", () => {
    render(
      <PublishPanel
        business={business}
        published={false}
        site="http://localhost:3213"
        strings={english}
        widgetSites={["https://cafe.example", "https://tienda.example"]}
      />,
    );

    expect(screen.getByText(/widget\.js/)).toBeInTheDocument();
    expect(screen.getByText("https://cafe.example")).toBeInTheDocument();
    expect(screen.getByText("https://tienda.example")).toBeInTheDocument();
  });

  it("says the page is published once the flag is set", () => {
    render(
      <PublishPanel
        business={business}
        published
        site="http://localhost:3213"
        strings={english}
        widgetSites={[]}
      />,
    );

    expect(screen.getByText(english.published)).toBeInTheDocument();
  });

  it("publishes through the route of the flags", async () => {
    const fetched = vi.fn(async (url: string) => {
      if (String(url).includes("/api/admin/setup/flags")) {
        return new Response(JSON.stringify({ status: "ok", flags: { published: true } }), { status: 200 });
      }

      return new Response(JSON.stringify({ status: "ok", business }), { status: 200 });
    });

    vi.stubGlobal("fetch", fetched);

    render(
      <PublishPanel
        business={business}
        published={false}
        site="http://localhost:3213"
        strings={english}
        widgetSites={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: english.publish }));

    await waitFor(() =>
      expect(fetched).toHaveBeenCalledWith(
        "/api/admin/setup/flags",
        expect.objectContaining({ method: "PUT" }),
      ),
    );
  });
});

describe("the page of a document", () => {
  const summary = {
    name: "cafe-la-horquilla.md",
    type: "md",
    pages: null,
    ingestedAt: "2026-09-30T12:00:00.000Z",
    passages: 1,
  };
  const listed = [
    { id: 1, name: "cafe-la-horquilla.md", position: 1, heading: "Horario", text: "Martes a viernes: 8:00 a 19:00." },
  ];

  it("groups the passages under their headings, with the cited one in the highlighter", () => {
    render(<DocumentPanel document={summary} highlight={1} lang="en" passages={listed} strings={english} />);

    expect(screen.getByRole("heading", { level: 2, name: "Horario" })).toBeInTheDocument();
    expect(screen.getByText("Martes a viernes: 8:00 a 19:00.")).toBeInTheDocument();
    expect(document.querySelector('[data-document-passage="open"]')).not.toBeNull();
  });

  it("shows no citation mark, labels the first passage 1 and shows the heading once", () => {
    const list = [
      {
        id: 3,
        name: "cafe-la-horquilla.md",
        position: 2,
        heading: "Precios",
        text:
          "Precios - Espresso: 35 pesos. - Café de olla: 45 pesos. - Pan dulce del día: 30 pesos. - Afinación de bicicleta: 380 pesos. - Cambio de cámara: 120 pesos.",
      },
    ];

    render(<DocumentPanel document={summary} lang="es" passages={list} strings={english} />);

    // The page shows passages without an answer: no citation mark anywhere, and the labels count passages from 1
    // (decision 6 of `design.md`).
    expect(document.querySelectorAll('[data-brand="citation-mark"]')).toHaveLength(0);
    expect(screen.getByText("Passage 1", { selector: ".sr-only" })).toBeInTheDocument();
    expect(screen.getByText("Passage 2", { selector: ".sr-only" })).toBeInTheDocument();
    expect(screen.queryByText("Passage 0", { selector: ".sr-only" })).toBeNull();
    // The heading of the passage is the heading of its section: the text never repeats it.
    expect(screen.getAllByText("Precios")).toHaveLength(1);
    expect(screen.queryByText(/^Precios - Espresso/)).toBeNull();
  });

  it("groups the passages under their headings, with the cited one in the highlighter", () => {
    render(<DocumentPanel document={summary} highlight={1} lang="en" passages={listed} strings={english} />);

    expect(screen.getByRole("heading", { level: 2, name: "Horario" })).toBeInTheDocument();
    expect(screen.getByText("Martes a viernes: 8:00 a 19:00.")).toBeInTheDocument();
    expect(document.querySelector('[data-document-passage="open"]')).not.toBeNull();
  });

  it("removes a document only after the window of the undo closes", async () => {
    vi.useFakeTimers();

    const fetched = vi.fn(async () => new Response(JSON.stringify({ status: "ok" }), { status: 200 }));

    vi.stubGlobal("fetch", fetched);

    render(<DocumentPanel document={summary} lang="en" passages={listed} strings={english} />);

    fireEvent.click(screen.getByRole("button", { name: english.documentRemove }));

    expect(screen.getByText(english.documentRemoving.replace("{name}", summary.name))).toBeInTheDocument();
    expect(fetched, "nothing is deleted while the undo is open").not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(7000);
    });

    expect(fetched).toHaveBeenCalledWith(
      "/api/admin/documents/delete",
      expect.objectContaining({ method: "POST" }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(english.documentUndone)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("keeps the document when the owner presses the undo", async () => {
    vi.useFakeTimers();

    const fetched = vi.fn(async () => new Response(JSON.stringify({ status: "ok" }), { status: 200 }));

    vi.stubGlobal("fetch", fetched);

    render(<DocumentPanel document={summary} lang="en" passages={listed} strings={english} />);

    fireEvent.click(screen.getByRole("button", { name: english.documentRemove }));
    fireEvent.click(screen.getByRole("button", { name: english.documentUndo }));

    await act(async () => {
      vi.advanceTimersByTime(7000);
    });

    expect(fetched, "the undo cancels the removal").not.toHaveBeenCalled();
    expect(screen.getByText(english.documentKept)).toBeInTheDocument();

    vi.useRealTimers();
  });
});
