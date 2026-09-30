import type { Lang } from "../settings/business.ts";

// Decision 3 of `openspec/changes/guided-setup-and-knowledge/design.md`: every file of an upload says what happened to
// it in the words of the owner, with its reason and what to do about it. The reason the ingestion wrote is a sentence
// of the command line — it names paths, limits and providers — and the panel never prints it: this module classifies it
// and answers the sentence of a person.

export type UploadOutcome = {
  name: string;
  passages: number;
  /** What the ingestion wrote when the file failed, or `null` when it was read. */
  failure: string | null;
};

export type UploadCopy = Record<Lang, string>;

export type UploadResult =
  | { state: "ready"; name: string; passages: number }
  | { state: "failed"; name: string; title: UploadCopy; advice: UploadCopy };

export const UPLOAD_RESULT_WORDS = {
  scan: {
    title: { en: "This looks like a scan", es: "Esto parece un escaneo" },
    advice: {
      en: "Scanned PDFs are not supported yet. Upload a version with text, or a Word or text file.",
      es: "Los PDF escaneados todavía no se admiten. Sube una versión con texto, o un archivo de Word o de texto.",
    },
  },
  size: {
    title: { en: "This file is too large to read", es: "Este archivo es demasiado grande para leerlo" },
    advice: {
      en: "A file of 20 MB at most. Split it or save it as a smaller one.",
      es: "Un archivo de 20 MB como máximo. Divídelo o guárdalo más pequeño.",
    },
  },
  type: {
    title: { en: "This is not a type we can read", es: "Este tipo de archivo no se puede leer" },
    advice: {
      en: "PDF, Word, Markdown or plain text. An image or a spreadsheet is not read yet.",
      es: "PDF, Word, Markdown o texto plano. Una imagen o una hoja de cálculo todavía no se leen.",
    },
  },
  empty: {
    title: { en: "This file has no text", es: "Este archivo viene sin texto" },
    advice: {
      en: "Check that the file is not empty and upload it again.",
      es: "Revisa que el archivo no esté vacío y súbelo otra vez.",
    },
  },
  search: {
    title: { en: "The search is not connected yet", es: "La búsqueda todavía no está conectada" },
    advice: {
      en: "Finish step 1, or choose search by words in AI and keys.",
      es: "Termina el paso 1, o elige búsqueda por palabras en IA y llaves.",
    },
  },
  other: {
    title: { en: "This file could not be read", es: "Este archivo no se pudo leer" },
    advice: {
      en: "Try again, or upload it in another format.",
      es: "Inténtalo otra vez, o súbelo en otro formato.",
    },
  },
} as const satisfies Record<string, { title: UploadCopy; advice: UploadCopy }>;

export type UploadReason = keyof typeof UPLOAD_RESULT_WORDS;

function reasonOf(failure: string, name: string): UploadReason {
  const text = failure.toLowerCase();

  // The ingestion writes "the file has no readable text" for a PDF whose pages carry no text layer, which is a scan,
  // and for a text file that is empty. The owner reads a different sentence in each case: the first one says what to
  // upload instead, the second one asks to check the file.
  if (/no readable text|no text|is empty/.test(text)) {
    return name.toLowerCase().endsWith(".pdf") ? "scan" : "empty";
  }

  if (/size limit|too large|above the maximum/.test(text)) {
    return "size";
  }

  if (/not an accepted type|not pdf, docx/.test(text)) {
    return "type";
  }

  if (/embeddings|meaning search|search provider|not chosen yet/.test(text)) {
    return "search";
  }

  return "other";
}

export function uploadResult(outcome: UploadOutcome): UploadResult {
  if (outcome.failure === null && outcome.passages > 0) {
    return { state: "ready", name: outcome.name, passages: outcome.passages };
  }

  const reason = reasonOf(outcome.failure ?? "", outcome.name);

  return { state: "failed", name: outcome.name, ...UPLOAD_RESULT_WORDS[reason] };
}
