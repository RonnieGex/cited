import { ADMIN_STRINGS, type AdminStrings } from "../i18n/admin.ts";
import type { Lang } from "../settings/business.ts";

// Decision 3 of `openspec/changes/guided-setup-and-knowledge/design.md`: every file of an upload says what happened to
// it in the words of the owner, with its reason and what to do about it. The reason the ingestion wrote is a sentence
// of the command line — it names paths, limits and providers — and the panel never prints it: this module classifies it
// and answers the words of a person.
//
// The words live in `lib/i18n/admin.ts`, which is the file of the panel, and this module only picks the pair of the
// reason: the panel prints them from the strings it already has and a test of the library reads them in both languages.

export type UploadOutcome = {
  name: string;
  passages: number;
  /** What the ingestion wrote when the file failed, or `null` when it was read. */
  failure: string | null;
};

export type UploadCopy = Record<Lang, string>;

export type UploadReason = "scan" | "size" | "type" | "empty" | "search" | "other";

export type UploadResult =
  | { state: "ready"; name: string; passages: number }
  | { state: "failed"; name: string; reason: UploadReason; title: UploadCopy; advice: UploadCopy };

const COPY: Record<UploadReason, { title: keyof AdminStrings; advice: keyof AdminStrings }> = {
  scan: { title: "uploadScanTitle", advice: "uploadScanAdvice" },
  size: { title: "uploadTooLargeTitle", advice: "uploadTooLargeAdvice" },
  type: { title: "uploadTypeTitle", advice: "uploadTypeAdvice" },
  empty: { title: "uploadNoTextTitle", advice: "uploadNoTextAdvice" },
  search: { title: "uploadSearchTitle", advice: "uploadSearchAdvice" },
  other: { title: "uploadFailedTitle", advice: "uploadFailedAdvice" },
};

/** The pair of sentences the owner reads for one reason, in the language of the panel of the moment. */
export function uploadCopy(reason: UploadReason, strings: AdminStrings): { title: string; advice: string } {
  return {
    title: String(strings[COPY[reason].title]),
    advice: String(strings[COPY[reason].advice]),
  };
}

export function uploadReason(failure: string | null, name: string): UploadReason {
  const text = (failure ?? "").toLowerCase();

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

  const reason = uploadReason(outcome.failure, outcome.name);

  return {
    state: "failed",
    name: outcome.name,
    reason,
    title: { en: uploadCopy(reason, ADMIN_STRINGS.en).title, es: uploadCopy(reason, ADMIN_STRINGS.es).title },
    advice: { en: uploadCopy(reason, ADMIN_STRINGS.en).advice, es: uploadCopy(reason, ADMIN_STRINGS.es).advice },
  };
}
