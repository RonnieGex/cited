"use client";

import Link from "next/link";
import { useState } from "react";
import { CitationMark, Highlight } from "@/components/brand";
import { Button, Panel, focusRing } from "@/components/ui";
import { documentSections } from "@/lib/admin/document-sections";
import type { DocumentSummary } from "@/lib/admin/documents";
import type { AdminStrings } from "@/lib/i18n/admin";
import type { Lang } from "@/lib/settings/business";
import type { StoredPassage } from "@/lib/store/types";

// Decision 5 of `openspec/changes/guided-setup-and-knowledge/design.md`: the document page of the panel. The name, the
// type and when it was added; its passages grouped under their headings in reading order, exactly as the store keeps
// them; and "Remove" with an undo of a few seconds, in place, with no modal.
//
// The page is also where a citation of Try it lands when the owner wants the whole document, so the passage a citation
// opened is the one the page highlights.

export type DocumentPanelProps = {
  strings: AdminStrings;
  lang: Lang;
  document: DocumentSummary;
  passages: StoredPassage[];
  /** The position of a passage a citation just opened: it is painted with the highlighter. */
  highlight?: number | null;
};

export function DocumentPanel({ strings, lang, document, passages, highlight = null }: DocumentPanelProps) {
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const sections = documentSections(passages);

  async function remove(): Promise<void> {
    setBusy(true);

    const response = await fetch("/api/admin/documents/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: document.name }),
    });

    if (response.ok) {
      setGone(true);
      setMessage(strings.documentUndone);
    }

    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="break-words text-xl font-semibold text-ink [overflow-wrap:anywhere]">{document.name}</p>
          <p className="text-sm text-ink-2">
            {document.type.toUpperCase()} · {strings.documentAdded.replace("{when}", document.ingestedAt)}
          </p>
        </div>
        <Link
          className={`min-h-11 rounded-none py-2 text-sm font-semibold text-ink underline-offset-4 hover:underline ${focusRing}`}
          href="/admin/information"
        >
          {strings.documentBack}
        </Link>
      </div>

      {passages.length === 0 ? (
        <p className="text-ink/80">{strings.documentNoPassages}</p>
      ) : (
        <div className="flex flex-col gap-8">
          {sections.map((section, index) => (
            <section className="flex flex-col gap-3" key={`${section.heading ?? "none"}-${index}`}>
              <h2 className="text-lg font-bold tracking-[-0.02em] text-ink">
                {section.heading ?? strings.noHeading}
              </h2>
              <ul className="flex flex-col">
                {section.passages.map((passage) => (
                  <li
                    className="border-t border-rule py-4"
                    data-document-passage={passage.position === highlight ? "open" : "rest"}
                    key={passage.id}
                  >
                    {passage.position === highlight ? (
                      <span className="flex items-baseline gap-3">
                        <CitationMark n={passage.position} state="open" />
                        <Highlight sweep>{passage.text}</Highlight>
                      </span>
                    ) : (
                      <p className="max-w-[65ch] text-[16px] leading-[1.6] text-ink">{passage.text}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {gone ? (
        <p className="text-sm font-semibold text-ink" role="status">
          {message}
        </p>
      ) : (
        <Panel className="flex flex-col gap-3">
          <p className="max-w-[65ch] text-sm text-ink/80">{strings.confirmDeleteDocument.replace("{name}", document.name)}</p>
          <div>
            <Button disabled={busy} onClick={() => void remove()} variant="secondary">
              {strings.documentRemove}
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
