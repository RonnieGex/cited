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
  error: string;
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
  footer: string;
  widget: { button: string; title: string; close: string };
};

export const PUBLIC_STRINGS: Record<Lang, PublicStrings> = {
  en: {
    welcome: "Ask anything about this business and get the answer with its sources.",
    question: {
      label: "Your question",
      placeholder: "How much is a bicycle tune-up?",
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
    error: "The answer could not be fetched. Try again.",
    retry: "Try again",
    announce: {
      waiting: "Question sent. Looking it up in the documents.",
      answered: (sources) => `Answer with ${sources} ${sources === 1 ? "source" : "sources"}`,
      refused: (answer) => `Not in the documents: ${answer}`,
      failed: (detail) => `No answer. ${detail}`,
    },
    language: "Language",
    history: "Conversation",
    footer: "Built by Katalis",
    widget: { button: "Ask us", title: "Ask this business", close: "Close" },
  },
  es: {
    welcome: "Pregunta lo que quieras sobre este negocio y recibe la respuesta con sus fuentes.",
    question: {
      label: "Tu pregunta",
      placeholder: "¿Cuánto cuesta una afinación de bicicleta?",
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
    error: "No se pudo obtener la respuesta. Inténtalo de nuevo.",
    retry: "Intentar de nuevo",
    announce: {
      waiting: "Pregunta enviada. Buscando en los documentos.",
      answered: (sources) => `Respuesta con ${sources} ${sources === 1 ? "fuente" : "fuentes"}`,
      refused: (answer) => `No está en los documentos: ${answer}`,
      failed: (detail) => `Sin respuesta. ${detail}`,
    },
    language: "Idioma",
    history: "Conversación",
    footer: "Hecho por Katalis",
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
