import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { Wordmark } from "@/components/brand";
import { LANG_COOKIE } from "@/lib/i18n/language";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import { readPublicBrand } from "@/lib/public/brand";
import { chatCatalogue, embeddingsCatalogue } from "@/lib/providers/catalog";
import { chatProblem, embeddingsConfigured, resolveChat, resolveEmbeddings } from "@/lib/settings/providers";

// Decision 8 of `openspec/changes/guided-setup-and-knowledge/design.md`: the privacy page names the providers this
// business uses and where each one processes the data, from the catalogue of the providers, in the language of the
// visitor. It is the second half of the disclosure that every public page carries, and it is public on purpose: a
// visitor has to be able to read it without an account.

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const cookie = (await cookies()).get(LANG_COOKIE)?.value;
  const brand = await readPublicBrand(cookie);

  return { title: `${PUBLIC_STRINGS[brand.lang].privacyTitle} · ${brand.name}` };
}

export default async function Privacy() {
  const cookie = (await cookies()).get(LANG_COOKIE)?.value;
  const brand = await readPublicBrand(cookie);
  const lang = brand.lang;
  const strings = PUBLIC_STRINGS[lang];
  const chat = await resolveChat({ environment: process.env });
  const embeddings = await resolveEmbeddings({ environment: process.env });
  const chatEntry = chatCatalogue(process.env).find((entry) => entry.id === chat.provider) ?? null;
  const embeddingsEntry = embeddingsCatalogue(process.env).find((entry) => entry.id === embeddings.provider) ?? null;
  const searching = embeddingsConfigured(embeddings);

  return (
    <div
      lang={lang}
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
        className={`py-10 ${brand.branded ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-ink text-paper"}`}
      >
        <div className="mx-auto flex w-full max-w-[880px] flex-wrap items-center justify-between gap-x-6 gap-y-4 px-6">
          <h1 className="min-w-0 break-words text-[28px] font-bold leading-[1.15] tracking-[-0.02em] lg:text-[34px]">
            {strings.privacyTitle}
          </h1>
          <LanguageSwitch current={lang} tone={brand.branded ? "brand" : "ink"} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[880px] flex-1 flex-col gap-10 px-6 py-10">
        <p className="max-w-[65ch] text-ink/80">{strings.privacyIntro}</p>

        <section aria-label={strings.privacyProvidersTitle} className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink">{strings.privacyProvidersTitle}</h2>

          <div className="flex flex-col gap-2 border-t border-rule pt-4">
            <h3 className="text-lg font-semibold text-ink">{strings.privacyChat}</h3>
            {chatEntry === null || chatProblem(chat) !== null ? (
              <p className="max-w-[65ch] text-ink/80">{strings.privacyNoProvider}</p>
            ) : (
              <>
                <p className="text-ink">{chatEntry.name}</p>
                <p className="max-w-[65ch] text-sm text-ink/80">
                  {strings.privacyWhere}: {chatEntry.processing[lang]}
                </p>
                <p className="max-w-[65ch] text-sm text-ink/80">{strings.privacyProcessing}</p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-rule pt-4">
            <h3 className="text-lg font-semibold text-ink">{strings.privacyEmbeddings}</h3>
            {searching === false ? (
              <p className="max-w-[65ch] text-ink/80">{strings.privacyNoProvider}</p>
            ) : embeddings.mode === "keyword" || embeddingsEntry === null ? (
              <p className="max-w-[65ch] text-ink/80">{strings.privacyWords}</p>
            ) : (
              <>
                <p className="text-ink">{embeddingsEntry.name}</p>
                <p className="max-w-[65ch] text-sm text-ink/80">
                  {strings.privacyWhere}: {embeddingsEntry.processing[lang]}
                </p>
                <p className="max-w-[65ch] text-sm text-ink/80">{strings.privacyProcessing}</p>
              </>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink">{strings.privacyStoredTitle}</h2>
          <p className="max-w-[65ch] text-ink/80">{strings.privacyStoredBody}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink">{strings.privacyContactTitle}</h2>
          <p className="max-w-[65ch] text-ink/80">{strings.privacyContactBody}</p>
        </section>

        <p>
          <Link className="text-sm font-semibold text-ink underline underline-offset-4" href="/">
            {strings.privacyBack}
          </Link>
        </p>
      </main>

      <footer className="mx-auto w-full max-w-[880px] px-6 text-sm text-ink-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule py-6">
          <Wordmark size="sm" tone="paper" />
          <span>{strings.answersBy}</span>
          <span aria-hidden="true">·</span>
          <span>{strings.footer}</span>
        </div>
      </footer>
    </div>
  );
}
