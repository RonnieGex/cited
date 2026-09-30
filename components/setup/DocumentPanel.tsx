"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
// The undo is real: the press opens a window of a few seconds in which nothing has been deleted yet and the page says
// so, and the request leaves when the window closes. The timer lives outside the component so that walking to another
// page of the panel does not cancel the removal the owner asked for.
//
// The page is also where a citation of Try it lands when the owner wants the whole document, so the passage a citation
// opened is the one the page highlights.

const UNDO_MS = 6000;

let pending: { name: string; timer: ReturnType<typeof setTimeout> } | null = null;

function cancelPending(): void {
  if (pending !== null) {
    clearTimeout(pending.timer);
    pending = null;
  }
}

function removeNow(name: string, onDone: () => void): void {
  cancelPending();

  const timer = setTimeout(() => {
    pending = null;
    void fetch("/api/admin/documents/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(onDone);
  }, UNDO_MS);

  pending = { name, timer };
}

export type DocumentPanelProps = {
  strings: AdminStrings;
  lang: Lang;
  document: DocumentSummary;
  passages: StoredPassage[];
  /** The position of a passage a citation just opened: it is painted with the highlighter. */
  highlight?: number | null;
};

export function DocumentPanel({ strings, lang, document, passages, highlight = null }: DocumentPanelProps) {
  const [removed, setRemoved] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const mounted = useRef(true);
  const sections = documentSections(passages);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  function ask(): void {
    setWaiting(true);
    setMessage(strings.documentRemoving.replace("{name}", document.name));
    removeNow(document.name, () => {
      if (mounted.current) {
        setWaiting(false);
        setRemoved(true);
        setMessage(strings.documentUndone);
      }
    });
  }

  function keep(): void {
    cancelPending();
    setWaiting(false);
    setMessage(strings.documentKept);
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
                    <span className="sr-only">
                      {lang === "es" ? `Pasaje ${passage.position}` : `Passage ${passage.position}`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {removed ? (
        <p className="text-sm font-semibold text-ink" role="status">
          {message}
        </p>
      ) : (
        <Panel className="flex flex-col gap-3">
          <p className="max-w-[65ch] text-sm text-ink/80">{strings.confirmDeleteDocument.replace("{name}", document.name)}</p>
          <div className="flex flex-wrap gap-4">
            <Button disabled={waiting} onClick={ask} variant="secondary">
              {strings.documentRemove}
            </Button>
            {waiting ? (
              // The window of the undo: the document is still in the store and this button keeps it there.
              <Button onClick={keep} variant="secondary">
                {strings.documentUndo}
              </Button>
            ) : null}
          </div>
          {message === null ? null : (
            <p className="text-sm font-semibold text-ink" role="status" data-document-state={waiting ? "waiting" : "idle"}>
              {message}
            </p>
          )}
        </Panel>
      )}
    </div>
  );
}
