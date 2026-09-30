"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { CitationMark, HighlightedTail } from "@/components/brand";
import { Button, Input, Panel, focusRing } from "@/components/ui";
import type { Lang } from "@/lib/settings/business";
import type { Citation } from "@/lib/answer/types";
import { askCited, type AskFailureKind, type AskResult } from "@/lib/chat/client";
import { sessionId, tabOwner, type TabOwner, type TabStorage } from "@/lib/chat/session";
import { PUBLIC_STRINGS, type PublicStrings } from "@/lib/i18n/public";
import { CLOSE_MESSAGE } from "@/lib/widget/messages";
import { CitationPanel } from "./CitationPanel";
import { Marker } from "./Marker";
import { Markdown } from "./Markdown";

// Design decision 1 of `openspec/changes/public-page-and-widget/design.md`: one chat component used by `/` and
// `/embed`, with the question box, the list of turns, the citation marks, the refusal style and a loading state in
// words. The requirement "A follow-up keeps its thread in the browser" of `specs/public-chat/spec.md` lives here: every
// question of the tab travels with the same `sessionId`.
//
// Decisions 9 to 11 of `openspec/changes/brand-identity-ui/design.md`: the welcome is the headline, each turn is an entry
// of a ledger (the question under a label, the answer with its marks, the sources in the margin), waiting shows one bar
// and the ask form stays in reach once the thread exists. The language switch belongs to the band of the page.
//
// The review of step 12: the question is an entry of the ledger from the moment it is sent (the pending entry carries
// the wait), a failed entry keeps its question and asks it again, one polite live region that exists from the first
// render announces the wait and the entry that lands, the page follows the entry that changed, the height of the sticky
// box is reserved for every scroll (`scroll-padding-bottom` on the root) so a focused control never sits under it, and a
// passage that closes gives the focus back to the control that opened it.
//
// Round 14c (decisions 21 to 23 and 25 to 26 of the same file): a failure says one sentence of `PublicStrings.errors` in the
// language of the page and never what the server wrote; the session id survives a storage that throws; the box sticks only
// where there is room for it and, once threaded, shares one row with its button; each source names its passage.

export type AskFn = (input: { question: string; sessionId: string }) => Promise<AskResult>;

export type ChatProps = {
  lang: Lang;
  welcome: string;
  variant?: "page" | "embed";
  ask?: AskFn;
  storage?: TabStorage | null;
  owner?: TabOwner | null;
};

type Turn =
  | { kind: "pending"; question: string }
  | { kind: "answered"; question: string; answer: string; citations: Citation[] }
  | { kind: "refused"; question: string; answer: string }
  | { kind: "failed"; question: string; failure: AskFailureKind };

function turnOf(question: string, result: AskResult): Turn {
  if (result.status === "answered") {
    return { kind: "answered", question, answer: result.answer, citations: result.citations };
  }

  if (result.status === "refused") {
    return { kind: "refused", question, answer: result.answer };
  }

  return { kind: "failed", question, failure: result.kind };
}

function announcement(turn: Turn, strings: PublicStrings): string {
  if (turn.kind === "answered") {
    return strings.announce.answered(turn.citations.length);
  }

  if (turn.kind === "refused") {
    return strings.announce.refused(turn.answer);
  }

  if (turn.kind === "failed") {
    return strings.announce.failed(strings.errors[turn.failure]);
  }

  return strings.announce.waiting;
}

// The viewport height from which the ask box may stick to the foot (decision 23): under it the box would take most of the
// screen (200% and 400% zoom, a phone on its side), so it stays in the flow and the last answer is never hidden.
const STICKY_QUERY = "(min-height: 560px)";

const label = "text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2";
const entry = "border-t border-rule pt-8";

function Asked({ question, strings }: { question: string; strings: PublicStrings }) {
  return (
    <div className="flex flex-col gap-1 lg:col-span-2">
      <p className={label}>{strings.asked}</p>
      <p className="text-[18px] font-semibold leading-[1.4] text-ink">{question}</p>
    </div>
  );
}

