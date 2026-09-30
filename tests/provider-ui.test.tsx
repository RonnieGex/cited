import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderConnect } from "@/components/admin/ProviderConnect";
import { ProviderState } from "@/components/admin/ProviderState";
import { adminStrings } from "@/lib/i18n/admin";
import {
  chatCatalogue,
  embeddingsCatalogue,
  hostedOfferOf,
  signupLink,
  type ProviderEntry,
} from "@/lib/providers/catalog";

// Decision 8 of `design.md` and the requirements "Honest provider catalogue with disclosed links" and "The owner
// connects a provider in the panel" of `specs/provider-settings/spec.md`: the page shows the connected provider with
// its last four characters and its last test, offers the list of providers with one honest line each, marks a value
// set by the server as read only, and explains every failure in words. Nothing here touches a database or a provider.

const english = adminStrings("en");
const spanish = adminStrings("es");
const chat = chatCatalogue({});
const embeddings = embeddingsCatalogue({});
const noReindex = { documents: 0, passages: 0 };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubFetch(...answers: Array<{ status?: number; body?: unknown }>): ReturnType<typeof vi.fn> {
  const queue = [...answers];
  const fetched = vi.fn(async () => {
    const next = queue.shift() ?? { status: 200, body: { status: "ok" } };

    return new Response(JSON.stringify(next.body ?? {}), { status: next.status ?? 200 });
  });

  vi.stubGlobal("fetch", fetched);

  return fetched;
}

