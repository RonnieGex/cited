import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { Chat } from "@/components/chat";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { Panel } from "@/components/ui";
import { VoiceLauncher } from "@/components/voice";
import { LANG_COOKIE } from "@/lib/i18n/language";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import { readPublicBrand } from "@/lib/public/brand";
import { chatProblem, resolveChat } from "@/lib/settings/providers";

// The page the widget frames: the same chat as the public page without its chrome. Its `frame-ancestors` is the one the
// proxy sets, and `ALLOWED_ORIGINS` is the list of the sites that may embed it.
//
// Decision 12 of `openspec/changes/brand-identity-ui/design.md`: the band is a slim strip in the primary color with the
// name at 18 px and the language switch; the rest is the same `Chat`. Like the public page (decision 9), without a business
// the strip is ink with the ink switch: lime never fills a large area of a public surface. Decision 20: the voice launcher
// of `main` stays under the chat. Round 14c: the strip is the banner of the frame, beside `main` and not inside it
// (decision 33), and the title of the frame is the name of the business (decision 24).

export async function generateMetadata(): Promise<Metadata> {
  const cookie = (await cookies()).get(LANG_COOKIE)?.value;

  return { title: (await readPublicBrand(cookie)).name };
}

export default async function Embed() {
  const cookie = (await cookies()).get(LANG_COOKIE)?.value;
  const brand = await readPublicBrand(cookie);
  const strings = PUBLIC_STRINGS[brand.lang];
  const chat = await resolveChat({ environment: process.env });
  const ready = chatProblem(chat) === null;

  return (
    <div
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
        className={`py-4 ${
          brand.branded ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-ink text-paper"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[560px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4">
          <h1 className="min-w-0 break-words text-[18px] font-bold leading-[1.2] tracking-[-0.02em]">
            {brand.name}
          </h1>
          <LanguageSwitch current={brand.lang} tone={brand.branded ? "brand" : "ink"} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[560px] px-4 py-6">
        {ready ? (
          <Chat lang={brand.lang} welcome={brand.welcome} variant="embed" />
        ) : (
          // Decision 8 of `openspec/changes/guided-setup-and-knowledge/design.md`: the widget is honest about its state
          // too, and it offers the owner the way in instead of a box that cannot answer.
          <Panel className="flex flex-col gap-2" data-cited="not-ready">
            <p className="text-lg font-semibold text-ink">{strings.notReadyTitle}</p>
            <p className="text-ink-2">{strings.notReadyBody}</p>
            <Link className="text-sm font-semibold text-ink underline underline-offset-4" href="/admin">
              {strings.notReadyPanel}
            </Link>
          </Panel>
        )}

        <div className="mt-6 flex flex-col gap-1" data-cited="disclosure">
          <p className="text-sm text-ink-2">{strings.discloseAi}</p>
          <p>
            <Link className="text-sm font-semibold text-ink underline underline-offset-4" href="/privacy">
              {strings.privacyLink}
            </Link>
          </p>
        </div>

        <div className="mt-6">
          <VoiceLauncher lang={brand.lang} />
        </div>
      </main>
    </div>
  );
}
