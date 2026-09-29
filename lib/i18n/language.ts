// Stand-in until public-page-and-widget merges; Fable replaces it with the owner's file
import type { Lang } from "../settings/business.ts";

export const LANG_COOKIE = "cited-lang";

export function resolveLang(cookie: string | undefined, fallback: Lang): Lang {
  return cookie === "en" || cookie === "es" ? cookie : fallback;
}
