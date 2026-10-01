"use client";

import { useState, type FormEvent } from "react";
import { PassageBody } from "@/components/chat/PassageBody";
import { CitationMark } from "@/components/brand";
import { Button, Input, Panel } from "@/components/ui";
import { askCited, type AskResult } from "@/lib/chat/client";
import { documentSections } from "@/lib/admin/document-sections";
import type { AdminStrings } from "@/lib/i18n/admin";
import type { Lang } from "@/lib/settings/business";
import type { StoredPassage } from "@/lib/store/types";
import { Markdown } from "@/components/chat/Markdown";

// Decision 6 of `openspec/changes/guided-setup-and-knowledge/design.md`: the owners asks their own documents on the
// left, with the answer and its citation marks, and on the right the document of the chosen citation opens with that
// passage highlighted and brought into view. Up to four suggested questions come from the headings of the documents
// and no model is called to build them. A refusal says the documents do not say it and suggests adding one. "This
// answer is right" verifies the third step; "not right" asks for attention, and the panel says so in words.

export type TryDocument = {
  name: string;
  passages: StoredPassage[];
};

export type TryItPanelProps = {
  strings: AdminStrings;
  lang: Lang;
  documents: TryDocument[];
  suggestions: string[];
  /** The tab of this browser: the thread of the panel is kept like the one of the public page. */
  sessionId?: string;
  ask?: (input: { question: string; sessionId: string }) => Promise<AskResult>;
};

const label = "text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2";

function Passage({
  passage,
  citation,
  label: numbered,
  lang,
}: {
  passage: StoredPassage;
  /** The citation of this passage in the answer, when the answer cited it: the mark reads its number. */
  citation: number | null;
  /** The place of the passage in the document, counted from 1, for the reader of a screen. */
  label: number;
  lang: Lang;
}) {
  const open = citation !== null;

  return (
    <li
      data-citation-passage={open ? "open" : "rest"}
      className={`border-t border-rule py-4 ${open ? "scroll-mt-6" : ""}`}
    >
      <span className="flex items-baseline gap-3">
        {open ? <CitationMark n={citation} state="open" /> : null}
        <span className="min-w-0 flex-1">
          <PassageBody
            className="text-[16px] leading-[1.6] text-ink"
            heading={passage.heading}
            highlighted={open}
            showHeading={false}
            text={passage.text}
          />
        </span>
      </span>
      <span className="sr-only">{lang === "es" ? `Pasaje ${numbered}` : `Passage ${numbered}`}</span>
    </li>
  );
}

