import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { Chat } from "@/components/chat";
import { LANG_COOKIE } from "@/lib/i18n/language";
import { readPublicBrand } from "@/lib/public/brand";

// The page the widget frames: the same chat as the public page without its chrome. Its `frame-ancestors` is the one the
// proxy sets, and `ALLOWED_ORIGINS` is the list of the sites that may embed it.

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
      className="min-h-screen bg-paper p-4 text-ink"
    >
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-6">
        <h1 className="text-lg font-bold tracking-[-0.02em] text-ink">{brand.name}</h1>
        <Chat lang={brand.lang} welcome={brand.welcome} variant="embed" />
      </div>
    </main>
  );
}
