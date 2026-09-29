import Image from "next/image";
import { cookies } from "next/headers";
import type { CSSProperties } from "react";
import { Chat } from "@/components/chat";
import { LANG_COOKIE } from "@/lib/i18n/language";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import { FLAME, LOGO_ENDPOINT, PRODUCT_NAME, readPublicBrand } from "@/lib/public/brand";

// The public page: the chat of the business, with its name, its logo and its primary color from the settings (the brand
// of Cited when there are none yet). The requirement "Home page" of `specs/app-skeleton/spec.md` (MODIFIED) lives here:
// one `main` element with one `h1` and the question box of the chat.

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
      className="min-h-screen bg-paper px-6 py-10 text-ink"
    >
      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-10">
        <header className="flex flex-col gap-4 border-b border-ink/10 pb-6">
          {brand.hasLogo ? (
            <Image
              src={LOGO_ENDPOINT}
              alt={brand.name}
              width={192}
              height={64}
              unoptimized
              className="h-12 w-auto"
            />
          ) : null}
          {brand.name === PRODUCT_NAME ? null : (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70">
              {PRODUCT_NAME}
            </p>
          )}
          <h1 className="text-4xl font-bold tracking-[-0.02em] text-ink">{brand.name}</h1>
        </header>

        <Chat lang={brand.lang} welcome={brand.welcome} />

        <footer className="flex items-center gap-3 border-t border-ink/10 pt-6 text-sm text-ink/80">
          <Image src={FLAME} alt="Katalis" width={64} height={64} unoptimized className="h-8 w-auto" />
          <span>{strings.footer}</span>
        </footer>
      </div>
    </main>
  );
}