export function TryItPanel({ strings, lang, documents, suggestions, sessionId = "panel-try", ask }: TryItPanelProps) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [asked, setAsked] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [marked, setMarked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sends = ask ?? ((input: { question: string; sessionId: string }) => askCited(input));
  const opened = result?.status === "answered" ? (result.citations.find((one) => one.n === open) ?? null) : null;
  const document = opened === null ? null : (documents.find((one) => one.name === opened.document) ?? null);
  // Decision 6 of `passage-display-polish`: the mark beside the passage the answer cited reads that citation's number
  // (`n`) and never the position of the passage in its document. A passage no answer cited shows no mark at all.
  const cited = new Map<number, number>();

  if (result?.status === "answered" && document !== null) {
    for (const source of result.citations) {
      if (source.document !== document.name) {
        continue;
      }

      const passage = document.passages.find((one) => one.position === source.position);

      if (passage !== undefined) {
        cited.set(passage.position, source.n);
      }
    }
  }
  // The lane invites step 2 only when the business has no document at all: a document of the store always carries its
  // passages, so the empty state is "there is nothing to ask yet" and not "this document looks empty".
  const hasDocuments = documents.length > 0;

  async function send(text: string): Promise<void> {
    const trimmed = text.trim();

    if (trimmed.length === 0 || busy) {
      return;
    }

    setBusy(true);
    setOpen(null);
    setMarked(null);
    setAsked(trimmed);

    try {
      const answer = await sends({ question: trimmed, sessionId });

      setResult(answer);
      // The first citation of the answer is the one the panel opens on the right: the owner reads the passage the
      // answer came from without having to guess which mark to press (decision 6), and any other mark opens its own.
      setOpen(answer.status === "answered" ? (answer.citations[0]?.n ?? null) : null);
    } catch {
      setResult({ status: "failed", kind: "unavailable" });
    }

    setBusy(false);
  }

  async function mark(right: boolean): Promise<void> {
    setBusy(true);

    const response = await fetch("/api/admin/try/verify", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ right }),
    });

    setMarked(response.ok ? (right ? strings.answerRightSaved : strings.answerWrongSaved) : strings.saveFailed);
    setBusy(false);
  }

  if (hasDocuments === false) {
    return (
      <Panel className="flex flex-col gap-2">
        <p className="text-ink">{strings.tryNoDocuments}</p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-6">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void send(question);
          }}
        >
          <label className="text-sm font-semibold text-ink" htmlFor="try-question">
            {strings.question.label}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <Input
              autoComplete="off"
              className="min-w-0 sm:flex-1"
              id="try-question"
              name="question"
              onChange={(event) => {
                setQuestion(event.target.value);
              }}
              placeholder={strings.question.placeholder}
              value={question}
            />
            <Button className="shrink-0" disabled={busy} type="submit">
              {strings.question.submit}
            </Button>
          </div>
        </form>

        {suggestions.length === 0 ? null : (
          <div className="flex flex-col gap-2" data-try="suggestions">
            <p className={label}>{strings.suggestedTitle}</p>
            <ul className="flex flex-col items-start gap-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    className="min-h-11 rounded-none text-left text-ink underline underline-offset-4 max-lg:py-2"
                    onClick={() => {
                      setQuestion(suggestion);
                      void send(suggestion);
                    }}
                    type="button"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {asked.length === 0 ? null : (
          <div data-try="turn" className="flex flex-col gap-4 border-t border-rule pt-6">
            <div className="flex flex-col gap-1">
              <p className={label}>{strings.question.label}</p>
              <p className="text-[18px] font-semibold leading-[1.4] text-ink">{asked}</p>
            </div>

            {result === null || busy ? (
              <p className="text-ink-2">{strings.loading}</p>
            ) : result.status === "answered" ? (
              <div className="flex flex-col gap-4">
                <Markdown
                  citationLabel={(n) => strings.citationLabel.replace("{n}", String(n))}
                  onCitation={(n) => {
                    setOpen((current) => (current === n ? null : n));
                  }}
                  openCitation={open}
                  text={result.answer}
                />
                <ul aria-label={strings.sources} className="flex flex-col gap-2">
                  {result.citations.map((source) => (
                    <li key={source.n}>
                      <button
                        aria-expanded={open === source.n}
                        className="flex min-h-11 w-full items-baseline gap-2 rounded-none py-1 text-left text-sm text-ink hover:underline"
                        onClick={() => {
                          setOpen((current) => (current === source.n ? null : source.n));
                        }}
                        type="button"
                      >
                        <CitationMark n={source.n} state={open === source.n ? "open" : "rest"} />
                        <span className="min-w-0 break-words">
                          {source.heading ?? source.document}
                          {source.heading === null ? "" : ` · ${source.document}`}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <Button disabled={busy} onClick={() => void mark(true)} size="sm">
                    {strings.thisIsRight}
                  </Button>
                  <Button disabled={busy} onClick={() => void mark(false)} size="sm" variant="secondary">
                    {strings.thisIsNotRight}
                  </Button>
                </div>
              </div>
            ) : result.status === "refused" ? (
              <Panel className="flex flex-col gap-2">
                <p className="text-[18px] leading-[1.6] text-ink">{result.answer}</p>
                <p className="max-w-[65ch] text-sm text-ink-2">{strings.tryRefusalAdvice}</p>
              </Panel>
            ) : (
              <p className="text-ink" role="alert">
                {strings.errors[result.kind]}
              </p>
            )}

            {marked === null ? null : (
              <p className="text-sm font-semibold text-ink" role="status">
                {marked}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <p className={label}>{strings.tryPassageTitle}</p>
        {opened === null || document === null ? (
          <p className="max-w-[65ch] text-sm text-ink-2">{strings.tryNoCitation}</p>
        ) : (
          <Panel className="flex flex-col gap-4 overflow-x-auto">
            <p className="break-words text-sm font-semibold text-ink [overflow-wrap:anywhere]">{document.name}</p>
            {documentSections(document.passages).map((section, index) => (
              <div className="flex flex-col gap-2" key={`${section.heading ?? "none"}-${index}`}>
                <p className={label}>{section.heading ?? strings.noHeading}</p>
                <ul className="flex flex-col">
                  {section.passages.map((passage) => (
                    <Passage
                      citation={cited.get(passage.position) ?? null}
                      key={passage.id}
                      label={document.passages.indexOf(passage) + 1}
                      lang={lang}
                      passage={passage}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </Panel>
        )}
      </div>
    </div>
  );
}
