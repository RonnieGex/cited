import Image from "next/image";
import { cookies } from "next/headers";
import type { CSSProperties } from "react";
import { Wordmark } from "@/components/brand";
import { Chat } from "@/components/chat";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { LANG_COOKIE } from "@/lib/i18n/language";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import { FLAME, LOGO_ENDPOINT, readPublicBrand } from "@/lib/public/brand";

// The public page: the chat of the business, with its name, its logo and its primary color from the settings (the brand
// of Cited when there are none yet). The requirement "Home page" of `specs/app-skeleton/spec.md` (MODIFIED) lives here:
// one `main` element with one `h1` and the question box of the chat.
//
// Decision 9 of `openspec/changes/brand-identity-ui/design.md`: the page wears the business first. A band across the
// page carries the color of the business, its logo, its name as the `h1` and the language switch; without a business the
// band is ink, the wordmark is the visible name and the `h1` ("Cited") stays for assistive technology.

export default async function Home() {
  const cookie = (await cookies()).get(LANG_COOKIE)?.value;
  const brand = await readPublicBrand(cookie);
  const strings = PUBLIC_STRINGS[brand.lang];

  return (
    <main
      lang={brand.lang}
      style={
        {
          "--primary": brand.primary,
          "--on-primary": brand.onPrimary,
        } as CSSProperties
      }
      className="flex min-h-screen flex-col bg-paper text-ink"
    >
      <header
        data-public="band"
        className={`py-10 lg:py-14 ${
          brand.branded ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-ink text-paper"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[880px] flex-wrap items-center justify-between gap-x-6 gap-y-6 px-6">
          <div className="flex min-w-0 items-center gap-5">
            {brand.hasLogo ? (
              <Image
                src={LOGO_ENDPOINT}
                alt={brand.name}
                width={192}
                height={64}
                unoptimized
                className="h-12 w-auto shrink-0"
              />
            ) : null}
            <h1
              className={
                brand.branded
                  ? "min-w-0 break-words text-[32px] font-bold leading-[1.1] tracking-[-0.02em] lg:text-[40px]"
                  : "sr-only"
              }
            >
              {brand.name}
            </h1>
            {brand.branded ? null : (
              <span aria-hidden="true">
                <Wordmark size="lg" tone="ink" />
              </span>
            )}
          </div>
          <LanguageSwitch current={brand.lang} tone={brand.branded ? "brand" : "ink"} />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[880px] flex-1 flex-col px-6 pt-10 lg:pt-14">
        <Chat lang={brand.lang} welcome={brand.welcome} />
      </div>

      <footer className="mx-auto mt-12 flex w-full max-w-[880px] items-center gap-3 border-t border-rule px-6 py-6 text-sm text-ink-2">
        <Image src={FLAME} alt="Katalis" width={64} height={64} unoptimized className="h-8 w-auto" />
        <span>{strings.footer}</span>
      </footer>
    </main>
  );
}
