export type QuestionLanguage = "es" | "en";

export const REFUSALS: Record<QuestionLanguage, string> = {
  es: "No encuentro eso en los documentos de este negocio.",
  en: "I can't find that in this business's documents.",
};

const wordPattern = /[\p{L}\p{N}]+/gu;

const spanishWords = new Set([
  "que",
  "cual",
  "cuales",
  "como",
  "cuanto",
  "cuanta",
  "cuantos",
  "cuantas",
  "donde",
  "cuando",
  "quien",
  "quienes",
  "por",
  "para",
  "con",
  "sin",
  "los",
  "las",
  "del",
  "una",
  "uno",
  "unos",
  "unas",
  "es",
  "son",
  "esta",
  "estan",
  "hay",
  "puedo",
  "puede",
  "podemos",
  "tengo",
  "tiene",
  "hace",
  "hacen",
  "cuesta",
  "cuestan",
  "precio",
  "precios",
  "cuenta",
  "politica",
  "politicas",
  "horario",
  "taller",
  "negocio",
  "factura",
  "cita",
  "citas",
  "pago",
  "pagos",
  "bicicleta",
  "bicicletas",
  "cafe",
  "aceptan",
  "aceptamos",
  "aviso",
  "avisar",
  "documentos",
  "reserva",
  "reservas",
  "garantia",
  "reparacion",
  "reparaciones",
  "devolucion",
  "envio",
  "gastos",
  "cancelar",
  "cancelacion",
  "cambio",
  "servicio",
  "servicios",
  "abierto",
  "cerrado",
  "direccion",
  "telefono",
]);

const englishWords = new Set([
  "the",
  "this",
  "that",
  "these",
  "those",
  "what",
  "when",
  "where",
  "which",
  "who",
  "whom",
  "whose",
  "why",
  "how",
  "much",
  "many",
  "does",
  "do",
  "did",
  "is",
  "are",
  "was",
  "were",
  "can",
  "could",
  "should",
  "would",
  "will",
  "have",
  "has",
  "policy",
  "policies",
  "price",
  "prices",
  "cost",
  "costs",
  "open",
  "close",
  "closed",
  "hours",
  "business",
  "invoice",
  "appointment",
  "appointments",
  "payment",
  "payments",
  "bicycle",
  "bicycles",
  "bike",
  "coffee",
  "accept",
  "notice",
  "documents",
  "booking",
  "bookings",
  "guarantee",
  "repair",
  "repairs",
  "refund",
  "shipping",
  "ticket",
  "cancellation",
  "cancel",
  "change",
  "service",
  "services",
  "address",
  "phone",
  "work",
]);

function tokenize(question: string): string[] {
  return (
    question
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .match(wordPattern) ?? []
  );
}

export function detectLanguage(question: string): QuestionLanguage {
  let spanish = 0;
  let english = 0;

  for (const word of tokenize(question)) {
    if (spanishWords.has(word)) {
      spanish += 1;
    }

    if (englishWords.has(word)) {
      english += 1;
    }
  }

  return english > spanish ? "en" : "es";
}

export function refusalMessage(question: string): string {
  return REFUSALS[detectLanguage(question)];
}