describe("the state of a provider", () => {
  it("shows a provider set by the server as read only", () => {
    render(
      <ProviderState
        affiliate={false}
        encryptionReady
        entries={chat}
        kind="chat"
        lang="en"
        offer=""
        reindex={noReindex}
        strings={english}
        view={{
          source: "server",
          provider: "deepseek",
          model: "deepseek-flash",
          last4: null,
          testedAt: null,
          latencyMs: null,
          mode: null,
        }}
      />,
    );

    expect(screen.getByText(english.setByServer)).toBeInTheDocument();
    expect(screen.getByText(english.serverExplanation)).toBeInTheDocument();
    expect(screen.getByText("DeepSeek")).toBeInTheDocument();
    expect(screen.getByText(/deepseek-flash/)).toBeInTheDocument();
    expect(screen.queryByLabelText(english.keyLabel)).toBeNull();
    expect(screen.queryByRole("button", { name: english.testKey })).toBeNull();
  });

  it("shows a connected provider with its last four characters, its last test and its latency", () => {
    render(
      <ProviderState
        affiliate={false}
        encryptionReady
        entries={chat}
        kind="chat"
        lang="en"
        offer=""
        reindex={noReindex}
        strings={english}
        view={{
          source: "panel",
          provider: "deepseek",
          model: "deepseek-flash",
          last4: "9001",
          testedAt: "2026-09-29T10:00:00.000Z",
          latencyMs: 120,
          mode: null,
        }}
      />,
    );

    expect(screen.getByText(/••••9001/)).toBeInTheDocument();
    expect(screen.getByText(/120 ms/)).toBeInTheDocument();
    expect(screen.getByText(english.connected)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: english.removeKey })).toBeInTheDocument();
  });

  it("lists every provider with one honest line and a link to get a key", () => {
    render(
      <ProviderState
        affiliate={false}
        encryptionReady
        entries={chat}
        kind="chat"
        lang="es"
        offer=""
        reindex={noReindex}
        strings={spanish}
        view={{
          source: "none",
          provider: null,
          model: "",
          last4: null,
          testedAt: null,
          latencyMs: null,
          mode: null,
        }}
      />,
    );

    // Decision 10 of `openspec/changes/guided-setup-and-knowledge/design.md`: the list of the providers is the list of
    // selectable rows of `ProviderConnect`, so it is the section of the answers that carries it and nothing appears
    // twice.
    const section = screen.getByRole("region", { name: spanish.answersSection });
    const list = within(section).getByRole("list");

    for (const entry of chat) {
      const item = within(list).getByText(entry.name).closest("li") as HTMLElement;

      expect(item).not.toBeNull();
      expect(within(item).getByText(new RegExp(entry.cost.es))).toBeInTheDocument();
      // The row of the provider says where it processes the data beside the label of the group.
      expect(within(item).getByText(new RegExp(entry.processing.es))).toBeInTheDocument();
      expect(
        within(item).getByText(entry.embeddings ? spanish.meansYes : spanish.meansNo),
      ).toBeInTheDocument();
      // The row of the provider is a radio of the group the owner chooses from.
      expect(within(item).getByRole("radio")).toBeInTheDocument();
    }

    const links = within(list).getAllByRole("link", { name: spanish.getKey });

    expect(links).toHaveLength(chat.length);
    expect(links[0]).toHaveAttribute("href", chat[0]?.signupUrl);
    expect(screen.queryByText(spanish.paidLink)).toBeNull();
    expect(screen.getAllByText(spanish.meansYes).length).toBeGreaterThan(0);
    expect(screen.getAllByText(spanish.meansNo).length).toBeGreaterThan(0);
  });

  it("labels an affiliate link before the click and turns it off with the switch", () => {
    const affiliate: ProviderEntry = {
      ...(chat[0] as ProviderEntry),
      affiliateUrl: "https://afiliados.example/cited",
    };
    const view = {
      source: "none" as const,
      provider: null,
      model: "",
      last4: null,
      testedAt: null,
      latencyMs: null,
      mode: null,
    };

    expect(signupLink(affiliate, { affiliateLinks: true })).toEqual({
      href: "https://afiliados.example/cited",
      paid: true,
    });
    expect(signupLink(affiliate, { affiliateLinks: false })).toEqual({
      href: affiliate.signupUrl,
      paid: false,
    });
    expect(signupLink(chat[0] as ProviderEntry, { affiliateLinks: true }).paid).toBe(false);

    const { unmount } = render(
      <ProviderState
        affiliate
        encryptionReady
        entries={[affiliate]}
        kind="chat"
        lang="en"
        offer=""
        reindex={noReindex}
        strings={english}
        view={view}
      />,
    );

    expect(screen.getByText(english.paidLink)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(english.getKey) })).toHaveAttribute(
      "href",
      "https://afiliados.example/cited",
    );

    unmount();
    render(
      <ProviderState
        affiliate={false}
        encryptionReady
        entries={[affiliate]}
        kind="chat"
        lang="en"
        offer=""
        reindex={noReindex}
        strings={english}
        view={view}
      />,
    );

    expect(screen.queryByText(english.paidLink)).toBeNull();
    expect(screen.getByRole("link", { name: new RegExp(english.getKey) })).toHaveAttribute(
      "href",
      affiliate.signupUrl,
    );
  });

  it("shows the hosted offer under the list and hides it when the server sets none", () => {
    const view = {
      source: "none" as const,
      provider: null,
      model: "",
      last4: null,
      testedAt: null,
      latencyMs: null,
      mode: null,
    };

    expect(hostedOfferOf({ HOSTED_OFFER_URL: "" })).toBe("");
    expect(hostedOfferOf({ HOSTED_OFFER_URL: "https://katalis.dev/cited" })).toBe(
      "https://katalis.dev/cited",
    );

    const { unmount } = render(
      <ProviderState
        affiliate={false}
        encryptionReady
        entries={chat}
        kind="chat"
        lang="en"
        offer="https://katalis.dev/cited"
        reindex={noReindex}
        strings={english}
        view={view}
      />,
    );

    expect(screen.getByRole("link", { name: english.hostedOffer })).toHaveAttribute(
      "href",
      "https://katalis.dev/cited",
    );

    unmount();
    render(
      <ProviderState
        affiliate={false}
        encryptionReady
        entries={chat}
        kind="chat"
        lang="en"
        offer=""
        reindex={noReindex}
        strings={english}
        view={view}
      />,
    );

    expect(screen.queryByRole("link", { name: english.hostedOffer })).toBeNull();
  });

  it("shows keyword search as the connected meaning search", () => {
    render(
      <ProviderState
        affiliate={false}
        encryptionReady
        entries={embeddings}
        kind="embeddings"
        lang="en"
        offer=""
        reindex={noReindex}
        strings={english}
        view={{
          source: "panel",
          provider: "keyword",
          model: "",
          last4: null,
          testedAt: "2026-09-29T10:00:00.000Z",
          latencyMs: null,
          mode: "keyword",
        }}
      />,
    );

    expect(screen.getByText(english.keywordActive)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: english.testKey })).toBeNull();
  });
});

