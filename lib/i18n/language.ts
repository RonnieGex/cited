import type { Lang } from "../settings/business.ts";

// Design decision 8 of `openspec/changes/public-page-and-widget/design.md`: this lane owns the language of the public
// page. The choice lives in a cookie, the language of the business is the fallback, and English is the language of the
// demo (Franc, 2026-09-29).

export const LANG_COOKIE = "cited-lang";
export const LANG_COOKIE_MAX_AGE = 31_536_000;

export const LANGS: readonly Lang[] = ["en", "es"];

export function resolveLang(cookie: string | undefined, fallback: Lang): Lang {
  const value = cookie?.trim().toLowerCase() ?? "";

  return value === "en" || value === "es" ? value : fallback;
}

export function langCookie(lang: Lang): string {
  return `${LANG_COOKIE}=${lang}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`;
}
