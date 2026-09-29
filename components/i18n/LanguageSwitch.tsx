"use client";

import type { Lang } from "@/lib/settings/business";
import { langCookie } from "@/lib/i18n/language";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import { focusRing } from "@/components/ui";

// Design decision 8 of `openspec/changes/public-page-and-widget/design.md`: the switch is owned by this lane and it is
// the same one the administration panel uses. It renders `English | Español` in that order as two buttons with
// `aria-pressed`, writes the cookie and reloads the page in the chosen language.

const OPTIONS: ReadonlyArray<{ lang: Lang; label: string }> = [
  { lang: "en", label: "English" },
  { lang: "es", label: "Español" },
];

function chooseLanguage(chosen: Lang, reload: () => void): void {
  document.cookie = langCookie(chosen);
  reload();
}

export type LanguageSwitchProps = {
  current: Lang;
  reload?: () => void;
  className?: string;
};

export function LanguageSwitch({ current, reload, className = "" }: LanguageSwitchProps) {
  const strings = PUBLIC_STRINGS[current];

  return (
    <div
      role="group"
      aria-label={strings.language}
      className={`flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${className}`}
    >
      {OPTIONS.map((option, index) => (
        <span key={option.lang} className="flex items-center gap-2">
          {index === 0 ? null : (
            <span aria-hidden="true" className="text-ink/60">
              |
            </span>
          )}
          <button
            type="button"
            aria-pressed={option.lang === current}
            onClick={() => {
              if (option.lang !== current) {
                chooseLanguage(option.lang, reload ?? (() => window.location.reload()));
              }
            }}
            className={`rounded-none text-ink/60 transition-colors duration-[400ms] ease-out-expo hover:text-ink ${
              option.lang === current ? "text-ink underline" : ""
            } ${focusRing}`}
          >
            {option.label}
          </button>
        </span>
      ))}
    </div>
  );
}
