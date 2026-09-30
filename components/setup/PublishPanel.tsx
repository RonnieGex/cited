"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button, Chip, Panel, SectionTitle, focusRing } from "@/components/ui";
import { BusinessForm } from "@/components/admin/BusinessForm";
import type { AdminStrings } from "@/lib/i18n/admin";
import type { Business } from "@/lib/settings/business";

// Decision 7 of `openspec/changes/guided-setup-and-knowledge/design.md`: the business form beside the live preview of
// the public page (an `/embed` frame that comes back when the business is saved), the public link with a copy and an
// open control, and the widget code with the sites that may embed it. "Publish" sets the flag of the fourth step.
//
// The form is the one of the panel (`BusinessForm`), name, logo, color, tone, language and the two welcomes, so the
// owner edits the business in one place and never in two: what this component adds is the preview that answers to the
// save and the three ways of sharing the result.
//
// Decision 12: the voice agent of `voice-owner-words` is not rebuilt here — the page of Publish shows it as the third
// way to publish, after the page and the widget.

export type PublishPanelProps = {
  strings: AdminStrings;
  business: Business | null;
  published: boolean;
  /** The origin of this installation, which is what the public link and the widget code carry. */
  site: string;
  widgetSites: string[];
};

const label = "text-sm font-semibold text-ink";

export function PublishPanel({ strings, business, published, site, widgetSites }: PublishPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isPublished, setPublished] = useState(published);
  const [frame, setFrame] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const link = `${site.replace(/\/+$/, "")}/`;
  const snippet = `<script src="${site.replace(/\/+$/, "")}/widget.js" async></script>`;

  // The preview is the real page and it comes back with the business that was just written, without reloading the
  // panel (the scenario "A change of color").
  function refresh(): void {
    setFrame((current) => current + 1);
    frameRef.current?.contentWindow?.location.reload();
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
      refresh();
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
      <div className="flex min-w-0 flex-col gap-8">
        <BusinessForm business={business} onSaved={refresh} strings={strings} />

        <Panel className="flex flex-col gap-3">
          <p className="max-w-[65ch] text-sm text-ink/80">{strings.publishPreviewNote}</p>
          <div className="flex flex-wrap items-center gap-4">
            <Button disabled={busy} onClick={() => void publish()}>
              {strings.publish}
            </Button>
            {isPublished ? <Chip>{strings.published}</Chip> : null}
          </div>
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
        </Panel>
      </div>

      <div className="flex min-w-0 flex-col gap-8">
        <section aria-label={strings.previewTitle} className="flex flex-col gap-3">
          <SectionTitle level="h3">{strings.previewTitle}</SectionTitle>
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
      </div>
    </div>
  );
}