describe("connecting a provider", () => {
  it("has a password field with a toggle that shows what is typed", () => {
    render(
      <ProviderConnect
        encryptionReady
        entries={chat}
        kind="chat"
        lang="en"
        strings={english}
      />,
    );

    const field = screen.getByLabelText(english.keyLabel);

    expect(field).toHaveAttribute("type", "password");

    fireEvent.change(field, { target: { value: "sk-de-prueba" } });
    fireEvent.click(screen.getByRole("button", { name: english.showKey }));

    expect(screen.getByLabelText(english.keyLabel)).toHaveAttribute("type", "text");
  });

  it("says in words that the provider rejected the key and saves nothing", async () => {
    const fetched = stubFetch({
      status: 200,
      body: { status: "ok", ok: false, reason: "rejected_key" },
    });

    render(<ProviderConnect encryptionReady entries={chat} kind="chat" lang="en" strings={english} />);

    fireEvent.click(screen.getByRole("radio", { name: /OpenAI/ }));
    fireEvent.change(screen.getByLabelText(english.keyLabel), { target: { value: "sk-rechazada" } });
    fireEvent.click(screen.getByRole("button", { name: english.testKey }));

    expect(await screen.findByRole("alert")).toHaveTextContent(english.reasonRejectedKey);
    expect(fetched).toHaveBeenCalledTimes(1);
    expect(String((fetched.mock.calls[0] as unknown as [string])[0])).toBe(
      "/api/admin/providers/test",
    );
    // A key is saved only after a successful test: the button is there and it cannot be pressed yet.
    expect(screen.getByRole("button", { name: english.saveKey })).toBeDisabled();
  });

  it("answers a refused address in the words of the owner and links Settings", async () => {
    // Requirement "The owner never reads a variable name in an answer of the panel" (task 11.3): the code
    // `address_not_allowed` is the whole answer of the route, and the page is what turns it into a sentence of the
    // owner and a link to the only page that names the variable of whoever installs.
    stubFetch({
      status: 400,
      body: { status: "address_not_allowed", ok: false, reason: "address_not_allowed" },
    });

    render(<ProviderConnect encryptionReady entries={chat} kind="chat" lang="en" strings={english} />);

    fireEvent.click(screen.getByRole("radio", { name: /Ollama/ }));
    fireEvent.click(screen.getByRole("button", { name: english.testKey }));

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent(english.reasonAddressNotAllowed);
    expect(alert.textContent).not.toContain("ALLOW_LOCAL_PROVIDERS");
    expect(
      within(alert).getByRole("link", { name: english.reasonAddressNotAllowedLink }),
    ).toHaveAttribute("href", "/admin/settings");
  });

  it("tests and saves a good key, then shows only the last four characters", async () => {
    const fetched = stubFetch(
      { status: 200, body: { status: "ok", ok: true, model: "gpt-4o-mini", latencyMs: 120 } },
      { status: 200, body: { status: "ok", saved: true, model: "gpt-4o-mini", latencyMs: 118, last4: "7788" } },
    );

    render(<ProviderConnect encryptionReady entries={chat} kind="chat" lang="en" strings={english} />);

    fireEvent.click(screen.getByRole("radio", { name: /OpenAI/ }));
    fireEvent.change(screen.getByLabelText(english.keyLabel), { target: { value: "sk-buena-7788" } });
    fireEvent.click(screen.getByRole("button", { name: english.testKey }));

    expect(await screen.findByRole("status")).toHaveTextContent("gpt-4o-mini");

    fireEvent.click(screen.getByRole("button", { name: english.saveKey }));

    await waitFor(() => expect(fetched).toHaveBeenCalledTimes(2));

    const [saveUrl, saveOptions] = fetched.mock.calls[1] as unknown as [string, RequestInit];
    const body = JSON.parse(String(saveOptions.body)) as Record<string, unknown>;

    expect(saveUrl).toBe("/api/admin/providers/save");
    expect(body["kind"]).toBe("chat");
    expect(body["provider"]).toBe("openai");
    expect(body["key"]).toBe("sk-buena-7788");

    expect(await screen.findByText(/••••7788/)).toBeInTheDocument();
    expect(screen.queryByLabelText(english.keyLabel)).toBeNull();
  });

  it("says that the server needs an encryption key and keeps the save disabled", () => {
    render(<ProviderConnect encryptionReady={false} entries={chat} kind="chat" lang="en" strings={english} />);

    expect(screen.getByText(english.noEncryptionKey)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: english.saveKey })).toBeDisabled();
  });

  it("offers keyword search without a key for the meaning search", () => {
    render(
      <ProviderConnect encryptionReady entries={embeddings} keyword kind="embeddings" lang="en" strings={english} />,
    );

    expect(screen.getByRole("button", { name: english.keywordChoose })).toBeInTheDocument();
    expect(screen.getByText(english.keywordLine)).toBeInTheDocument();
    expect(screen.getByLabelText(english.keyLabel)).toBeInTheDocument();
  });

  it("says how many passages need re-indexing and re-indexes them now", async () => {
    const fetched = stubFetch({
      status: 200,
      body: { status: "ok", documents: 1, passages: 12 },
    });

    render(
      <ProviderState
        affiliate={false}
        encryptionReady
        entries={embeddings}
        kind="embeddings"
        lang="en"
        offer=""
        reindex={{ documents: 1, passages: 12 }}
        strings={english}
        view={{
          source: "panel",
          provider: "openai",
          model: "text-embedding-3-small",
          last4: "4321",
          testedAt: "2026-09-29T10:00:00.000Z",
          latencyMs: 80,
          mode: null,
        }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(english.reindexNeeded.replace("{passages}", "12"));

    fireEvent.click(screen.getByRole("button", { name: english.reindexNow }));

    await waitFor(() => expect(fetched).toHaveBeenCalledTimes(1));

    const [url, options] = fetched.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe("/api/admin/providers/reindex");
    expect(options.method).toBe("POST");
    expect(await screen.findByRole("status")).toHaveTextContent(english.reindexed.replace("{passages}", "12"));
  });
});
