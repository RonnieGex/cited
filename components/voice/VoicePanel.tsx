"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input } from "@/components/ui";
import { voiceStrings } from "@/lib/i18n/voice";
import type { Lang } from "@/lib/settings/business";
import {
  SOURCES_TOOL,
  sourceLabel,
  sourcePath,
  sourcesAnswer,
  validateSources,
  type VoiceSource,
} from "./sources";
import { VoiceOrb } from "./voice-orb";
import { ORB_COLORS } from "./voice-config";
import {
  ConversationProvider,
  useVoiceSession,
  type VoiceSession,
} from "./voice-session";
import { requestSignedUrl, type VoiceUrlFailure } from "./voice-url";
import { voiceState } from "./voice-state";

// A port of `components/voice/voice-panel.tsx` of Construye (MIT, read only), adapted to the settings of Cited: the
// session starts with a signed URL of this server instead of a public agent id, the words come in the two languages of
// the product, and the citation chips are the documents and the sections the server tool returned.

interface TranscriptEntry {
  id: number;
  role: "user" | "ai";
  text: string;
}

/** One painted line of the visitor that still expects, at most, one report of the same turn from the SDK. */
interface PendingEcho {
  id: number;
  text: string;
}

export interface VoicePanelProps {
  lang: Lang;
  variant: "section" | "dialog";
  onClose?: () => void;
}

/** The panel needs the SDK provider above it; `ConversationProvider` is the same component in the real SDK and the fake. */
export function VoicePanel(props: VoicePanelProps) {
  return (
    <ConversationProvider>
      <VoicePanelContent {...props} />
    </ConversationProvider>
  );
}

function describeError(message: string, words: ReturnType<typeof voiceStrings>): string {
  const text = message.toLowerCase();

  if (/permission|denied|notallowed|micrófono|microfono|microphone/.test(text)) {
    return words.micError;
  }

  if (/quota|limit|límite|limite|too many|429|exceeded/.test(text)) {
    return words.limitError;
  }

  return words.genericError;
}

function describeFailure(failure: VoiceUrlFailure, words: ReturnType<typeof voiceStrings>): string {
  if (failure === "limit-too-low") {
    return words.limitTooLow;
  }

  if (failure === "limited") {
    return words.limitError;
  }

  if (failure === "not-configured") {
    return words.notConfigured;
  }

  return words.genericError;
}

