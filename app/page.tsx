import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import type { CSSProperties } from "react";
import { Wordmark } from "@/components/brand";
import { Chat } from "@/components/chat";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { Panel } from "@/components/ui";
import { VoiceLauncher } from "@/components/voice";
import { LANG_COOKIE } from "@/lib/i18n/language";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import { FLAME, LOGO_ENDPOINT, readPublicBrand } from "@/lib/public/brand";
import { chatProblem, resolveChat } from "@/lib/settings/providers";

// The public page: the chat of the business, with its name, its logo and its primary color from the settings (the brand
// of Cited when there are none yet). The requirement "Home page" of `specs/app-skeleton/spec.md` (MODIFIED) lives here:
// one `main` element with one `h1` and the question box of the chat. The scenario "Nothing configured anywhere" of
// `specs/answering/spec.md` also lives here: when nobody connected a chat provider, the page says the assistant is not
// ready and offers the owner the way to the panel instead of a question box that cannot answer.
//
// Decision 9 of `openspec/changes/brand-identity-ui/design.md`: the page wears the business first. A band across the
// page carries the color of the business, its logo, its name as the `h1` and the language switch; without a business the
// band is ink, the wordmark is the visible name and the `h1` ("Cited") stays for assistive technology. Decision 20: the
// not-ready state and the voice launcher of `main` live inside that band and that column.
//
// Round 14c: the band and the footer are the banner and the contentinfo of the page, so they sit beside `main`, not inside
// it (decision 33); the title of the tab is the name of the business (decision 24); the footer names Cited beside Katalis
// (decision 27), and its rule lines up with the column and the rules of the ledger.

export const dynamic = "force-dynamic";

// The title of the tab is the business, `Cited` while there is none: the business first (`PRODUCT.md`, principle 5).
export async function generateMetadata(): Promise<Metadata> {
  const cookie = (await cookies()).get(LANG_COOKIE)?.value;

  return { title: (await readPublicBrand(cookie)).name };
}

export default async function Home() {
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

      <main className="mx-auto flex w-full max-w-[880px] flex-1 flex-col px-6 pt-10 lg:pt-14">
        {ready ? (
          <Chat lang={brand.lang} welcome={brand.welcome} />
        ) : (
          <Panel className="flex flex-col gap-3" data-cited="not-ready">
            <p className="text-lg font-semibold text-ink">{strings.notReadyTitle}</p>
            <p className="max-w-[65ch] text-ink-2">{strings.notReadyBody}</p>
            <Link className="text-sm font-semibold text-ink underline underline-offset-4" href="/admin">
              {strings.notReadyPanel}
            </Link>
          </Panel>
        )}

        <div className="mt-8">
          <VoiceLauncher lang={brand.lang} />
        </div>
      </main>

      <footer className="mx-auto mt-12 w-full max-w-[880px] px-6 text-sm text-ink-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule py-6">
          <Wordmark size="sm" tone="paper" />
          <span>{strings.answersBy}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-2">
            {/* Decoration: the words beside the flame already say Katalis. */}
            <Image src={FLAME} alt="" width={64} height={64} unoptimized className="h-8 w-auto" />
            <span>{strings.footer}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
