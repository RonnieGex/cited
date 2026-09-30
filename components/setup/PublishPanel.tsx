"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Button, Chip, Input, Panel, SectionTitle, focusRing } from "@/components/ui";
import type { AdminStrings } from "@/lib/i18n/admin";
import { readablePrimary } from "@/lib/theme/primary";
import { topicsFrom } from "@/lib/settings/topics";
import type { Business, Lang } from "@/lib/settings/business";

// Decision 7 of `openspec/changes/guided-setup-and-knowledge/design.md`: the business form beside the live preview of
// the public page (an `/embed` frame that comes back when the business is saved), the public link with a copy and an
// open control, and the widget code with the sites that may embed it. "Publish" sets the flag of the fourth step.
//
// Decision 12: the voice screen of `voice-owner-words` is not rebuilt here — the page of Publish shows it as the third
// way to publish, after the page and the widget.

export type PublishPanelProps = {
  strings: AdminStrings;
  lang: Lang;
  business: Business | null;
  published: boolean;
  /** The origin of this installation, which is what the public link and the widget code carry. */
  site: string;
  widgetSites: string[];
};

const label = "text-sm font-semibold text-ink";
const field = "flex flex-col gap-2";

export function PublishPanel({ strings, lang, business, published, site, widgetSites }: PublishPanelProps) {
  const [name, setName] = useState(business?.name ?? "");
  const [color, setColor] = useState(business?.primaryColor ?? "");
  const [tone, setTone] = useState(business?.tone ?? "");
  const [language, setLanguage] = useState<Lang>(business?.language ?? "en");
  const [topics, setTopics] = useState((business?.forbiddenTopics ?? []).join("\n"));
  const [welcomeEn, setWelcomeEn] = useState(business?.welcome.en ?? "");
  const [welcomeEs, setWelcomeEs] = useState(business?.welcome.es ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isPublished, setPublished] = useState(published);
  const [frame, setFrame] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const link = `${site.replace(/\/+$/, "")}/`;
  const snippet = `<script src="${site.replace(/\/+$/, "")}/widget.js" async></script>`;
  const adjusted = color.trim().length > 0 && readablePrimary(color.trim()) !== color.trim().toLowerCase();

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/admin/business", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        primaryColor: color.trim().length === 0 ? null : color.trim(),
        tone,
        language,
        forbiddenTopics: topicsFrom(topics),
        welcome: { en: welcomeEn, es: welcomeEs },
      }),
    });
    const answer = (await response.json().catch(() => ({}))) as { error?: string };

    if (response.ok) {
      setMessage(strings.saved);
      // The preview is the real page: it comes back with the business that was just written, without reloading the
      // panel (the scenario "A change of color").
      setFrame((current) => current + 1);
      frameRef.current?.contentWindow?.location.reload();
    } else {
      setError(answer.error ?? strings.saveFailed);
    }

    setBusy(false);
  }

  async function publish(): Promise<void> {
    setBusy(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/admin/setup/flags", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ flag: "published", value: true }),
    });

    if (response.ok) {
      setPublished(true);
      setMessage(strings.published);
    } else {
      setError(strings.saveFailed);
    }

    setBusy(false);
  }

  async function copy(text: string): Promise<void> {
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      // A browser that refuses the clipboard says so by doing nothing: the link is on the page and it can be selected.
    }

    setMessage(strings.copied);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <form className="flex flex-col gap-6" onSubmit={save}>
        <div className={field}>
          <label className={label} htmlFor="publish-name">
            {strings.businessName}
          </label>
          <Input
            id="publish-name"
            name="name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>

        <div className={field}>
          <label className={label} htmlFor="publish-color">
            {strings.businessColor}
          </label>
          <Input
            id="publish-color"
            name="color"
            onChange={(event) => setColor(event.target.value)}
            placeholder="#171717"
            value={color}
          />
          {adjusted ? (
            <p className="max-w-[65ch] text-sm text-ink" role="alert">
              {strings.businessColorAdjusted}
            </p>
          ) : null}
        </div>

        <div className={field}>
          <label className={label} htmlFor="publish-tone">
            {strings.businessTone}
          </label>
          <Input id="publish-tone" name="tone" onChange={(event) => setTone(event.target.value)} value={tone} />
        </div>

        <div className={field}>
          <label className={label} htmlFor="publish-language">
            {strings.businessLanguage}
          </label>
          <select
            className={`w-full rounded-none border border-border bg-paper px-5 py-4 text-ink ${focusRing}`}
            id="publish-language"
            name="language"
            onChange={(event) => setLanguage(event.target.value === "es" ? "es" : "en")}
            value={language}
          >
            <option value="en">{strings.englishLabel}</option>
            <option value="es">{strings.spanishLabel}</option>
          </select>
        </div>

        <div className={field}>
          <label className={label} htmlFor="publish-topics">
            {strings.businessTopics}
          </label>
          <textarea
            className={`min-h-[100px] w-full rounded-none border border-border bg-paper px-5 py-4 text-ink ${focusRing}`}
            id="publish-topics"
            name="topics"
            onChange={(event) => setTopics(event.target.value)}
            value={topics}
          />
          <p className="text-sm text-ink/80">{strings.businessTopicsHint}</p>
        </div>

        <div className={field}>
          <label className={label} htmlFor="publish-welcome-en">
            {strings.welcomeEn}
          </label>
          <Input
            id="publish-welcome-en"
            name="welcome-en"
            onChange={(event) => setWelcomeEn(event.target.value)}
            value={welcomeEn}
          />
        </div>

        <div className={field}>
          <label className={label} htmlFor="publish-welcome-es">
            {strings.welcomeEs}
          </label>
          <Input
            id="publish-welcome-es"
            name="welcome-es"
            onChange={(event) => setWelcomeEs(event.target.value)}
            value={welcomeEs}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <Button disabled={busy} type="submit">
            {strings.saveBusiness}
          </Button>
          <Button disabled={busy} onClick={() => void publish()} type="button" variant="secondary">
            {strings.publish}
          </Button>
        </div>

        {isPublished ? <Chip className="self-start">{strings.published}</Chip> : null}

        {message === null ? null : (
          <p className="text-sm font-semibold text-ink" role="status">
            {message}
          </p>
        )}
        {error === null ? null : (
          <p className="text-sm font-semibold text-ink" role="alert">
            {error}
          </p>
        )}
      </form>

      <div className="flex min-w-0 flex-col gap-8">
        <section aria-label={strings.previewTitle} className="flex flex-col gap-3">
          <SectionTitle level="h3">{strings.previewTitle}</SectionTitle>
          <p className="max-w-[65ch] text-sm text-ink/80">{strings.publishPreviewNote}</p>
          <iframe
            key={frame}
            ref={frameRef}
            className="h-[520px] w-full rounded-none border border-ink/10 bg-paper"
            src="/embed"
            title={strings.previewTitle}
          />
        </section>

        <section aria-label={strings.publicLink} className="flex flex-col gap-3">
          <SectionTitle level="h3">{strings.publicLink}</SectionTitle>
          <p className="break-words text-ink [overflow-wrap:anywhere]">{link}</p>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => void copy(link)} size="sm" variant="secondary">
              {strings.copyLink}
            </Button>
            <Link
              className={`inline-flex min-h-11 items-center rounded-none px-4 py-2 text-sm font-bold uppercase tracking-[0.05em] text-ink underline-offset-4 hover:underline ${focusRing}`}
              href="/"
              target="_blank"
            >
              {strings.openLink}
            </Link>
          </div>
        </section>

        <section aria-label={strings.widgetTitle} className="flex flex-col gap-3">
          <SectionTitle level="h3">{strings.widgetTitle}</SectionTitle>
          <pre className="overflow-x-auto rounded-none border border-ink/10 bg-surface p-4 text-sm text-ink">
            <code>{snippet}</code>
          </pre>
          <p className={label}>{strings.widgetSites}</p>
          {widgetSites.length === 0 ? (
            <p className="max-w-[65ch] text-sm text-ink/80">{strings.widgetNoSites}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {widgetSites.map((allowed) => (
                <li className="break-words text-sm text-ink [overflow-wrap:anywhere]" key={allowed}>
                  {allowed}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label={strings.voiceTitle} className="flex flex-col gap-3">
          <SectionTitle level="h3">{strings.voiceTitle}</SectionTitle>
          <p className="max-w-[65ch] text-sm text-ink/80">{strings.voiceBody}</p>
        </section>

        <p className="sr-only">{lang === "es" ? "Panel en español" : "Panel in English"}</p>
      </div>
    </div>
  );
}
