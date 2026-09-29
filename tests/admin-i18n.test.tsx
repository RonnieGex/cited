import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/language";

const repositoryRoot = resolve(import.meta.dirname, "..");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the shared language module", () => {
  it("is the owner's module of the public page, with the interface the panel uses", () => {
    const language = readFileSync(resolve(repositoryRoot, "lib/i18n/language.ts"), "utf8");
    const switchFile = readFileSync(
      resolve(repositoryRoot, "components/i18n/LanguageSwitch.tsx"),
      "utf8",
    );

    expect(language).not.toContain("Stand-in until");
    expect(switchFile).not.toContain("Stand-in until");
    expect(language).toContain('export const LANG_COOKIE = "cited-lang"');
    expect(language).toContain("export function resolveLang(");
    expect(switchFile).toContain("aria-pressed");
    expect(switchFile).toContain("English");
    expect(switchFile).toContain("Español");
    expect(switchFile).toContain("langCookie");
  });

  it("answers the language of the cookie with the fallback of the panel", () => {
    expect(LANG_COOKIE).toBe("cited-lang");
    expect(resolveLang(undefined, "en")).toBe("en");
    expect(resolveLang("es", "en")).toBe("es");
    expect(resolveLang("en", "es")).toBe("en");
    expect(resolveLang("fr", "en")).toBe("en");
    expect(resolveLang("", "en")).toBe("en");
    expect(resolveLang("ES", "en")).toBe("es");
  });

  it("renders English first and writes the cookie of the choice", () => {
    const reload = vi.fn();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload },
    });

    render(<LanguageSwitch current="en" />);

    const buttons = screen.getAllByRole("button");

    expect(buttons.map((button) => button.textContent)).toEqual(["English", "Español"]);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "false");

    document.cookie = `${LANG_COOKIE}=; path=/; max-age=0`;
    fireEvent.click(buttons[1] as HTMLButtonElement);

    expect(document.cookie).toContain(`${LANG_COOKIE}=es`);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
