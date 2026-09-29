import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminNav } from "@/components/admin/AdminNav";
import { BusinessForm } from "@/components/admin/BusinessForm";
import { ConversationsPanel } from "@/components/admin/ConversationsPanel";
import { DocumentsPanel } from "@/components/admin/DocumentsPanel";
import { LoginForm } from "@/components/admin/LoginForm";
import { TestButton } from "@/components/admin/TestButton";
import { adminStrings } from "@/lib/i18n/admin";

vi.mock("@/components/i18n/LanguageSwitch", () => ({
  LanguageSwitch: ({ current }: { current: string }) => (
    <button type="button">{`English | Español (${current})`}</button>
  ),
}));

vi.mock("@/lib/i18n/language", () => ({
  LANG_COOKIE: "cited-lang",
  resolveLang: (cookie: string | undefined, fallback: "en" | "es"): "en" | "es" =>
    cookie === "en" || cookie === "es" ? cookie : fallback,
}));

const english = adminStrings("en");
const spanish = adminStrings("es");
const business = {
  name: "Café La Horquilla",
  hasLogo: true,
  primaryColor: "#171717",
  tone: "cercano y breve",
  language: "es" as const,
  forbiddenTopics: ["precios de la competencia"],
  welcome: { en: "Welcome", es: "Bienvenido" },
  updatedAt: "2026-09-29T00:00:00.000Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubFetch(status = 200, body: unknown = { status: "ok" }): ReturnType<typeof vi.fn> {
  const fetched = vi.fn(async () => new Response(JSON.stringify(body), { status }));

  vi.stubGlobal("fetch", fetched);

  return fetched;
}

describe("the two languages of the panel", () => {
  it("speaks English first and offers the same keys in Spanish", () => {
    expect(english.signIn).toBe("Sign in");
    expect(spanish.signIn).toBe("Entrar");
    expect(Object.keys(english).sort()).toEqual(Object.keys(spanish).sort());

    for (const [key, value] of Object.entries(english)) {
      expect(String(value).length, key).toBeGreaterThan(0);
      expect(String(spanish[key as keyof typeof spanish]).length, key).toBeGreaterThan(0);
    }
  });

  it("shows the switch of the shared module with the language of the page", () => {
    render(<AdminNav lang="es" strings={spanish} />);

    expect(screen.getByTestId("language-switch")).toHaveTextContent("English | Español (es)");
  });
});

describe("the login form", () => {
  it("posts the password and reloads the panel on success", async () => {
    const fetched = stubFetch(200, { status: "ok" });
    const signedIn = vi.fn();

    render(<LoginForm strings={english} onSignedIn={signedIn} />);

    fireEvent.change(screen.getByLabelText(english.passwordLabel), {
      target: { value: "la-clave-del-propietario" },
    });
    fireEvent.click(screen.getByRole("button", { name: english.signIn }));

    await waitFor(() => expect(signedIn).toHaveBeenCalledTimes(1));

    const [url, options] = fetched.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe("/api/admin/login");
    expect(options.method).toBe("POST");
    expect(JSON.parse(String(options.body))).toEqual({ password: "la-clave-del-propietario" });
  });

  it("says the password is wrong without forgetting the language", async () => {
    stubFetch(401, { status: "invalid" });

    render(<LoginForm strings={spanish} onSignedIn={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(spanish.passwordLabel), {
      target: { value: "no-es" },
    });
    fireEvent.click(screen.getByRole("button", { name: spanish.signIn }));

    expect(await screen.findByRole("alert")).toHaveTextContent(spanish.wrongPassword);
  });

  it("says the login is locked when the server answers 429", async () => {
    stubFetch(429, { status: "locked" });

    render(<LoginForm strings={english} onSignedIn={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(english.passwordLabel), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: english.signIn }));

    expect(await screen.findByRole("alert")).toHaveTextContent(english.locked);
  });
});

