import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Embed from "@/app/embed/page";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import type { Business } from "@/lib/settings/business";

// The requirement "A widget for the owner's site" of `specs/public-chat/spec.md`: `/embed` is the same chat as the
// public page without its chrome, which is what the iframe of `/widget.js` loads. `lib/settings/business.ts` belongs to
// the parallel lane and its tests mock it, as the design decision 8 says.

let business: Business | null = null;
let langCookie: string | undefined;

vi.mock("@/lib/settings/business.ts", () => ({
  readBusiness: async () => business,
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
});
