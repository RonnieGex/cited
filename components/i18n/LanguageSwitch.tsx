"use client";

import type { Lang } from "@/lib/settings/business";
import { langCookie } from "@/lib/i18n/language";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import { focusRing } from "@/components/ui";

// Design decision 8 of `openspec/changes/public-page-and-widget/design.md`: the switch is owned by this lane and it is
// the same one the administration panel uses. It renders `English | Español` in that order as two buttons with
// `aria-pressed`, writes the cookie and reloads the page in the chosen language.
//
// Decision 6 of `openspec/changes/brand-identity-ui/design.md` adds the tone, the ground the switch sits on: `paper`
// (the default, the look it always had), `ink` (paper text with lime for the chosen one, for the ink column of the
// panel) and `brand` (the color of the ground, for the band that carries the color of the business).

const OPTIONS: ReadonlyArray<{ lang: Lang; label: string }> = [
  { lang: "en", label: "English" },
  { lang: "es", label: "Español" },
];

const TONES = {
  paper: { separator: "text-ink/60", other: "text-ink/60 hover:text-ink", chosen: "text-ink underline" },
  ink: { separator: "text-paper/60", other: "text-paper/80 hover:text-paper", chosen: "text-lime underline" },
  brand: { separator: "text-current", other: "text-current hover:underline", chosen: "text-current underline" },
} as const;

export type LanguageSwitchTone = keyof typeof TONES;

function chooseLanguage(chosen: Lang, reload: () => void): void {
  document.cookie = langCookie(chosen);
  reload();
}

export type LanguageSwitchProps = {
  current: Lang;
  reload?: () => void;
  className?: string;
  tone?: LanguageSwitchTone;
};

export function LanguageSwitch({ current, reload, className = "", tone = "paper" }: LanguageSwitchProps) {
  const strings = PUBLIC_STRINGS[current];
  const colors = TONES[tone];

  return (
    <div
      role="group"
      aria-label={strings.language}
      className={`flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${className}`}
    >
      {OPTIONS.map((option, index) => (
        <span key={option.lang} className="flex items-center gap-2">
          {index === 0 ? null : (
            <span aria-hidden="true" className={colors.separator}>
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
            className={`inline-flex items-center rounded-none px-1 transition-colors duration-[400ms] ease-out-expo max-lg:min-h-11 ${
              option.lang === current ? colors.chosen : colors.other
            } ${focusRing}`}
          >
            {option.label}
          </button>
        </span>
      ))}
    </div>
  );
}
