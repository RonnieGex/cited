// Stand-in until public-page-and-widget merges; Fable replaces it with the owner's file
"use client";

import type { Lang } from "@/lib/settings/business";
import { LANG_COOKIE } from "@/lib/i18n/language";

export type LanguageSwitchProps = {
  current: Lang;
};

const year = 60 * 60 * 24 * 365;
const chosen = "underline underline-offset-4";
const resting = "text-ink/70 hover:text-ink";

export function LanguageSwitch({ current }: LanguageSwitchProps) {
  function choose(lang: Lang): void {
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; samesite=lax; max-age=${year}`;
    window.location.reload();
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold">
      <button
        type="button"
        aria-pressed={current === "en"}
        onClick={() => choose("en")}
        className={current === "en" ? chosen : resting}
      >
        English
      </button>
      <span aria-hidden="true">|</span>
      <button
        type="button"
        aria-pressed={current === "es"}
        onClick={() => choose("es")}
        className={current === "es" ? chosen : resting}
      >
        Español
      </button>
    </span>
  );
}
