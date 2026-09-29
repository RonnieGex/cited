import type { Lang } from "../settings/business.ts";

// The strings of the public page and of the widget, one file per lane (design decision 8 of
// `openspec/changes/public-page-and-widget/design.md`). English is first because the demo opens in English.

export type PublicStrings = {
  welcome: string;
  question: { label: string; placeholder: string; submit: string };
  loading: string;
  refusal: string;
  sources: string;
  citation: (n: number) => string;
  document: string;
  heading: string;
  close: string;
  error: string;
  language: string;
  history: string;
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
      placeholder: "How much is a bicycle tune-up?",
      submit: "Ask",
    },
    loading: "Looking it up in the documents…",
    refusal: "Not in the documents",
    sources: "Sources",
    citation: (n) => `Citation ${n}`,
    document: "Document",
    heading: "Heading",
    close: "Close",
    error: "The answer could not be fetched. Try again.",
    language: "Language",
    history: "Conversation",
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
      placeholder: "¿Cuánto cuesta una afinación de bicicleta?",
      submit: "Preguntar",
    },
    loading: "Buscando en los documentos…",
    refusal: "No está en los documentos",
    sources: "Fuentes",
    citation: (n) => `Cita ${n}`,
    document: "Documento",
    heading: "Apartado",
    close: "Cerrar",
    error: "No se pudo obtener la respuesta. Inténtalo de nuevo.",
    language: "Idioma",
    history: "Conversación",
    footer: "Built by Katalis",
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
