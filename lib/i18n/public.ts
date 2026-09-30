import type { AskFailureKind } from "../chat/client.ts";
import type { Lang } from "../settings/business.ts";

// The strings of the public page and of the widget, one file per lane (design decision 8 of
// `openspec/changes/public-page-and-widget/design.md`). English is first because the demo opens in English.

export type PublicStrings = {
  welcome: string;
  question: { label: string; placeholder: string; submit: string };
  loading: string;
  refusal: string;
  asked: string;
  sources: string;
  citation: (n: number) => string;
  document: string;
  heading: string;
  close: string;
  /** One sentence per kind of failure of a question (decision 21): the page never prints what the server wrote. */
  errors: Record<AskFailureKind, string>;
  retry: string;
  /** What the polite live region of the chat says: the wait, then a short summary of the entry that landed. */
  announce: {
    waiting: string;
    answered: (sources: number) => string;
    refused: (answer: string) => string;
    failed: (detail: string) => string;
  };
  language: string;
  history: string;
  /** The first half of the footer, beside the small wordmark (decision 27). */
  answersBy: string;
  footer: string;
  notReadyTitle: string;
  notReadyBody: string;
  notReadyPanel: string;
  widget: { button: string; title: string; close: string };
};

export const PUBLIC_STRINGS: Record<Lang, PublicStrings> = {
  en: {
    welcome: "Ask anything about this business and get the answer with its sources.",
    question: {
      label: "Your question",
      placeholder: "Type your question",
      submit: "Ask",
    },
    loading: "Looking it up in the documents…",
    refusal: "Not in the documents",
    asked: "You asked",
    sources: "Sources",
    citation: (n) => `Citation ${n}`,
    document: "Document",
    heading: "Heading",
    close: "Close",
    errors: {
      rate_limited: "Too many questions from here. Try again in a while.",
      unavailable: "The answer could not be produced right now.",
      network: "No connection. Check your internet and try again.",
    },
    retry: "Try again",
    announce: {
      waiting: "Question sent. Looking it up in the documents.",
      answered: (sources) => `Answer with ${sources} ${sources === 1 ? "source" : "sources"}`,
      refused: (answer) => `Not in the documents: ${answer}`,
      failed: (detail) => `No answer. ${detail}`,
    },
    language: "Language",
    history: "Conversation",
    answersBy: "Answers by Cited",
    footer: "Built by Katalis",
    notReadyTitle: "This assistant is not ready yet",
    notReadyBody: "This business has not connected its AI yet. If the business is yours, connect it in the panel.",
    notReadyPanel: "Open the panel",
    widget: { button: "Ask us", title: "Ask this business", close: "Close" },
  },
  es: {
    welcome: "Pregunta lo que quieras sobre este negocio y recibe la respuesta con sus fuentes.",
    question: {
      label: "Tu pregunta",
      placeholder: "Escribe tu pregunta",
      submit: "Preguntar",
    },
    loading: "Buscando en los documentos…",
    refusal: "No está en los documentos",
    asked: "Preguntaste",
    sources: "Fuentes",
    citation: (n) => `Cita ${n}`,
    document: "Documento",
    heading: "Apartado",
    close: "Cerrar",
    errors: {
      rate_limited: "Demasiadas preguntas desde aquí. Inténtalo más tarde.",
      unavailable: "Ahora mismo no se pudo responder.",
      network: "Sin conexión. Revisa tu internet e inténtalo de nuevo.",
    },
    retry: "Intentar de nuevo",
    announce: {
      waiting: "Pregunta enviada. Buscando en los documentos.",
      answered: (sources) => `Respuesta con ${sources} ${sources === 1 ? "fuente" : "fuentes"}`,
      refused: (answer) => `No está en los documentos: ${answer}`,
      failed: (detail) => `Sin respuesta. ${detail}`,
    },
    language: "Idioma",
    history: "Conversación",
    answersBy: "Respuestas de Cited",
    footer: "Hecho por Katalis",
    notReadyTitle: "Este asistente todavía no está listo",
    notReadyBody:
      "Este negocio aún no ha conectado su IA. Si el negocio es tuyo, conéctala en el panel.",
    notReadyPanel: "Abrir el panel",
    widget: { button: "Pregúntanos", title: "Pregunta a este negocio", close: "Cerrar" },
  },
};

// The requirement "The public page speaks English first" of `specs/public-chat/spec.md`: the welcome message shown is
// the one of the chosen language, falling back to the other when that one is empty.
export function welcomeFor(
  lang: Lang,
  welcome: { en: string; es: string } | null | undefined,
): string {
  if (welcome !== null && welcome !== undefined) {
    const chosen = welcome[lang]?.trim() ?? "";

    if (chosen.length > 0) {
      return chosen;
    }

    const other = welcome[lang === "en" ? "es" : "en"]?.trim() ?? "";

    if (other.length > 0) {
      return other;
    }
  }

  return PUBLIC_STRINGS[lang].welcome;
}