function AnsweredTurn({
  turn,
  strings,
  landing,
}: {
  turn: Extract<Turn, { kind: "answered" }>;
  strings: PublicStrings;
  landing: boolean;
}) {
  const id = useId();
  const panelId = `citation-${id}`;
  const sourcesId = `sources-${id}`;
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const citation = turn.citations.find((candidate) => candidate.n === open) ?? null;
  const toggle = (n: number, from: HTMLElement): void => {
    opener.current = from;
    setOpen((current) => (current === n ? null : n));
  };
  // Closing a passage unmounts the button that had the focus: the focus goes back to the mark or the source that
  // opened it, so the keyboard and the screen reader keep their place.
  const close = (): void => {
    setOpen(null);
    opener.current?.focus();
  };
  const onKeyDown = (event: ReactKeyboardEvent<HTMLLIElement>): void => {
    if (event.key !== "Escape" || open === null) {
      return;
    }

    // Handled here: inside the widget, the listener that closes the frame skips an Escape that closed a passage.
    event.preventDefault();
    close();
  };

  useEffect(() => {
    if (open !== null) {
      document.getElementById(panelId)?.scrollIntoView?.({ block: "nearest" });
    }
  }, [open, panelId]);

  return (
    <li
      data-cited="turn"
      onKeyDown={onKeyDown}
      className={`grid scroll-mt-6 gap-x-10 gap-y-4 lg:grid-cols-[minmax(0,1fr)_220px] ${entry}`}
    >
      <Asked question={turn.question} strings={strings} />
      <div data-cited="answer" className="flex min-w-0 flex-col gap-4">
        <Markdown
          text={turn.answer}
          citationLabel={(n) => strings.citation(n)}
          onCitation={toggle}
          openCitation={open}
          citationPanelId={panelId}
          landing={landing}
        />
      </div>
      {/* A group, not a landmark: four entries would list four identical "Sources" regions to a screen reader. */}
      <div
        data-cited="sources"
        role="group"
        aria-labelledby={sourcesId}
        className="flex min-w-0 flex-col gap-2 lg:col-start-2 lg:row-start-2"
      >
        <p id={sourcesId} className={label}>
          {strings.sources}
        </p>
        <ul className="flex flex-col gap-1">
          {turn.citations.map((source) => {
            // Decision 26: the passage first (its heading), the file on a second line unless that would repeat it.
            const shows = source.heading !== null && source.heading !== source.document;

            return (
              <li key={source.n}>
                <button
                  type="button"
                  aria-expanded={open === source.n}
                  aria-controls={open === source.n ? panelId : undefined}
                  onClick={(event) => {
                    toggle(source.n, event.currentTarget);
                  }}
                  className={`group flex w-full items-start rounded-none py-1 text-left text-ink hover:underline max-lg:min-h-11 ${focusRing}`}
                >
                  <span aria-hidden="true" className="flex min-w-0 items-start gap-2 text-base">
                    {/* The color of the business paints a mark at rest only: an open one stays ink under the pointer. */}
                    <CitationMark
                      n={source.n}
                      state={open === source.n ? "open" : "rest"}
                      className={`shrink-0 transition-colors duration-[var(--dur-fast)] ${
                        open === source.n
                          ? ""
                          : "group-hover:bg-[var(--primary)] group-hover:text-[var(--on-primary)]"
                      }`}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="min-w-0 break-words text-sm">{source.heading ?? source.document}</span>
                      {shows ? (
                        <span className="min-w-0 break-words text-xs text-ink-2">{source.document}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className="sr-only">
                    {shows ? `[${source.n}] ${source.heading}, ${source.document}` : `[${source.n}] ${source.document}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {/* After the sources in the order of the page, so on a phone the passage opens below the source just pressed;
          from 1024px it takes the row under the answer. */}
      {citation === null ? null : (
        <div key={citation.n} className="min-w-0 lg:col-start-1 lg:row-start-3">
          <CitationPanel
            citation={citation}
            panelId={panelId}
            labels={{
              document: strings.document,
              heading: strings.heading,
              close: strings.close,
              citation: strings.citation,
            }}
            onClose={close}
          />
        </div>
      )}
    </li>
  );
}

export function Chat({ lang, welcome, variant = "page", ask, storage, owner }: ChatProps) {
  const strings = PUBLIC_STRINGS[lang];
  const fieldId = useId();
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [announced, setAnnounced] = useState("");
  /** The entry that landed last, whatever its position: its marks land, and no other entry's do. */
  const [landedAt, setLandedAt] = useState<number | null>(null);
  /** The id of the tab when the storage cannot keep it (blocked cookies, a third-party frame): one per conversation. */
  const memorySession = useRef<string | null>(null);
  const list = useRef<HTMLOListElement | null>(null);
  const form = useRef<HTMLFormElement | null>(null);
  /** The index of the entry that just changed, which the page brings into view after the render. */
  const follow = useRef<number | null>(null);
  const asked = ask ?? ((input: { question: string; sessionId: string }) => askCited(input));
  const loading = turns.some((turn) => turn.kind === "pending");
  const threaded = turns.length > 0;
  // In the widget the room is short: once the thread exists the welcome goes (the label of the box is for assistive
  // technology only on the page too, decision 23: the placeholder and the ledger say what the box is for).
  const compact = variant === "embed" && threaded;

  // `Escape` inside the iframe belongs to this document and never reaches the page that carries the widget, so the
  // embed asks its parent to close (design decision 4 and the scenario "Escape inside the iframe"). The widget
  // believes only a message from its own origin. The public page posts nothing. An Escape that closed an open passage
  // (the entry prevents its default) does not close the widget as well.
  useEffect(() => {
    if (variant !== "embed") {
      return;
    }

    const onEscape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape" || event.defaultPrevented || window.parent === window) {
        return;
      }

      window.parent.postMessage(CLOSE_MESSAGE, "*");
    };

    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("keydown", onEscape);
    };
  }, [variant]);

  // While the box sticks to the foot, its height is reserved for every scroll of the document: the focus moving to a
  // control and `scrollIntoView` both stop above the box instead of under it (WCAG 2.2, 2.4.11 Focus Not Obscured). The
  // box sticks only where there is room for it (decision 23), so the padding is reserved under the same condition.
  useEffect(() => {
    const box = form.current;

    if (!threaded || box === null) {
      return;
    }

    const root = document.documentElement;
    const room = typeof window.matchMedia === "function" ? window.matchMedia(STICKY_QUERY) : null;
    const reserve = (): void => {
      root.style.scrollPaddingBottom =
        room !== null && room.matches === false ? "" : `${Math.ceil(box.getBoundingClientRect().height) + 16}px`;
    };

    reserve();

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(reserve);

    observer?.observe(box);
    room?.addEventListener?.("change", reserve);

    return () => {
      observer?.disconnect();
      room?.removeEventListener?.("change", reserve);
      root.style.scrollPaddingBottom = "";
    };
  }, [threaded]);

  // The entry that was sent or that landed comes into view above the box, whole when it fits.
  useEffect(() => {
    const at = follow.current;

    if (at === null) {
      return;
    }

    follow.current = null;
    list.current?.children[at]?.scrollIntoView?.({ block: "nearest" });
  }, [turns]);

  // The tab owns the thread only when the id of the storage and the mark of its window agree: a tab opened from another
  // inherits the storage of its opener and not its `window.name`, so it starts a conversation of its own. When the storage
  // cannot be read or written the id lives in memory, so the questions of the tab still share one conversation.
  const sessionOf = (): string => {
    try {
      return sessionId(storage ?? window.sessionStorage, owner ?? tabOwner(window));
    } catch {
      memorySession.current ??= crypto.randomUUID();

      return memorySession.current;
    }
  };

  /** Asks `text`, as a new entry at the end or in place of the failed entry at `replacing`. */
  const send = async (text: string, replacing?: number): Promise<void> => {
    const at = replacing ?? turns.length;

    follow.current = at;
    setAnnounced(strings.announce.waiting);
    setTurns((current) => {
      const pending: Turn = { kind: "pending", question: text };

      return at < current.length
        ? current.map((turn, index) => (index === at ? pending : turn))
        : [...current, pending];
    });

    // Everything after the pending entry sits in one try: a storage that throws, an id that cannot be made or a request
    // that rejects lands a failure entry instead of leaving the wait forever (decision 22).
    let landed: Turn;

    try {
      landed = turnOf(text, await asked({ question: text, sessionId: sessionOf() }));
    } catch {
      landed = { kind: "failed", question: text, failure: "unavailable" };
    }

    follow.current = at;
    setLandedAt(at);
    setTurns((current) => current.map((turn, index) => (index === at ? landed : turn)));
    setAnnounced(announcement(landed, strings));
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const text = question.trim();

    if (text.length === 0 || loading) {
      return;
    }

    setQuestion("");
    await send(text);
  };

  const retry = (event: ReactMouseEvent<HTMLButtonElement>, text: string, index: number): void => {
    // The button leaves with its entry. From the keyboard (a click with no pointer) the focus goes to the box, which
    // is where the next action is; a tap leaves the focus alone, so a phone does not open its keyboard.
    if (event.detail === 0) {
      document.getElementById(fieldId)?.focus();
    }

    void send(text, index);
  };

  return (
    <section aria-label={strings.history} className="flex w-full flex-col gap-8">
      <p data-cited="announcer" role="status" aria-live="polite" className="sr-only">
        {announced}
      </p>

      {compact ? null : (
        <p
          data-cited="welcome"
          className={`rise max-w-[24ch] font-semibold tracking-[-0.02em] text-ink ${
            variant === "embed" ? "text-[22px] leading-[1.2]" : "text-[28px] leading-[1.15] lg:text-[36px]"
          }`}
        >
          <HighlightedTail text={welcome} sweep />
        </p>
      )}

      {threaded ? (
        <ol ref={list} className="flex flex-col gap-8">
          {turns.map((turn, index) => {
            if (turn.kind === "pending") {
              return (
                <li key={`${index}-pending`} data-cited="pending" className={`flex scroll-mt-6 flex-col gap-4 ${entry}`}>
                  <Asked question={turn.question} strings={strings} />
                  {/* No live region here: the announcer above says the wait once. */}
                  <div className="flex flex-col gap-3">
                    <p className="text-ink-2">{strings.loading}</p>
                    <div className="w-full max-w-[240px] bg-rule">
                      <div
                        data-cited="waiting-bar"
                        aria-hidden="true"
                        className="bar h-0.5 w-full bg-[var(--primary)]"
                      />
                    </div>
                  </div>
                </li>
              );
            }

            if (turn.kind === "answered") {
              return (
                <AnsweredTurn
                  key={`${index}-answered`}
                  turn={turn}
                  strings={strings}
                  landing={index === landedAt}
                />
              );
            }

            if (turn.kind === "refused") {
              return (
                <li key={`${index}-refused`} data-cited="turn" className={`flex scroll-mt-6 flex-col gap-4 ${entry}`}>
                  <Asked question={turn.question} strings={strings} />
                  <Panel data-cited="refusal" className="flex max-w-[65ch] items-start gap-4">
                    <Marker tone="ink" glyph="–" />
                    <div className="flex flex-col gap-2">
                      <span className={label}>{strings.refusal}</span>
                      <p className="text-[18px] leading-[1.6] text-ink">{turn.answer}</p>
                    </div>
                  </Panel>
                </li>
              );
            }

            return (
              <li key={`${index}-failed`} data-cited="turn" className={`flex scroll-mt-6 flex-col gap-4 ${entry}`}>
                <Asked question={turn.question} strings={strings} />
                {/* The sentence of the kind of failure, in the language of the page; the announcer says it once. */}
                <div className="flex max-w-[65ch] items-start gap-4">
                  <Marker tone="coral" glyph="!" />
                  <p className="text-[18px] leading-[1.6] text-ink">{strings.errors[turn.failure]}</p>
                </div>
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={loading}
                    onClick={(event) => {
                      retry(event, turn.question, index);
                    }}
                  >
                    {strings.retry}
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}

      <form
        ref={form}
        data-cited="ask"
        onSubmit={submit}
        className={`flex flex-col gap-3 ${
          threaded
            ? "[@media(min-height:560px)]:sticky bottom-0 z-10 border-t border-rule bg-paper pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            : ""
        }`}
      >
        <label htmlFor={fieldId} className={threaded ? "sr-only" : "text-sm font-semibold text-ink"}>
          {strings.question.label}
        </label>
        <div className={threaded ? "flex flex-row items-stretch gap-2" : "flex flex-col gap-3 sm:flex-row sm:items-stretch"}>
          <Input
            id={fieldId}
            name="question"
            value={question}
            autoComplete="off"
            placeholder={strings.question.placeholder}
            className="min-w-0 sm:flex-1"
            onChange={(event) => {
              setQuestion(event.target.value);
            }}
          />
          <Button
            type="submit"
            variant="brand"
            disabled={loading}
            className={threaded ? "shrink-0" : "w-full shrink-0 sm:w-auto"}
          >
            {strings.question.submit}
          </Button>
        </div>
      </form>
    </section>
  );
}
