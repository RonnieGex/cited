import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Embed from "@/app/embed/page";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import type { Business } from "@/lib/settings/business";

// The requirement "A widget for the owner's site" of `specs/public-chat/spec.md`: `/embed` is the same chat as the
// public page without its chrome, which is what the iframe of `/widget.js` loads. `lib/settings/business.ts` belongs to
// the parallel lane and its tests mock it, as the design decision 8 says.
//
// Decision 8 of `openspec/changes/guided-setup-and-knowledge/design.md` and the requirement "The public page is honest
// about its state and about AI" of `specs/owner-setup/spec.md`: the frame says it is not ready when no AI is connected
// and always carries the disclosure and the privacy link, in the language of the visitor. `resolveChat()` is mocked
// here so the two states are the two cases of this file.

let business: Business | null = null;
let langCookie: string | undefined;
let ready = true;

vi.mock("@/lib/settings/business.ts", () => ({
  readBusiness: async () => business,
}));

vi.mock("@/lib/settings/providers.ts", () => ({
  resolveChat: async () => ({ provider: ready ? "fake" : null, source: "none", missing: [], keyState: "set" }),
  chatProblem: () => (ready ? null : "the AI is not connected yet"),
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
  ready = true;
});

describe("the page that is embedded", () => {
  it("is the same chat without the chrome of the public page", async () => {
    render(await Embed());

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Cited");
    expect(screen.getByLabelText(PUBLIC_STRINGS.en.question.label)).toBeInTheDocument();
    expect(screen.queryByText(PUBLIC_STRINGS.en.footer)).toBeNull();
  });

  it("speaks the language of the business, like the page", async () => {
    business = workshop;

    render(await Embed());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Café La Horquilla");
    expect(screen.getByLabelText(PUBLIC_STRINGS.es.question.label)).toBeInTheDocument();
    expect(screen.getByText("Pregúntanos lo que quieras.")).toBeInTheDocument();
  });

  it("says it is not ready when no AI is connected, and never offers a box that cannot answer", async () => {
    business = workshop;
    ready = false;

    render(await Embed());

    expect(screen.getByText(PUBLIC_STRINGS.es.notReadyTitle)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: PUBLIC_STRINGS.es.notReadyPanel })).toHaveAttribute("href", "/admin");
    expect(screen.queryByLabelText(PUBLIC_STRINGS.es.question.label)).toBeNull();
  });

  it("carries the disclosure of AI and the privacy link in the language of the visitor", async () => {
    business = workshop;

    render(await Embed());

    expect(screen.getByText(PUBLIC_STRINGS.es.discloseAi)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: PUBLIC_STRINGS.es.privacyLink })).toHaveAttribute("href", "/privacy");
  });
});
