"use client";

import { useId, useState, type FormEvent } from "react";
import { Button, Input, Panel } from "@/components/ui";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import type { Lang } from "@/lib/settings/business";
import type { Citation } from "@/lib/answer/types";
import { askCited, type AskResult } from "@/lib/chat/client";
import { sessionId, type TabStorage } from "@/lib/chat/session";
import { PUBLIC_STRINGS, type PublicStrings } from "@/lib/i18n/public";
import { CitationPanel } from "./CitationPanel";
import { Markdown } from "./Markdown";

// Design decision 1 of `openspec/changes/public-page-and-widget/design.md`: one chat component used by `/` and
// `/embed`, with the question box, the list of turns, the citation chips, the refusal style and a loading state in
// words. The requirement "A follow-up keeps its thread in the browser" of `specs/public-chat/spec.md` lives here: every
// question of the tab travels with the same `sessionId`.

export type AskFn = (input: { question: string; sessionId: string }) => Promise<AskResult>;

export type ChatProps = {
  lang: Lang;
  welcome: string;
  variant?: "page" | "embed";
  ask?: AskFn;
  storage?: TabStorage | null;
};

type Turn =
  | { kind: "answered"; question: string; answer: string; citations: Citation[] }
  | { kind: "refused"; question: string; answer: string }
  | { kind: "failed"; question: string; message: string | null };

function turnOf(question: string, result: AskResult): Turn {
  if (result.status === "answered") {
    return { kind: "answered", question, answer: result.answer, citations: result.citations };
  }

  if (result.status === "refused") {
    return { kind: "refused", question, answer: result.answer };
  }

  return { kind: "failed", question, message: result.message };
}

function AnsweredTurn({
  turn,
  strings,
}: {
  turn: Extract<Turn, { kind: "answered" }>;
  strings: PublicStrings;
}) {
  const panelId = `citation-${useId()}`;
  const [open, setOpen] = useState<number | null>(null);
  const citation = turn.citations.find((candidate) => candidate.n === open) ?? null;

  return (
    <li className="flex flex-col gap-3">
      <p className="font-semibold text-ink">{turn.question}</p>
      <div data-cited="answer" className="flex flex-col gap-4">
        <Markdown
          text={turn.answer}
          citationLabel={(n) => strings.citation(n)}
          onCitation={(n) => {
            setOpen((current) => (current === n ? null : n));
          }}
          openCitation={open}
          citationPanelId={panelId}
        />
        {citation === null ? null : (
          <CitationPanel
            citation={citation}
            panelId={panelId}
            labels={{
              document: strings.document,
              heading: strings.heading,
              close: strings.close,
              citation: strings.citation,
            }}
            onClose={() => {
              setOpen(null);
            }}
          />
        )}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70">
            {strings.sources}
          </p>
          <ul className="flex flex-wrap gap-2">
            {turn.citations.map((source) => (
              <li key={source.n}>
                <button
                  type="button"
                  aria-expanded={open === source.n}
                  aria-controls={open === source.n ? panelId : undefined}
                  onClick={() => {
                    setOpen((current) => (current === source.n ? null : source.n));
                  }}
                  className="rounded-none border border-ink/20 px-3 py-1 text-[11px] font-semibold text-ink transition-colors duration-[400ms] ease-out-expo hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--on-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime focus-visible:ring-1 focus-visible:ring-ink"
                >
                  {`[${source.n}] ${source.document}`}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

export function Chat({ lang, welcome, variant = "page", ask, storage }: ChatProps) {
  const strings = PUBLIC_STRINGS[lang];
  const fieldId = useId();
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const asked = ask ?? ((input: { question: string; sessionId: string }) => askCited(input));

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const text = question.trim();

    if (text.length === 0 || loading) {
      return;
    }

    setQuestion("");
    setLoading(true);

    const session = sessionId(storage ?? window.sessionStorage);
    const result = await asked({ question: text, sessionId: session });

    setTurns((current) => [...current, turnOf(text, result)]);
    setLoading(false);
  };

  return (
    <section
      aria-label={strings.history}
      className={`flex w-full flex-col gap-6 ${variant === "embed" ? "p-4" : ""}`}
    >
      <div className="flex justify-end">
        <LanguageSwitch current={lang} />
      </div>

      <p className="max-w-[65ch] text-lg text-ink/80">{welcome}</p>

      {turns.length === 0 ? null : (
        <ol aria-label={strings.history} className="flex flex-col gap-8">
          {turns.map((turn, index) => {
            if (turn.kind === "answered") {
              return <AnsweredTurn key={index} turn={turn} strings={strings} />;
            }

            if (turn.kind === "refused") {
              return (
                <li key={index} className="flex flex-col gap-3">
                  <p className="font-semibold text-ink">{turn.question}</p>
                  <Panel data-cited="refusal" className="flex flex-col gap-3 bg-surface">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70">
                      {strings.refusal}
                    </span>
                    <p className="text-ink/90">{turn.answer}</p>
                  </Panel>
                </li>
              );
            }

            return (
              <li key={index} className="flex flex-col gap-3">
                <p className="font-semibold text-ink">{turn.question}</p>
                <p role="status" className="border-l-2 border-coral pl-4 text-ink">
                  {turn.message ?? strings.error}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {loading ? (
        <p role="status" className="border-l-2 border-[var(--primary)] pl-4 text-ink/80">
          {strings.loading}
        </p>
      ) : null}

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor={fieldId} className="text-sm font-semibold text-ink">
          {strings.question.label}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id={fieldId}
            name="question"
            value={question}
            autoComplete="off"
            placeholder={strings.question.placeholder}
            onChange={(event) => {
              setQuestion(event.target.value);
            }}
          />
          <Button type="submit" variant="brand" disabled={loading} className="sm:w-auto">
            {strings.question.submit}
          </Button>
        </div>
      </form>
    </section>
  );
}