function VoicePanelContent({ lang, variant, onClose }: VoicePanelProps) {
  const words = voiceStrings(lang);
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [sources, setSources] = useState<VoiceSource[]>([]);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [textOnly, setTextOnly] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  const nextIdRef = useRef(1);
  const sessionRef = useRef<VoiceSession | null>(null);
  const pendingTextRef = useRef("");
  const pendingEchoesRef = useRef<PendingEcho[]>([]);
  const nextEchoIdRef = useRef(1);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (variant === "dialog") {
      closeRef.current?.focus();
    }
  }, [variant]);

  const append = useCallback((role: "user" | "ai", text: string) => {
    const clean = text.trim();

    if (clean === "") {
      return;
    }

    setEntries((current) => [...current, { id: nextIdRef.current++, role, text: clean }]);
  }, []);

  /**
   * Sends a written question and echoes it once it left the browser. The echo is reserved before the send because the
   * SDK may report the turn while `sendUserMessage` is still running: that report consumes the reserve and is not
   * painted. Every successful send keeps its own reserve, so the same question sent twice leaves two lines, and a send
   * that throws drops its reserve and paints nothing.
   */
  const sendQuestion = useCallback(
    (text: string): boolean => {
      const clean = text.trim();
      const active = sessionRef.current;

      if (clean === "" || active === null) {
        return false;
      }

      const reservation: PendingEcho = { id: nextEchoIdRef.current++, text: clean };

      pendingEchoesRef.current = [...pendingEchoesRef.current, reservation];

      try {
        active.sendUserMessage(clean);
      } catch {
        pendingEchoesRef.current = pendingEchoesRef.current.filter(
          (entry) => entry.id !== reservation.id,
        );
        setError(words.genericError);

        return false;
      }

      append("user", clean);

      return true;
    },
    [append, words.genericError],
  );

  const mostrarFuentes = useCallback((parameters: Record<string, unknown>) => {
    const result = validateSources(parameters, window.location.origin);

    setSources(result.fuentes);

    return sourcesAnswer(result);
  }, []);

  const clientTools = useMemo(() => ({ [SOURCES_TOOL]: mostrarFuentes }), [mostrarFuentes]);

  const onMessage = useCallback(
    (payload: { message: string; source: "user" | "ai" }) => {
      if (payload.source === "user") {
        const reported = payload.message.trim();
        const index = pendingEchoesRef.current.findIndex((entry) => entry.text === reported);

        if (index !== -1) {
          pendingEchoesRef.current = pendingEchoesRef.current.filter(
            (_, position) => position !== index,
          );

          return;
        }
      }

      append(payload.source, payload.message);
    },
    [append],
  );

  const onStatusChange = useCallback(
    (status: string) => {
      if (status !== "connected") {
        return;
      }

      setError("");

      const pending = pendingTextRef.current;

      if (pending === "") {
        return;
      }

      pendingTextRef.current = "";

      if (sendQuestion(pending)) {
        setDraft("");
      }
    },
    [sendQuestion],
  );

  const onError = useCallback(
    (message: string) => {
      pendingTextRef.current = "";
      setError(describeError(message, words));
    },
    [words],
  );

  const session = useVoiceSession({ clientTools, onMessage, onError, onStatusChange });

  useEffect(() => {
    sessionRef.current = session;
  });

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(query.matches);

    query.addEventListener("change", onChange);

    return () => query.removeEventListener("change", onChange);
  }, []);

  const connect = useCallback(
    async (onlyText: boolean) => {
      setTextOnly(onlyText);
      setError("");

      const result = await requestSignedUrl();

      if (result.ok === false) {
        setError(describeFailure(result.failure, words));

        return;
      }

      sessionRef.current?.startSession({ signedUrl: result.url, textOnly: onlyText });
    },
    [words],
  );

  const sendText = useCallback(() => {
    const text = draft.trim();

    if (text === "") {
      return;
    }

    const active = sessionRef.current;

    if (active?.status === "connected") {
      if (sendQuestion(text)) {
        setDraft("");
      }

      return;
    }

    // Without a session the text opens a text-only one: whoever cannot use a microphone keeps the same path, and the
    // question stays in the field, and out of the transcript, until the session takes it.
    pendingTextRef.current = text;
    void connect(true);
  }, [connect, draft, sendQuestion]);

  const view = voiceState(
    { status: session.status, mode: session.mode, isSpeaking: session.isSpeaking, textOnly },
    { reducedMotion, lang },
  );

  return (
    <section
      data-testid="voice-panel"
      data-variant={variant}
      role={variant === "dialog" ? "dialog" : undefined}
      aria-label={words.title}
      className="flex w-full flex-col border border-ink/15 bg-paper p-6 md:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink">{words.title}</h2>
          <p className="mt-1 max-w-[65ch] text-sm text-ink/80">{words.intro}</p>
        </div>
        {variant === "dialog" ? (
          <button
            ref={closeRef}
            type="button"
            data-testid="voice-close"
            onClick={onClose}
            aria-label={words.close}
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-ink/20 bg-surface text-lg leading-none text-ink/80 transition-colors duration-[400ms] ease-out-expo hover:text-ink"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="h-48 w-48 md:h-64 md:w-64">
          <VoiceOrb
            agentState={view.orbState}
            colors={ORB_COLORS}
            getInputVolume={session.getInputVolume}
            getOutputVolume={session.getOutputVolume}
            reducedMotion={!view.animate}
          />
        </div>
        <p data-testid="voice-state" role="status" className="text-lg font-bold text-ink">
          {view.label}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {view.canStart ? (
            <button
              type="button"
              data-testid="voice-start"
              className="border border-ink bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--on-primary)] transition-colors duration-[400ms] ease-out-expo hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
              onClick={() => {
                void connect(false);
              }}
            >
              {words.start}
            </button>
          ) : (
            <button
              type="button"
              data-testid="voice-end"
              className="border border-ink/20 bg-surface px-5 py-2 text-sm font-semibold text-ink transition-colors duration-[400ms] ease-out-expo hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
              onClick={() => session.endSession()}
            >
              {words.end}
            </button>
          )}
        </div>
      </div>

      {error ? (
        <p data-testid="voice-error" className="mt-4 border-l-2 border-coral pl-4 text-sm text-ink">
          {error}
        </p>
      ) : null}

      <div
        data-testid="voice-transcript"
        role="log"
        aria-live="polite"
        className="mt-6 max-h-56 space-y-2 overflow-y-auto border border-ink/15 bg-surface p-4"
      >
        {entries.length === 0 ? (
          <p className="text-sm text-ink/70">{words.transcriptEmpty}</p>
        ) : (
          entries.map((entry) => (
            <p key={entry.id} data-testid="voice-message" className="text-sm leading-relaxed">
              <span className="font-bold text-ink/70">
                {entry.role === "user" ? words.you : words.assistant}
              </span>
              <span className="text-ink">{entry.text}</span>
            </p>
          ))
        )}
      </div>

      {sources.length > 0 ? (
        <div data-testid="voice-sources" className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70">
            {words.sources}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sources.map((source) => (
              <Link
                key={source.url}
                data-testid="voice-source"
                href={sourcePath(source.url)}
                title={source.titulo}
                className="inline-flex items-center gap-2 border border-ink/20 bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors duration-[400ms] ease-out-expo hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--on-primary)]"
              >
                <span
                  className="inline-block h-1.5 w-1.5 bg-[var(--primary)]"
                  aria-hidden
                />
                {sourceLabel(source)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="voice-text">
          {words.questionLabel}
        </label>
        <Input
          id="voice-text"
          data-testid="voice-text"
          type="text"
          value={draft}
          maxLength={500}
          autoComplete="off"
          placeholder={words.placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendText();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          data-testid="voice-send"
          variant="brand"
          onClick={sendText}
          disabled={draft.trim().length < 3}
        >
          {words.send}
        </Button>
      </div>

      <p data-testid="voice-privacy" className="mt-3 text-xs text-ink/70">
        {words.privacy}
      </p>
    </section>
  );
}

/** The microphone of the public page and of the widget: the panel is mounted only when it is asked for. */
export function VoiceLauncher({ lang }: { lang: Lang }) {
  const words = voiceStrings(lang);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {open ? null : (
        <Button
          type="button"
          data-testid="voice-launcher"
          variant="brand"
          className="self-start"
          onClick={() => setOpen(true)}
        >
          {words.launcher}
        </Button>
      )}
      {open ? <VoicePanel lang={lang} variant="dialog" onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
