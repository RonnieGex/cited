import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { Chat } from "@/components/chat";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { LANG_COOKIE } from "@/lib/i18n/language";
import { readPublicBrand } from "@/lib/public/brand";

// The page the widget frames: the same chat as the public page without its chrome. Its `frame-ancestors` is the one the
// proxy sets, and `ALLOWED_ORIGINS` is the list of the sites that may embed it.
//
// Decision 12 of `openspec/changes/brand-identity-ui/design.md`: the band is a slim strip in the primary color with the
// name at 18 px and the language switch; the rest is the same `Chat`.

export default async function Embed() {
  const cookie = (await cookies()).get(LANG_COOKIE)?.value;
  const brand = await readPublicBrand(cookie);

  return (
    <main
      lang={brand.lang}
      style={
        {
          "--primary": brand.primary,
          "--on-primary": brand.onPrimary,
        } as CSSProperties
      }
      className="min-h-screen bg-paper text-ink"
    >
      <header
        data-public="band"
        className="bg-[var(--primary)] py-4 text-[var(--on-primary)]"
      >
        <div className="mx-auto flex w-full max-w-[560px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4">
          <h1 className="min-w-0 break-words text-[18px] font-bold leading-[1.2] tracking-[-0.02em]">
            {brand.name}
          </h1>
          <LanguageSwitch current={brand.lang} tone="brand" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[560px] px-4 py-6">
        <Chat lang={brand.lang} welcome={brand.welcome} variant="embed" />
      </div>
    </main>
  );
}
