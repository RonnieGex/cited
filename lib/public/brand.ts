import { readBusiness } from "../settings/business.ts";
import { resolveLang } from "../i18n/language.ts";
import { welcomeFor } from "../i18n/public.ts";
import { readablePrimary, textOn } from "../theme/primary.ts";
import type { Lang } from "../settings/business.ts";

// The face of the business, as the public page and the page that is embedded need it: the language of the visitor, the
// name, the logo, the primary color with its contrast fallback and the welcome message. `lib/settings/business.ts`
// belongs to the parallel lane `admin-panel-and-onboarding`; this module is the only reader of it in this lane, and the
// tests of the page mock that module.

export const PRODUCT_NAME = "Cited";
export const LOGO_ENDPOINT = "/api/brand/logo";
export const FLAME = "/brand/katalis-flame-ink-64.png";

export type PublicBrand = {
  lang: Lang;
  name: string;
  hasLogo: boolean;
  primary: string;
  onPrimary: string;
  welcome: string;
};

export async function readPublicBrand(cookie: string | undefined): Promise<PublicBrand> {
  const business = await readBusiness();
  const lang = resolveLang(cookie, business?.language ?? "en");
  const primary = readablePrimary(business?.primaryColor ?? null);

  return {
    lang,
    name: business?.name.trim() || PRODUCT_NAME,
    hasLogo: business?.hasLogo === true,
    primary,
    onPrimary: textOn(primary),
    welcome: welcomeFor(lang, business?.welcome ?? null),
  };
}
