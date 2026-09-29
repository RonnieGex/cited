import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageSwitch, type LanguageSwitchProps } from "@/components/i18n/LanguageSwitch";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";
import { PUBLIC_STRINGS, welcomeFor } from "@/lib/i18n/public";
import type { Lang } from "@/lib/settings/business";

// Design decision 8 of `openspec/changes/public-page-and-widget/design.md`: `lib/i18n/language.ts` and
// `components/i18n/LanguageSwitch.tsx` are the modules this lane owns, with the exact interface the decision writes.
// Franc asked for the demo in English first, with the switch `English | Español` in that order.

// The consumer of the parallel lane. `components/admin/AdminNav.tsx` of `admin-panel-and-onboarding` renders exactly
// this, and design decision 8 (amended by Fable after `revision-community-08`) fixes the name of the one prop:
// `LanguageSwitch({ current }: { current: Lang })`. The review reproduced TS2322 when the owner declared `lang`, so the
// interface of the owner is pinned here the way its consumer calls it.
function AdminNavLanguage({ lang }: { lang: Lang }) {
  return <LanguageSwitch current={lang} />;
}

type Captured = { events: string[]; restore: () => void };

/** Captures the raw `Set-Cookie` string and the reload, in the order they happen. */
function captureCookieAndReload(): Captured {
  const descriptor = Object.getOwnPropertyDescriptor(document, "cookie");
  const events: string[] = [];

  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => "",
    set: (value: string) => {
      events.push(`cookie:${value}`);
    },
  });

  return {
    events,
    restore: () => {
      if (descriptor === undefined) {
        Reflect.deleteProperty(document, "cookie");

        return;
      }

      Object.defineProperty(document, "cookie", descriptor);
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the language of the public page", () => {
  it("keeps the chosen language in cited-lang", () => {
    expect(LANG_COOKIE).toBe("cited-lang");
  });

  it("resolves the cookie against the language of the business", () => {
    expect(resolveLang(undefined, "en")).toBe("en");
    expect(resolveLang("", "en")).toBe("en");
    expect(resolveLang("es", "en")).toBe("es");
    expect(resolveLang("es", "en")).toBe("es");
    expect(resolveLang(" ES ", "en")).toBe("es");
    expect(resolveLang("en", "es")).toBe("en");
    expect(resolveLang("EN", "es")).toBe("en");
    expect(resolveLang("fr", "es")).toBe("es");
    expect(resolveLang("english", "es")).toBe("es");
    expect(resolveLang(undefined, "es")).toBe("es");
  });

  it("shows the welcome of the chosen language and falls back to the other", () => {
    const welcome = { en: "Ask us anything.", es: "Pregúntanos lo que quieras." };

    expect(welcomeFor("en", welcome)).toBe("Ask us anything.");
    expect(welcomeFor("es", welcome)).toBe("Pregúntanos lo que quieras.");
    expect(welcomeFor("es", { en: "Ask us anything.", es: "" })).toBe("Ask us anything.");
    expect(welcomeFor("en", { en: "  ", es: "Pregúntanos." })).toBe("Pregúntanos.");
    expect(welcomeFor("en", null)).toBe(PUBLIC_STRINGS.en.welcome);
    expect(welcomeFor("es", undefined)).toBe(PUBLIC_STRINGS.es.welcome);
    expect(welcomeFor("en", { en: "", es: "" })).toBe(PUBLIC_STRINGS.en.welcome);
  });

  it("offers English first, with aria-pressed on the chosen one", () => {
    render(<LanguageSwitch current="en" reload={() => {}} />);

    const buttons = screen.getAllByRole("button");

    expect(buttons.map((button) => button.textContent)).toEqual(["English", "Español"]);
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Español" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("group", { name: PUBLIC_STRINGS.en.language })).toBeInTheDocument();
  });

  it("marks Spanish when Spanish is chosen", () => {
    render(<LanguageSwitch current="es" reload={() => {}} />);

    expect(screen.getByRole("button", { name: "Español" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("group", { name: PUBLIC_STRINGS.es.language })).toBeInTheDocument();
  });

  it("writes the cookie before reloading, with path, sameSite and one year", () => {
    const captured = captureCookieAndReload();
    const reload = vi.fn(() => captured.events.push("reload"));

    try {
      render(<LanguageSwitch current="en" reload={reload} />);

      fireEvent.click(screen.getByRole("button", { name: "Español" }));

      expect(captured.events).toEqual([
        "cookie:cited-lang=es; path=/; max-age=31536000; samesite=lax",
        "reload",
      ]);
      expect(reload).toHaveBeenCalledTimes(1);
    } finally {
      captured.restore();
    }
  });

  it("does nothing when the language is the one already chosen", () => {
    const captured = captureCookieAndReload();
    const reload = vi.fn();

    try {
      render(<LanguageSwitch current="es" reload={reload} />);

      fireEvent.click(screen.getByRole("button", { name: "Español" }));

      expect(captured.events).toEqual([]);
      expect(reload).not.toHaveBeenCalled();
    } finally {
      captured.restore();
    }
  });

  it("is the module the parallel lane consumes: the one prop is current", () => {
    // The shape of the props the owner exports, as `admin-panel-and-onboarding` writes it.
    const props: LanguageSwitchProps = { current: "es" };

    expect(props.current).toBe("es");

    render(<AdminNavLanguage lang="en" />);

    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Español" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("takes the chosen language from the consumer, in Spanish too", () => {
    render(<AdminNavLanguage lang="es" />);

    expect(screen.getByRole("button", { name: "Español" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("group", { name: PUBLIC_STRINGS.es.language })).toBeInTheDocument();
  });
});