describe("the business form", () => {
  it("shows what is stored and saves the topics one per line", async () => {
    const fetched = stubFetch(200, { status: "ok", business });

    render(<BusinessForm strings={english} business={business} />);

    expect(screen.getByLabelText(english.businessName)).toHaveValue("Café La Horquilla");
    expect(screen.getByLabelText(english.businessTone)).toHaveValue("cercano y breve");
    expect(screen.getByLabelText(english.businessTopics)).toHaveValue(
      "precios de la competencia",
    );

    fireEvent.change(screen.getByLabelText(english.businessName), {
      target: { value: "Cited" },
    });
    fireEvent.change(screen.getByLabelText(english.businessTopics), {
      target: { value: "precios\nsalarios" },
    });
    fireEvent.click(screen.getByRole("button", { name: english.saveBusiness }));

    await waitFor(() => expect(fetched).toHaveBeenCalledTimes(1));

    const [url, options] = fetched.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(options.body)) as Record<string, unknown>;

    expect(url).toBe("/api/admin/business");
    expect(options.method).toBe("PUT");
    expect(body["name"]).toBe("Cited");
    expect(body["forbiddenTopics"]).toEqual(["precios", "salarios"]);
    expect(body["language"]).toBe("es");
    expect(body["welcome"]).toEqual({ en: "Welcome", es: "Bienvenido" });
  });

  it("uploads the logo as a file and shows the refusal", async () => {
    const fetched = stubFetch(400, { status: "invalid", error: "the logo must be PNG, JPEG or WebP" });

    render(<BusinessForm strings={english} business={business} />);

    const file = new File([new Uint8Array([1, 2, 3])], "logo.svg", { type: "image/svg+xml" });

    fireEvent.change(screen.getByLabelText(english.logoLabel), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: english.uploadLogo }));

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("the logo must be PNG, JPEG or WebP");

    const [url, options] = fetched.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe("/api/admin/business/logo");
    expect(options.body).toBeInstanceOf(FormData);
  });
});

describe("the setup buttons", () => {
  it("asks for one chat call and shows what the provider answered", async () => {
    const fetched = stubFetch(200, { status: "ok", target: "chat", detail: "the model answered" });

    render(<TestButton strings={english} target="chat" />);

    fireEvent.click(screen.getByRole("button", { name: english.testChat }));

    expect(await screen.findByText("the model answered")).toBeInTheDocument();

    const [url, options] = fetched.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe("/api/admin/setup/test");
    expect(JSON.parse(String(options.body))).toEqual({ target: "chat" });
  });

  it("reports the provider error without a key", async () => {
    stubFetch(200, { status: "error", target: "embeddings", detail: "The openai provider needs EMBEDDINGS_API_KEY." });

    render(<TestButton strings={english} target="embeddings" />);

    fireEvent.click(screen.getByRole("button", { name: english.testEmbeddings }));

    expect(
      await screen.findByText("The openai provider needs EMBEDDINGS_API_KEY."),
    ).toBeInTheDocument();
  });
});

describe("the documents panel", () => {
  it("lists each document with its passages and deletes one by name", async () => {
    const fetched = stubFetch(200, { status: "ok", documents: [] });

    render(
      <DocumentsPanel
        strings={english}
        documents={[
          { name: "cafe-la-horquilla.md", type: "md", pages: null, ingestedAt: "2026-09-29T10:00:00.000Z", passages: 4 },
        ]}
      />,
    );

    expect(screen.getByText("cafe-la-horquilla.md")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: `${english.deleteDocument} cafe-la-horquilla.md` }));

    await waitFor(() => expect(fetched).toHaveBeenCalledTimes(1));

    const [url, options] = fetched.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe("/api/admin/documents/delete");
    expect(JSON.parse(String(options.body))).toEqual({ name: "cafe-la-horquilla.md" });
  });

  it("uploads the chosen file through the same form", async () => {
    const fetched = stubFetch(200, { status: "ok", documents: [] });

    render(<DocumentsPanel strings={english} documents={[]} />);

    const file = new File(["# Precios\n"], "precios.md", { type: "text/markdown" });

    fireEvent.change(screen.getByLabelText(english.uploadDocument), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: english.upload }));

    await waitFor(() => expect(fetched).toHaveBeenCalledTimes(1));

    const [url, options] = fetched.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe("/api/admin/documents");
    expect(options.body).toBeInstanceOf(FormData);
  });
});

describe("the conversations panel", () => {
  it("lists the questions with their status and deletes them all", async () => {
    const fetched = stubFetch(200, { status: "ok", deleted: 1, conversations: [] });

    render(
      <ConversationsPanel
        lang="en"
        strings={english}
        timeZone="UTC"
        conversations={[
          {
            sessionId: "sesion-a",
            turn: 1,
            question: "¿Aceptan cheques?",
            answer: "I can't find that in this business's documents.",
            status: "refused",
            citations: [],
            createdAt: "2026-09-29T10:00:00.000Z",
          },
          {
            sessionId: "sesion-a",
            turn: 2,
            question: "¿Cuánto cuesta?",
            answer: "380 pesos [1]",
            status: "answered",
            citations: [1],
            createdAt: "2026-09-29T10:01:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("¿Aceptan cheques?")).toBeInTheDocument();
    expect(screen.getByText(english.refused)).toBeInTheDocument();
    expect(screen.getByText(english.answered)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: english.deleteAll }));

    await waitFor(() => expect(fetched).toHaveBeenCalledTimes(1));

    const [url, options] = fetched.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe("/api/admin/conversations/delete");
    expect(options.method).toBe("POST");
  });
});
