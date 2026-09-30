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
  /** Decision 8: always under the ask box, in the language of the visitor. */
  discloseAi: string;
  privacyLink: string;
  privacyTitle: string;
  privacyIntro: string;
  privacyProvidersTitle: string;
  privacyChat: string;
  privacyEmbeddings: string;
  privacyWords: string;
  privacyWhere: string;
  privacyNoProvider: string;
  privacyProcessing: string;
  privacyStoredTitle: string;
  privacyStoredBody: string;
  privacyContactTitle: string;
  privacyContactBody: string;
  privacyBack: string;
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
    discloseAi:
      "Answers are written by AI from this business's documents and can be wrong. Do not share personal data.",
    privacyLink: "Privacy",
    privacyTitle: "Privacy",
    privacyIntro:
      "This page says who writes the answers of this assistant, where that happens and what is kept of a conversation.",
    privacyProvidersTitle: "Who processes your data",
    privacyChat: "The answers",
    privacyEmbeddings: "The search",
    privacyWords: "Search by words, with no provider outside this server",
    privacyWhere: "Where it processes the data",
    privacyNoProvider: "Nothing is connected yet.",
    privacyProcessing:
      "The question you write and the passages that answer it travel to the provider above, so it can write the answer. The provider processes them under its own terms.",
    privacyStoredTitle: "What this assistant keeps",
    privacyStoredBody:
      "The questions and the answers are kept in this server for a few days and then deleted. The documents the business uploaded stay in this server until the business removes them.",
    privacyContactTitle: "Something to ask?",
    privacyContactBody: "Write to the business that owns this assistant. Cited keeps no account of yours.",
    privacyBack: "Back to the assistant",
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
    discloseAi:
      "Las respuestas las escribe una IA a partir de los documentos de este negocio y pueden estar equivocadas. No compartas datos personales.",
    privacyLink: "Privacidad",
    privacyTitle: "Privacidad",
    privacyIntro:
      "Esta página dice quién escribe las respuestas de este asistente, dónde ocurre y qué se guarda de una conversación.",
    privacyProvidersTitle: "Quién trata tus datos",
    privacyChat: "Las respuestas",
    privacyEmbeddings: "La búsqueda",
    privacyWords: "Búsqueda por palabras, sin ningún proveedor fuera de este servidor",
    privacyWhere: "Dónde trata los datos",
    privacyNoProvider: "Todavía no hay nada conectado.",
    privacyProcessing:
      "La pregunta que escribes y los pasajes que la responden viajan al proveedor de arriba, para que escriba la respuesta. El proveedor los trata según sus propias condiciones.",
    privacyStoredTitle: "Qué guarda este asistente",
    privacyStoredBody:
      "Las preguntas y las respuestas se guardan en este servidor unos días y después se borran. Los documentos que subió el negocio se quedan en este servidor hasta que el negocio los quite.",
    privacyContactTitle: "¿Algo que preguntar?",
    privacyContactBody: "Escribe al negocio dueño de este asistente. Cited no guarda ninguna cuenta tuya.",
    privacyBack: "Volver al asistente",
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
